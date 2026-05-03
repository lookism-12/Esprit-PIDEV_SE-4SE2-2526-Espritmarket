package esprit_market.controller.userController;

import esprit_market.Enum.userEnum.Role;
import esprit_market.config.JwtUtil;
import esprit_market.dto.userDto.AuthResponse;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Social / OAuth login endpoints.
 *
 * <p>All three providers follow the same contract:
 * <ol>
 *   <li>Frontend obtains a token/code from the provider.</li>
 *   <li>Frontend POSTs it here.</li>
 *   <li>We verify it with the provider's API.</li>
 *   <li>We find-or-create the local user and return our own JWT.</li>
 * </ol>
 */
@RestController
@RequestMapping("/api/users/oauth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "OAuth", description = "Social login — Google, GitHub, Facebook")
public class OAuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate = new RestTemplate();

    // ── Config values (set in application.properties / .env) ─────────────────
    @Value("${oauth.github.client-id:}")
    private String githubClientId;

    @Value("${oauth.github.client-secret:}")
    private String githubClientSecret;

    // ── Google ────────────────────────────────────────────────────────────────

    /**
     * Verify a Google ID token (credential) obtained by the GSI popup.
     * Google's tokeninfo endpoint validates the signature and expiry.
     */
    @PostMapping("/google")
    @Operation(summary = "Sign in with Google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String credential = body.get("credential");
        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing credential"));
        }

        // Verify with Google
        Map<String, Object> payload = verifyGoogleToken(credential);
        if (payload == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid Google token"));
        }

        String email     = (String) payload.get("email");
        String firstName = (String) payload.getOrDefault("given_name",  "User");
        String lastName  = (String) payload.getOrDefault("family_name", "");
        String picture   = (String) payload.get("picture");

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Google account has no email"));
        }

        User user = findOrCreate(email, firstName, lastName, picture);
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    // ── GitHub ────────────────────────────────────────────────────────────────

    /**
     * Exchange a GitHub OAuth code for an access token, then fetch the user's
     * primary email and profile.
     */
    @PostMapping("/github")
    @Operation(summary = "Sign in with GitHub")
    public ResponseEntity<?> githubLogin(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing code"));
        }

        // 1. Exchange code → access token
        String accessToken = exchangeGithubCode(code);
        if (accessToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "GitHub code exchange failed"));
        }

        // 2. Fetch user profile
        Map<String, Object> profile = fetchGithubProfile(accessToken);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Could not fetch GitHub profile"));
        }

        // 3. Fetch primary email (may be null in profile if user hides it)
        String email = (String) profile.get("email");
        if (email == null || email.isBlank()) {
            email = fetchGithubPrimaryEmail(accessToken);
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "GitHub account has no public email. Please add a primary email in GitHub settings."));
        }

        String name    = (String) profile.getOrDefault("name", "GitHub User");
        String picture = (String) profile.get("avatar_url");
        String[] parts = name.split(" ", 2);
        String firstName = parts[0];
        String lastName  = parts.length > 1 ? parts[1] : "";

        User user = findOrCreate(email, firstName, lastName, picture);
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    // ── Facebook ──────────────────────────────────────────────────────────────

    /**
     * Verify a Facebook access token obtained by the Facebook JS SDK.
     */
    @PostMapping("/facebook")
    @Operation(summary = "Sign in with Facebook")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> body) {
        String accessToken = body.get("accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing accessToken"));
        }

        // Fetch user info from Facebook Graph API
        Map<String, Object> profile = fetchFacebookProfile(accessToken);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid Facebook token"));
        }

        String email     = (String) profile.get("email");
        String firstName = (String) profile.getOrDefault("first_name", "User");
        String lastName  = (String) profile.getOrDefault("last_name",  "");
        String picture   = extractFacebookPicture(profile);

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Facebook account has no email. Please grant email permission."));
        }

        User user = findOrCreate(email, firstName, lastName, picture);
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    /** Find existing user by email or create a new CLIENT account. */
    private User findOrCreate(String email, String firstName, String lastName, String picture) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            log.info("Creating new OAuth user: {}", email);
            User u = User.builder()
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .avatarUrl(picture)
                    .password("")   // no password for OAuth users
                    .roles(new ArrayList<>(Collections.singletonList(Role.CLIENT)))
                    .enabled(true)
                    .build();
            return userRepository.save(u);
        });
    }

    /** Build the JWT response the frontend expects. */
    private AuthResponse buildAuthResponse(User user) {
        List<String> roles = user.getRoles() == null
                ? List.of("ROLE_CLIENT")
                : user.getRoles().stream().map(r -> "ROLE_" + r.name()).toList();
        String jwt = jwtUtil.generateTokenFromEmail(user.getEmail(), roles);
        return new AuthResponse(jwt, user.getId().toHexString());
    }

    // ── Provider-specific verification ───────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyGoogleToken(String idToken) {
        try {
            return restTemplate.getForObject(
                    "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken,
                    Map.class);
        } catch (Exception e) {
            log.warn("Google token verification failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String exchangeGithubCode(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("client_id",     githubClientId);
            params.add("client_secret", githubClientSecret);
            params.add("code",          code);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            Map<String, Object> response = restTemplate.postForObject(
                    "https://github.com/login/oauth/access_token", request, Map.class);

            return response != null ? (String) response.get("access_token") : null;
        } catch (Exception e) {
            log.warn("GitHub code exchange failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchGithubProfile(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> req = new HttpEntity<>(headers);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    "https://api.github.com/user", HttpMethod.GET, req, Map.class);
            return resp.getBody();
        } catch (Exception e) {
            log.warn("GitHub profile fetch failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String fetchGithubPrimaryEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> req = new HttpEntity<>(headers);
            ResponseEntity<List> resp = restTemplate.exchange(
                    "https://api.github.com/user/emails", HttpMethod.GET, req, List.class);
            if (resp.getBody() == null) return null;

            for (Object item : resp.getBody()) {
                if (!(item instanceof Map)) continue;
                Map<String, Object> entry = (Map<String, Object>) item;
                if (Boolean.TRUE.equals(entry.get("primary")) && Boolean.TRUE.equals(entry.get("verified"))) {
                    return (String) entry.get("email");
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("GitHub email fetch failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchFacebookProfile(String accessToken) {
        try {
            String url = "https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=" + accessToken;
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.warn("Facebook profile fetch failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractFacebookPicture(Map<String, Object> profile) {
        try {
            Map<String, Object> pic  = (Map<String, Object>) profile.get("picture");
            Map<String, Object> data = (Map<String, Object>) pic.get("data");
            return (String) data.get("url");
        } catch (Exception e) {
            return null;
        }
    }
}
