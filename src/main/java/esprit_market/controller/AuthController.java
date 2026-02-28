package esprit_market.controller;

import esprit_market.config.JwtUtil;
import esprit_market.dto.JwtResponse;
import esprit_market.dto.LoginRequest;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for login and token generation")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtils;

    @Operation(summary = "Authenticate user and generate JWT token")
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        String roleStr = user.getRoles() != null && !user.getRoles().isEmpty() ? user.getRoles().get(0).name() : "USER";

        return ResponseEntity.ok(new JwtResponse(jwt, user.getEmail(), roleStr));
    }

    @GetMapping("/debug")
    public ResponseEntity<?> debugAdmin() {
        return ResponseEntity.ok(userRepository.findByEmail("admin@espritmarket.tn").orElse(null));
    }
}
