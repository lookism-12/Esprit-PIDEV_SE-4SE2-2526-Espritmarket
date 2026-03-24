package esprit_market.service.userService;

import esprit_market.config.Exceptions.BadRequestException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.userDto.UserDTO;
import esprit_market.entity.user.User;
import esprit_market.mappers.userMapper.UserMapper;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Value("${app.upload.dir:uploads/avatars}")
    private String uploadDir;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    public Page<UserDTO> findAll(Pageable pageable) {
        log.info("Fetching all users with pagination: page={}, size={}", 
                pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAll(pageable).map(userMapper::toDTO);
    }

    @Override
    public UserDTO findById(String id) {
        log.info("Fetching user by id: {}", id);
        User user = userRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toDTO(user);
    }

    @Override
    @Transactional
    public UserDTO save(User user) {
        log.info("Saving user with email: {}", user.getEmail());
        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }

    @Override
    @Transactional
    public void deleteById(String id) {
        log.info("Deleting user by id: {}", id);
        if (!userRepository.existsById(new ObjectId(id))) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(new ObjectId(id));
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional
    public String initiatePasswordReset(String email) {
        log.info("Initiating password reset for email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        log.info("Password reset token generated for user: {}", email);
        return token;
    }

    @Override
    @Transactional
    public void completePasswordReset(String token, String newPassword) {
        log.info("Completing password reset");
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        log.info("Password reset completed for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public UserDTO updateProfile(String userId, String firstName, String lastName, String phone) {
        log.info("Updating profile for user: {}", userId);
        
        User user = userRepository.findById(new ObjectId(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        log.debug("User found: {}", user.getEmail());

        if (firstName != null && !firstName.isBlank()) {
            user.setFirstName(firstName);
            log.debug("First name updated to: {}", firstName);
        }
        if (lastName != null && !lastName.isBlank()) {
            user.setLastName(lastName);
            log.debug("Last name updated to: {}", lastName);
        }
        if (phone != null && !phone.isBlank()) {
            user.setPhone(phone);
            log.debug("Phone updated to: {}", phone);
        }

        try {
            User updatedUser = userRepository.save(user);
            log.info("User saved to repository: {}", updatedUser.getId());
            
            UserDTO dto = userMapper.toDTO(updatedUser);
            log.info("Profile updated for user: {}", userId);
            log.debug("Returned DTO: firstName={}, lastName={}, phone={}", dto.getFirstName(), dto.getLastName(), dto.getPhone());
            
            return dto;
        } catch (Exception e) {
            log.error("Error saving user profile", e);
            throw new RuntimeException("Failed to save profile: " + e.getMessage(), e);
        }
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Override
    public ObjectId resolveUserId(String email) {
        User user = findByEmail(email);
        return user.getId();
    }

    @Override
    @Transactional
    public String uploadAvatar(String email, MultipartFile file) throws Exception {
        log.info("Uploading avatar for user: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (file.isEmpty()) {
            log.warn("Empty file upload attempted by user: {}", email);
            throw new BadRequestException("File is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            log.warn("Invalid file type for user {}: {}", email, contentType);
            throw new BadRequestException("Invalid file format. Only images are allowed.");
        }

        // Validate file size (10MB max, but warn at 5MB)
        long maxSize = 10 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            log.warn("File too large for user {}: {} bytes", email, file.getSize());
            throw new BadRequestException("File size exceeds 10MB limit");
        }

        try {
            // Use temp directory for better compatibility
            String uploadDirPath = uploadDir;
            Path uploadPath = Paths.get(uploadDirPath).toAbsolutePath();
            
            log.debug("Upload directory: {}", uploadPath);
            
            // Create directory if it doesn't exist
            if (!Files.exists(uploadPath)) {
                log.info("Creating upload directory: {}", uploadPath);
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);

            log.info("Saving file to: {}", filePath);
            
            // Save file
            Files.write(filePath, file.getBytes());
            
            log.info("File saved successfully: {}", filename);

            // Generate URL for retrieval
            String avatarUrl = "/uploads/avatars/" + filename;

            // Update user avatar URL in database
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            log.info("Avatar uploaded successfully for user: {}, URL: {}, Size: {} bytes", 
                    email, avatarUrl, file.getSize());
            return avatarUrl;

        } catch (BadRequestException e) {
            log.warn("Validation error in avatar upload: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error uploading avatar for user {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to upload avatar: " + e.getMessage(), e);
        }
    }
}
