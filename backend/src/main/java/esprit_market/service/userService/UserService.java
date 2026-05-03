package esprit_market.service.userService;

import esprit_market.config.Exceptions.BadRequestException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.userDto.UserDTO;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.mappers.userMapper.UserMapper;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.Enum.userEnum.Role;
import esprit_market.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final CloudinaryService cloudinaryService;

    @Override
    public Page<UserDTO> findAll(Pageable pageable) {
        log.info("Fetching all users with pagination: page={}, size={}", 
                pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAll(pageable).map(userMapper::toDTO);
    }

    @Override
    public Page<UserDTO> findAll(Pageable pageable, Role role) {
        if (role == null) {
            return findAll(pageable);
        }
        log.info("Fetching users by role {} with pagination: page={}, size={}",
                role, pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findByRolesContaining(role, pageable).map(userMapper::toDTO);
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
        
        // ✅ CRITICAL: Create shop automatically for PROVIDER and SELLER roles
        if (user.getRoles() != null && 
            (user.getRoles().contains(Role.PROVIDER) || user.getRoles().contains(Role.SELLER))) {
            // Check if shop already exists for this user
            if (shopRepository.findByOwnerId(savedUser.getId()).isEmpty()) {
                // Generate shop name from business name or user name
                String shopName = user.getBusinessName() != null && !user.getBusinessName().trim().isEmpty()
                        ? user.getBusinessName()
                        : (user.getFirstName() != null ? user.getFirstName() : "Provider") + "'s Shop";
                
                String shopDescription = user.getDescription() != null && !user.getDescription().trim().isEmpty()
                        ? user.getDescription()
                        : "Welcome to " + shopName;
                
                Shop shop = Shop.builder()
                        .ownerId(savedUser.getId())
                        .name(shopName)
                        .description(shopDescription)
                        .email(savedUser.getEmail())
                        .phone(savedUser.getPhone())
                        .isActive(true)
                        .createdAt(java.time.LocalDateTime.now())
                        .updatedAt(java.time.LocalDateTime.now())
                        .productIds(new java.util.ArrayList<>())
                        .build();
                Shop savedShop = shopRepository.save(shop);
                log.info("✅ Shop '{}' created automatically for provider: {} with shop ID: {}", 
                        savedShop.getName(), savedUser.getEmail(), savedShop.getId());
            }
        }
        
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
        return updateProfile(userId, firstName, lastName, phone, null, null, null, null);
    }

    @Override
    @Transactional
    public UserDTO updateProfile(String userId, String firstName, String lastName, String phone,
                                 String deliveryZone, String vehicleType,
                                 Double currentLatitude, Double currentLongitude) {
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

        if (deliveryZone != null && !deliveryZone.isBlank()) {
            user.setDeliveryZone(deliveryZone);
            log.debug("Delivery zone updated to: {}", deliveryZone);
        }
        if (vehicleType != null && !vehicleType.isBlank()) {
            user.setVehicleType(vehicleType);
            log.debug("Vehicle type updated to: {}", vehicleType);
        }
        if (currentLatitude != null && currentLongitude != null) {
            user.setCurrentLatitude(currentLatitude);
            user.setCurrentLongitude(currentLongitude);
            user.setLastLocationUpdatedAt(java.time.LocalDateTime.now());
            log.debug("Courier location updated to: {}, {}", currentLatitude, currentLongitude);
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

        // Delete old avatar from Cloudinary if it exists
        if (user.getAvatarUrl() != null && user.getAvatarUrl().contains("cloudinary.com")) {
            cloudinaryService.delete(user.getAvatarUrl());
        }

        String avatarUrl = cloudinaryService.upload(file, "avatars");
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        log.info("Avatar uploaded for user: {} → {}", email, avatarUrl);
        return avatarUrl;
    }

    @Override
    public java.util.Map<String, Long> getMonthlyUserGrowth() {
        return userRepository.getMonthlyUserGrowth().stream()
                .collect(java.util.stream.Collectors.toMap(
                        esprit_market.dto.carpooling.stats.AggregationResult::getId,
                        esprit_market.dto.carpooling.stats.AggregationResult::getCount,
                        (v1, v2) -> v1,
                        java.util.TreeMap::new
                ));
    }
}
