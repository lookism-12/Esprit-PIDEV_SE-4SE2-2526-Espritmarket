package esprit_market.service.userService;

import esprit_market.config.Exceptions.BadRequestException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.userDto.UserDTO;
import esprit_market.entity.user.User;
import esprit_market.mappers.userMapper.UserMapper;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link UserService}.
 *
 * Dependencies mocked: UserRepository, PasswordEncoder, UserMapper.
 * No Spring context is loaded — pure unit tests with JUnit 5 + Mockito.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService — Tests Unitaires")
class UserServiceTest {

    // ─── Mocks ───────────────────────────────────────────────────────────────

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    // ─── Fixtures ────────────────────────────────────────────────────────────

    private ObjectId userId;
    private User sampleUser;
    private UserDTO sampleDTO;

    @BeforeEach
    void setUp() {
        // Inject @Value field manually (no Spring context)
        ReflectionTestUtils.setField(userService, "uploadDir", "uploads/avatars");

        userId = new ObjectId();

        sampleUser = User.builder()
                .id(userId)
                .firstName("Eya")
                .lastName("Ben Ali")
                .email("eya@test.tn")
                .phone("22222222")
                .enabled(true)
                .build();

        sampleDTO = UserDTO.builder()
                .id(userId.toHexString())
                .firstName("Eya")
                .lastName("Ben Ali")
                .email("eya@test.tn")
                .phone("22222222")
                .enabled(true)
                .build();
    }

    // =========================================================================
    // findAll
    // =========================================================================

    @Nested
    @DisplayName("findAll(Pageable)")
    class FindAll {

        @Test
        @DisplayName("Retourne une page de UserDTO")
        void shouldReturnPageOfUserDTO() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(sampleUser));

            when(userRepository.findAll(pageable)).thenReturn(userPage);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            Page<UserDTO> result = userService.findAll(pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getEmail()).isEqualTo("eya@test.tn");
            verify(userRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Retourne une page vide si aucun utilisateur")
        void shouldReturnEmptyPageWhenNoUsers() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepository.findAll(pageable)).thenReturn(Page.empty());

            Page<UserDTO> result = userService.findAll(pageable);

