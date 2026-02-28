package esprit_market.controller.userController;

import esprit_market.dto.LoginRequestDTO;
import esprit_market.dto.LoginResponseDTO;
import esprit_market.dto.RegisterRequestDTO;
import esprit_market.dto.UserDTO;
import esprit_market.entity.user.User;
import esprit_market.service.userService.UserService;
import esprit_market.Enum.userEnum.Role;
import esprit_market.config.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "APIs for user registration, authentication, and management")
public class UserController {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @GetMapping
    @Operation(summary = "Get all users", security = @SecurityRequirement(name = "BearerAuth"))
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public List<UserDTO> getAllUsers() {
        return userService.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @PostMapping
    @Operation(summary = "Create a new user", security = @SecurityRequirement(name = "BearerAuth"))
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public UserDTO createUser(@RequestBody User user) {
        if (user.getRoles() == null) {
            user.setRoles(new java.util.ArrayList<>(Collections.singletonList(Role.CLIENT)));
        }
        // Ensure role consistency if profiles exist (though profiles should create
        // roles)
        if (user.getDriverProfileId() != null && !user.getRoles().contains(Role.DRIVER)) {
            user.getRoles().add(Role.DRIVER);
        }
        if (user.getPassengerProfileId() != null && !user.getRoles().contains(Role.PASSENGER)) {
            user.getRoles().add(Role.PASSENGER);
        }
        User savedUser = userService.save(user);
        return toDTO(savedUser);
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId().toString());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setRoles(user.getRoles().stream().map(Role::name).collect(Collectors.toList()));
        return dto;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", security = @SecurityRequirement(name = "BearerAuth"))
    public User getUserById(@PathVariable ObjectId id) {
        return userService.findById(id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user by ID", security = @SecurityRequirement(name = "BearerAuth"))
    public void deleteUser(@PathVariable ObjectId id) {
        userService.deleteById(id);
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with the provided details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "400", description = "Email already exists", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        if (userService.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new java.util.ArrayList<>(List.of(Role.CLIENT, Role.PASSENGER)))
                .enabled(true)
                .build();

        User savedUser = userService.save(user);

        UserDTO response = new UserDTO();
        response.setId(savedUser.getId().toString());
        response.setFirstName(savedUser.getFirstName());
        response.setLastName(savedUser.getLastName());
        response.setEmail(savedUser.getEmail());
        response.setRoles(savedUser.getRoles().stream().map(Role::name).collect(Collectors.toList()));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get JWT token", description = "Authenticates user credentials and returns a JWT token for API access")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful", content = @Content(mediaType = "application/json", schema = @Schema(implementation = LoginResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid email or password", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            String token = jwtUtil.generateToken(authentication);
            return ResponseEntity.ok(new LoginResponseDTO(token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid email or password");
        }
    }
}
