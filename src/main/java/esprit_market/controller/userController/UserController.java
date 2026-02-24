package esprit_market.controller.userController;

import esprit_market.dto.AuthResponse;
import esprit_market.dto.LoginRequest;
import esprit_market.dto.RegisterRequest;
import esprit_market.entity.user.User;
import esprit_market.service.userService.UserService;
import esprit_market.config.JwtUtil;
import esprit_market.Enum.userEnum.Role;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        if (userService.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: Email is already in use!"));
        }

        User user = User.builder()
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .roles(Collections.singletonList(Role.CLIENT))
                .enabled(true)
                .build();

        User savedUser = userService.save(user);

        // Exclude password from response
        savedUser.setPassword(null);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        String jwt = jwtUtil.generateToken(authentication);
        return ResponseEntity.ok(new AuthResponse(jwt));
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable ObjectId id) {
        return userService.findById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable ObjectId id) {
        userService.deleteById(id);
    }
}