            assertThat(result.getContent()).isEmpty();
        }
    }

    // =========================================================================
    // findById
    // =========================================================================

    @Nested
    @DisplayName("findById(String id)")
    class FindById {

        @Test
        @DisplayName("Cas nominal — retourne le DTO correspondant")
        void shouldReturnUserDTOWhenFound() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            UserDTO result = userService.findById(userId.toHexString());

            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("eya@test.tn");
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'ID est introuvable")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.findById(userId.toHexString()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }

    // =========================================================================
    // save
    // =========================================================================

    @Nested
    @DisplayName("save(User user)")
    class Save {

        @Test
        @DisplayName("Sauvegarde l'utilisateur et retourne son DTO")
        void shouldSaveAndReturnDTO() {
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            UserDTO result = userService.save(sampleUser);

            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("eya@test.tn");
            verify(userRepository).save(sampleUser);
        }
    }

    // =========================================================================
    // deleteById
    // =========================================================================

    @Nested
    @DisplayName("deleteById(String id)")
    class DeleteById {

        @Test
        @DisplayName("Supprime l'utilisateur si l'ID existe")
        void shouldDeleteWhenExists() {
            when(userRepository.existsById(userId)).thenReturn(true);

            userService.deleteById(userId.toHexString());

            verify(userRepository).deleteById(userId);
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'utilisateur n'existe pas")
        void shouldThrowWhenNotExists() {
            when(userRepository.existsById(any(ObjectId.class))).thenReturn(false);

            assertThatThrownBy(() -> userService.deleteById(userId.toHexString()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(userRepository, never()).deleteById(any());
        }
    }

    // =========================================================================
    // existsByEmail
    // =========================================================================

    @Nested
    @DisplayName("existsByEmail(String email)")
    class ExistsByEmail {

        @Test
        @DisplayName("Retourne true si l'email existe")
        void shouldReturnTrueWhenEmailExists() {
            when(userRepository.existsByEmail("eya@test.tn")).thenReturn(true);
            assertThat(userService.existsByEmail("eya@test.tn")).isTrue();
        }

        @Test
        @DisplayName("Retourne false si l'email n'existe pas")
        void shouldReturnFalseWhenEmailNotFound() {
            when(userRepository.existsByEmail("ghost@test.tn")).thenReturn(false);
            assertThat(userService.existsByEmail("ghost@test.tn")).isFalse();
        }
    }

    // =========================================================================
    // initiatePasswordReset
    // =========================================================================

    @Nested
    @DisplayName("initiatePasswordReset(String email)")
    class InitiatePasswordReset {

        @Test
        @DisplayName("Génère un token et sauvegarde l'utilisateur")
        void shouldGenerateTokenAndSaveUser() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);

            String token = userService.initiatePasswordReset("eya@test.tn");

            assertThat(token).isNotNull().isNotBlank();
            assertThat(sampleUser.getResetToken()).isEqualTo(token);
            assertThat(sampleUser.getResetTokenExpiry()).isAfter(LocalDateTime.now());
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'email est inconnu")
        void shouldThrowWhenEmailNotFound() {
            when(userRepository.findByEmail("unknown@test.tn")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.initiatePasswordReset("unknown@test.tn"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }

    // =========================================================================
    // completePasswordReset
    // =========================================================================

    @Nested
    @DisplayName("completePasswordReset(String token, String newPassword)")
    class CompletePasswordReset {

        @Test
        @DisplayName("Réinitialise le mot de passe avec un token valide")
        void shouldResetPasswordWithValidToken() {
            sampleUser.setResetToken("valid-token");
            sampleUser.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            when(userRepository.findByResetToken("valid-token")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.encode("NewPass@123")).thenReturn("hashed_password");
            when(userRepository.save(any(User.class))).thenReturn(sampleUser);

            userService.completePasswordReset("valid-token", "NewPass@123");

            assertThat(sampleUser.getPassword()).isEqualTo("hashed_password");
            assertThat(sampleUser.getResetToken()).isNull();
            assertThat(sampleUser.getResetTokenExpiry()).isNull();
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Lève BadRequestException si le token est invalide")
        void shouldThrowWhenTokenIsInvalid() {
            when(userRepository.findByResetToken("bad-token")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.completePasswordReset("bad-token", "anyPass"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid reset token");
        }

        @Test
        @DisplayName("Lève BadRequestException si le token est expiré")
        void shouldThrowWhenTokenIsExpired() {
            sampleUser.setResetToken("expired-token");
            sampleUser.setResetTokenExpiry(LocalDateTime.now().minusHours(2)); // déjà expiré
            when(userRepository.findByResetToken("expired-token")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.completePasswordReset("expired-token", "anyPass"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("expired");
        }
    }

    // =========================================================================
    // updateProfile
    // =========================================================================

    @Nested
    @DisplayName("updateProfile(String userId, String firstName, String lastName, String phone)")
    class UpdateProfile {

        @Test
        @DisplayName("Met à jour les champs non-nuls et non-blancs")
        void shouldUpdateNonBlankFields() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            UserDTO result = userService.updateProfile(userId.toHexString(), "Malek", "Ben Salah", "55555555");

            assertThat(sampleUser.getFirstName()).isEqualTo("Malek");
            assertThat(sampleUser.getLastName()).isEqualTo("Ben Salah");
            assertThat(sampleUser.getPhone()).isEqualTo("55555555");
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Ignore les champs null ou vides sans modifier l'entité")
        void shouldNotUpdateBlankOrNullFields() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            userService.updateProfile(userId.toHexString(), null, "  ", null);

            // Les valeurs d'origine doivent être inchangées
            assertThat(sampleUser.getFirstName()).isEqualTo("Eya");
            assertThat(sampleUser.getLastName()).isEqualTo("Ben Ali");
            assertThat(sampleUser.getPhone()).isEqualTo("22222222");
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'utilisateur est introuvable")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateProfile(userId.toHexString(), "X", "Y", "Z"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }

    // =========================================================================
    // findByEmail
    // =========================================================================

    @Nested
    @DisplayName("findByEmail(String email)")
    class FindByEmail {

        @Test
        @DisplayName("Retourne l'entité User si l'email existe")
        void shouldReturnUserWhenFound() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            User result = userService.findByEmail("eya@test.tn");

            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("eya@test.tn");
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'email est inconnu")
        void shouldThrowWhenEmailNotFound() {
            when(userRepository.findByEmail("nobody@test.tn")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.findByEmail("nobody@test.tn"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }

    // =========================================================================
    // resolveUserId
    // =========================================================================

    @Nested
    @DisplayName("resolveUserId(String email)")
    class ResolveUserId {

        @Test
        @DisplayName("Retourne l'ObjectId de l'utilisateur correspondant à l'email")
        void shouldReturnObjectIdForExistingEmail() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            ObjectId result = userService.resolveUserId("eya@test.tn");

            assertThat(result).isEqualTo(userId);
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'email est introuvable")
        void shouldThrowWhenEmailNotFound() {
            when(userRepository.findByEmail("ghost@test.tn")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.resolveUserId("ghost@test.tn"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // uploadAvatar
    // =========================================================================

    @Nested
    @DisplayName("uploadAvatar(String email, MultipartFile file)")
    class UploadAvatar {

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'utilisateur est introuvable")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findByEmail("ghost@test.tn")).thenReturn(Optional.empty());

            MockMultipartFile file = new MockMultipartFile(
                    "avatar", "photo.jpg", "image/jpeg", "content".getBytes());

            assertThatThrownBy(() -> userService.uploadAvatar("ghost@test.tn", file))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("Lève BadRequestException si le fichier est vide")
        void shouldThrowWhenFileIsEmpty() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            MockMultipartFile emptyFile = new MockMultipartFile(
                    "avatar", "photo.jpg", "image/jpeg", new byte[0]);

            assertThatThrownBy(() -> userService.uploadAvatar("eya@test.tn", emptyFile))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("empty");
        }

        @Test
        @DisplayName("Lève BadRequestException si le type MIME n'est pas une image")
        void shouldThrowWhenContentTypeIsNotImage() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            MockMultipartFile pdfFile = new MockMultipartFile(
                    "avatar", "document.pdf", "application/pdf", "content".getBytes());

            assertThatThrownBy(() -> userService.uploadAvatar("eya@test.tn", pdfFile))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("images");
        }

        @Test
        @DisplayName("Lève BadRequestException si le fichier dépasse 10MB")
        void shouldThrowWhenFileSizeExceedsLimit() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            // 11 MB de données
            byte[] bigContent = new byte[11 * 1024 * 1024];
            MockMultipartFile bigFile = new MockMultipartFile(
                    "avatar", "big.jpg", "image/jpeg", bigContent);

            assertThatThrownBy(() -> userService.uploadAvatar("eya@test.tn", bigFile))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("10MB");
        }

        @Test
        @DisplayName("Sauvegarde le fichier et met à jour l'URL d'avatar en base")
        void shouldSaveFileAndUpdateAvatarUrl() throws Exception {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any(User.class))).thenReturn(sampleUser);

            // Utilise le répertoire temp de la JVM pour éviter les problèmes de chemin
            ReflectionTestUtils.setField(userService, "uploadDir",
                    System.getProperty("java.io.tmpdir") + "/esprit-market-test-avatars");

            MockMultipartFile validFile = new MockMultipartFile(
                    "avatar", "photo.jpg", "image/jpeg", "fake-image-content".getBytes());

            String avatarUrl = userService.uploadAvatar("eya@test.tn", validFile);

            assertThat(avatarUrl).startsWith("/uploads/avatars/");
            assertThat(avatarUrl).endsWith(".jpg");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getAvatarUrl()).isEqualTo(avatarUrl);
        }
    }
}
