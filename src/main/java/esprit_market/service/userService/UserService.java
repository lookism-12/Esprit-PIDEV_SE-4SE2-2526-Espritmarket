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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

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
    public UserDTO updateProfile(String userId, String firstName, String lastName) {
        log.info("Updating profile for user: {}", userId);
        User user = userRepository.findById(new ObjectId(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (firstName != null && !firstName.isBlank()) {
            user.setFirstName(firstName);
        }
        if (lastName != null && !lastName.isBlank()) {
            user.setLastName(lastName);
        }

        User updatedUser = userRepository.save(user);
        log.info("Profile updated for user: {}", userId);
        return userMapper.toDTO(updatedUser);
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
}
