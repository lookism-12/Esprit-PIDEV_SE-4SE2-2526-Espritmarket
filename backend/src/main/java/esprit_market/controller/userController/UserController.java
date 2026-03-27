package esprit_market.controller.userController;

import esprit_market.Enum.userEnum.Role;
import esprit_market.config.Exceptions.DuplicateResourceException;
import esprit_market.config.Exceptions.BadRequestException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.config.JwtUtil;
import esprit_market.dto.user.*;
import esprit_market.entity.user.User;
import esprit_market.mappers.userMapper.UserMapper;
import esprit_market.service.userService.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management and authentication endpoints")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final IUserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request for email: {}, role: {}", request.getEmail(), request.getRole());

        if (userService.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        // Determine role from request or default to CLIENT
        Role userRole = Role.CLIENT;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                userRole = Role.valueOf(request.getRole().toUpperCase());
                log.info("User role set to: {}", userRole);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role provided: {}, defaulting to CLIENT", request.getRole());
                userRole = Role.CLIENT;
            }
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .roles(Collections.singletonList(userRole))
                .enabled(true)
                // Client/Passenger fields
                .address(request.getAddress())
                // Provider fields
                .businessName(request.getBusinessName())
                .businessType(request.getBusinessType())
                .taxId(request.getTaxId())
                .description(request.getDescription())
                // Driver fields
                .drivingLicenseNumber(request.getDrivingLicenseNumber())
                // Logistics fields
                .vehicleType(request.getVehicleType())
                // Delivery fields
                .deliveryZone(request.getDeliveryZone())
                .build();

        UserDTO savedUser = userService.save(user);
        log.info("User registered successfully: {} with role: {}", request.getEmail(), userRole);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String jwt = jwtUtil.generateToken(authentication);
        User user = userService.findByEmail(request.getEmail());

        log.info("User logged in successfully: {}", request.getEmail());
        return ResponseEntity.ok(new AuthResponse(jwt, user.getId().toHexString()));
    }

    @GetMapping
    @Operation(summary = "Get all users with pagination")
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.findAll(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user by ID")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Initiate password reset")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Password reset requested for: {}", request.getEmail());

        String token = userService.initiatePasswordReset(request.getEmail());
        User user = userService.findByEmail(request.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "Password reset token generated",
                "token", token,
                "userId", user.getId().toHexString()));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Complete password reset")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        userService.completePasswordReset(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile (full replacement)")
    public ResponseEntity<UserDTO> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        
        log.info("Updating user profile for: {}", authentication.getName());
        
        String userId = userService.resolveUserId(authentication.getName()).toHexString();
        
        UserDTO updated = userService.updateProfile(userId, request.getFirstName(), request.getLastName(), request.getPhone());
        
        log.info("Profile updated successfully for user: {}", authentication.getName());
        
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/me")
    @Operation(summary = "Partial update current user profile")
    public ResponseEntity<UserDTO> partialUpdateProfile(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        log.info("Patching user profile for: {}", userEmail);
        
        try {
            // Extract fields from map
            String firstName = request.get("firstName") != null ? request.get("firstName").toString() : null;
            String lastName = request.get("lastName") != null ? request.get("lastName").toString() : null;
            String phone = request.get("phone") != null ? request.get("phone").toString() : null;
            
            // Validate only non-null fields
            if (firstName != null && !firstName.isEmpty()) {
                if (firstName.length() < 2 || firstName.length() > 50) {
                    throw new BadRequestException("First name must be between 2 and 50 characters");
                }
            }
            
            if (lastName != null && !lastName.isEmpty()) {
                if (lastName.length() < 2 || lastName.length() > 50) {
                    throw new BadRequestException("Last name must be between 2 and 50 characters");
                }
            }
            
            if (phone != null && !phone.isEmpty()) {
                if (!phone.matches("^[0-9]{8,15}$")) {
                    throw new BadRequestException("Phone must be 8-15 digits");
                }
            }
            
            String userId = userService.resolveUserId(userEmail).toHexString();
            log.debug("User ID: {}", userId);
            
            UserDTO updated = userService.updateProfile(userId, firstName, lastName, phone);
            log.info("Profile updated successfully for user: {}", userEmail);
            
            return ResponseEntity.ok(updated);
            
        } catch (BadRequestException e) {
            log.warn("Validation error in profile update: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error updating profile for user {}", userEmail, e);
            throw e;
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        User user = userService.findByEmail(authentication.getName());
        return ResponseEntity.ok(userMapper.toDTO(user));
    }

    @PostMapping("/me/avatar")
    @Operation(summary = "Upload user avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        log.info("Avatar upload requested by user: {}", authentication.getName());
        
        try {
            if (file == null || file.isEmpty()) {
                log.warn("Empty file upload attempted");
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            log.debug("File: {}, Size: {} bytes, Type: {}", 
                    file.getOriginalFilename(), file.getSize(), file.getContentType());
            
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("Invalid file type: {}", contentType);
                return ResponseEntity.badRequest().body(Map.of("error", "File must be an image"));
            }
            
            // Create upload path using absolute path for consistency
            java.nio.file.Path uploadPath;
            String uploadDirConfig = System.getenv("AVATAR_UPLOAD_DIR");
            
            if (uploadDirConfig != null && !uploadDirConfig.isEmpty()) {
                // Use environment variable if set (for Docker/production)
                uploadPath = java.nio.file.Paths.get(uploadDirConfig).toAbsolutePath();
                log.info("Using AVATAR_UPLOAD_DIR from environment: {}", uploadPath);
            } else {
                // Use project directory + uploads/avatars (for development)
                uploadPath = java.nio.file.Paths.get(System.getProperty("user.dir"))
                        .resolve("uploads")
                        .resolve("avatars")
                        .toAbsolutePath();
                log.info("Using default upload directory: {}", uploadPath);
            }
            
            log.debug("Absolute upload path: {}", uploadPath);
            
            // Create directory if needed
            if (!java.nio.file.Files.exists(uploadPath)) {
                log.info("Creating upload directory at: {}", uploadPath);
                java.nio.file.Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String original = file.getOriginalFilename();
            if (original == null || !original.contains(".")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
            }
            
            String ext = original.substring(original.lastIndexOf("."));
            String filename = java.util.UUID.randomUUID().toString() + ext;
            java.nio.file.Path filePath = uploadPath.resolve(filename);
            
            // Save file
            log.debug("Saving file to: {}", filePath.toAbsolutePath());
            java.nio.file.Files.copy(file.getInputStream(), filePath, 
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            log.info("✅ Avatar file saved successfully!");
            log.info("   Absolute path: {}", filePath.toAbsolutePath());
            log.info("   File exists: {}", java.nio.file.Files.exists(filePath));
            log.info("   File size: {} bytes", java.nio.file.Files.size(filePath));
            
            // Generate URL
            String avatarUrl = "/uploads/avatars/" + filename;
            log.info("   Returned URL: {}", avatarUrl);
            
            // Update user
            String userEmail = authentication.getName();
            User user = userService.findByEmail(userEmail);
            user.setAvatarUrl(avatarUrl);
            userService.save(user);
            
            log.info("Avatar uploaded successfully for user: {}, URL: {}", userEmail, avatarUrl);
            return ResponseEntity.ok(Map.of("url", avatarUrl));

        } catch (Exception e) {
            log.error("Avatar upload failed", e);
            return ResponseEntity.status(500)
                    .body(Map.of(
                        "error", e.getMessage() != null ? e.getMessage() : "Upload failed",
                        "type", e.getClass().getSimpleName()
                    ));
        }
    }

    @PostMapping("/me/password")
    @Transactional
    @Operation(summary = "Change current user password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        log.info("=============== PASSWORD CHANGE START ===============");
        log.info("User: {}", authentication.getName());
        
        try {
            String userEmail = authentication.getName();
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            
            log.info("1. Inputs received:");
            log.info("   - currentPassword: {}", currentPassword != null ? "provided" : "NULL");
            log.info("   - newPassword: {}", newPassword != null ? "provided" : "NULL");
            
            // Validate inputs
            if (currentPassword == null || currentPassword.trim().isEmpty()) {
                log.warn("2. ERROR: Current password is empty");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Current password is required"));
            }
            
            if (newPassword == null || newPassword.trim().isEmpty()) {
                log.warn("2. ERROR: New password is empty");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "New password is required"));
            }
            
            if (newPassword.length() < 8) {
                log.warn("2. ERROR: New password too short: {} chars", newPassword.length());
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Password must be at least 8 characters"));
            }
            
            log.info("2. Validation passed");
            
            // Find user
            log.info("3. Finding user by email: {}", userEmail);
            User user = userService.findByEmail(userEmail);
            log.info("4. User found: id={}, email={}", user.getId(), user.getEmail());
            
            // Verify current password
            log.info("5. Verifying current password...");
            boolean passwordMatches = passwordEncoder.matches(currentPassword, user.getPassword());
            log.info("6. Password matches: {}", passwordMatches);
            
            if (!passwordMatches) {
                log.warn("7. ERROR: Current password does not match");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "Current password is incorrect"));
            }
            
            log.info("7. Current password verified");
            
            // Encode and set new password
            log.info("8. Encoding new password...");
            String encodedPassword = passwordEncoder.encode(newPassword);
            log.info("9. Password encoded, setting on user object...");
            user.setPassword(encodedPassword);
            
            // Save user
            log.info("10. Saving user to database...");
            UserDTO savedUser = userService.save(user);
            log.info("11. User saved successfully: {}", savedUser.getId());
            
            // Verify password was actually saved to database
            log.info("12. Verifying password was saved to database...");
            User verifyUser = userService.findByEmail(userEmail);
            boolean passwordChangeVerified = passwordEncoder.matches(newPassword, verifyUser.getPassword());
            log.info("13. Password verification: {}", passwordChangeVerified ? " SUCCESS" : " FAILED");
            
            if (!passwordChangeVerified) {
                log.error(" PASSWORD VERIFICATION FAILED - Password was not actually saved!");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("success", false, "error", "Password change failed during verification"));
            }
            
            log.info("=============== PASSWORD CHANGE SUCCESS ===============");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password changed successfully"
            ));
            
        } catch (Exception e) {
            log.error("=============== PASSWORD CHANGE FAILED ===============");
            log.error("ERROR: {}", e.getMessage(), e);
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "success", false,
                        "error", "Password change failed",
                        "message", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred"
                    ));
        }
    }

    @GetMapping("/debug/uploads")
    @Operation(summary = "Debug endpoint - check upload directory")
    public ResponseEntity<Map<String, Object>> debugUploadDir() {
        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads/avatars").toAbsolutePath();
            boolean exists = java.nio.file.Files.exists(uploadPath);
            
            Map<String, Object> debug = new java.util.HashMap<>();
            debug.put("uploadDir", uploadPath.toString());
            debug.put("exists", exists);
            
            if (exists) {
                try (var stream = java.nio.file.Files.list(uploadPath)) {
                    java.util.List<String> files = stream
                            .map(p -> p.getFileName().toString())
                            .toList();
                    debug.put("files", files);
                    debug.put("fileCount", files.size());
                }
            }
            
            System.out.println("DEBUG UPLOAD DIR: " + debug);
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
