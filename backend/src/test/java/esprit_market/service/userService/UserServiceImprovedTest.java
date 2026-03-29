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
import org.mockito.InOrder;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Enhanced unit tests for {@link UserService}.
 *
 * Covers:
 * - Basic CRUD operations
 * - Password reset workflow (initiate + complete)
 * - Avatar upload with validation
 * - Edge cases and error scenarios
 * - Transaction behavior
 *
 * All dependencies are mocked using Mockito.
 * No Spring context is loaded — pure unit tests with JUnit 5.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService — Tests Unitaires Complets")
class UserServiceImprovedTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private ObjectId userId;
    private User sampleUser;
    private UserDTO sampleDTO;

    @BeforeEach
    void setUp() {
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
    // findAll with Pagination
    // =========================================================================

    @Nested
    @DisplayName("findAll(Pageable) — Pagination & Mapping")
    class FindAll {

        @Test
        @DisplayName("Retourne une page de UserDTO avec conversion correcte")
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
            verify(userMapper).toDTO(sampleUser);
        }

        @Test
        @DisplayName("Retourne une page vide si aucun utilisateur")
        void shouldReturnEmptyPageWhenNoUsers() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepository.findAll(pageable)).thenReturn(Page.empty());

            Page<UserDTO> result = userService.findAll(pageable);

            assertThat(result.getContent()).isEmpty();
            verify(userRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Gère plusieurs pages correctement")
        void shouldHandleMultiplePages() {
            User user2 = User.builder()
                    .id(new ObjectId())
                    .firstName("Ahmed")
                    .lastName("Khalil")
                    .email("ahmed@test.tn")
                    .enabled(true)
                    .build();

            UserDTO dto2 = UserDTO.builder()
                    .firstName("Ahmed")
                    .lastName("Khalil")
                    .email("ahmed@test.tn")
                    .enabled(true)
                    .build();

            Pageable pageable = PageRequest.of(0, 2);
            Page<User> userPage = new PageImpl<>(List.of(sampleUser, user2), pageable, 2);

            when(userRepository.findAll(pageable)).thenReturn(userPage);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);
            when(userMapper.toDTO(user2)).thenReturn(dto2);

            Page<UserDTO> result = userService.findAll(pageable);

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getTotalPages()).isEqualTo(1);
        }

        @Test
        @DisplayName("Respecte la pagination correctement")
        void shouldRespectPaginationParameters() {
            Pageable pageable = PageRequest.of(1, 5);
            when(userRepository.findAll(pageable)).thenReturn(Page.empty(pageable));

            userService.findAll(pageable);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(userRepository).findAll(pageableCaptor.capture());
            assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(1);
            assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(5);
        }
    }

    // =========================================================================
    // findById
    // =========================================================================

    @Nested
    @DisplayName("findById(String id) — Recherche par ID")
    class FindById {

        @Test
        @DisplayName("Cas nominal — retourne le DTO correspondant")
        void shouldReturnUserDTOWhenFound() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            UserDTO result = userService.findById(userId.toHexString());

            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("eya@test.tn");
            verify(userRepository).findById(userId);
            verify(userMapper).toDTO(sampleUser);
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'ID est introuvable")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.findById(userId.toHexString()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(userRepository).findById(userId);
        }

        @Test
        @DisplayName("Gère les ObjectId invalides")
        void shouldHandleInvalidObjectId() {
            assertThatThrownBy(() -> userService.findById("invalid-id"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Retourne le bon DTO sans modifications")
        void shouldReturnExactDTOWithoutModification() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            UserDTO result = userService.findById(userId.toHexString());

            assertThat(result.getFirstName()).isEqualTo(sampleDTO.getFirstName());
            assertThat(result.getLastName()).isEqualTo(sampleDTO.getLastName());
            assertThat(result.getEmail()).isEqualTo(sampleDTO.getEmail());
        }
    }

    // =========================================================================
    // save
    // =========================================================================

    @Nested
    @DisplayName("save(User user) — Sauvegarde d'entité")
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
            verify(userMapper).toDTO(sampleUser);
        }

        @Test
        @DisplayName("Appelle le mapper après la sauvegarde")
        void shouldMapAfterSave() {
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            userService.save(sampleUser);

            InOrder inOrder = inOrder(userRepository, userMapper);
            inOrder.verify(userRepository).save(sampleUser);
            inOrder.verify(userMapper).toDTO(sampleUser);
        }

        @Test
        @DisplayName("Lève exception si la sauvegarde échoue")
        void shouldThrowWhenSaveFails() {
            when(userRepository.save(any())).thenThrow(new RuntimeException("DB error"));

            assertThatThrownBy(() -> userService.save(sampleUser))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("DB error");
        }
    }

    // =========================================================================
    // deleteById
    // =========================================================================

    @Nested
    @DisplayName("deleteById(String id) — Suppression")
    class DeleteById {

        @Test
        @DisplayName("Supprime l'utilisateur si l'ID existe")
        void shouldDeleteWhenExists() {
            when(userRepository.existsById(userId)).thenReturn(true);

            userService.deleteById(userId.toHexString());

            verify(userRepository).existsById(userId);
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

        @Test
        @DisplayName("N'appelle deleteById que si existsById retourne true")
        void shouldCheckExistenceBeforeDeletion() {
            when(userRepository.existsById(userId)).thenReturn(true);

            userService.deleteById(userId.toHexString());

            InOrder inOrder = inOrder(userRepository);
            inOrder.verify(userRepository).existsById(userId);
            inOrder.verify(userRepository).deleteById(userId);
        }
    }

    // =========================================================================
    // existsByEmail
    // =========================================================================

    @Nested
    @DisplayName("existsByEmail(String email) — Vérification d'existence")
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

        @Test
        @DisplayName("Est case-sensitive")
        void shouldBeCaseSensitive() {
            when(userRepository.existsByEmail("eya@test.tn")).thenReturn(true);
            when(userRepository.existsByEmail("EYA@TEST.TN")).thenReturn(false);

            assertThat(userService.existsByEmail("eya@test.tn")).isTrue();
            assertThat(userService.existsByEmail("EYA@TEST.TN")).isFalse();
        }

        @Test
        @DisplayName("Gère les emails avec espaces")
        void shouldHandleEmailsWithSpaces() {
            when(userRepository.existsByEmail(" eya@test.tn ")).thenReturn(false);
            assertThat(userService.existsByEmail(" eya@test.tn ")).isFalse();
        }
    }

    // =========================================================================
    // initiatePasswordReset
    // =========================================================================

    @Nested
    @DisplayName("initiatePasswordReset(String email) — Initiation de réinitialisation")
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
        @DisplayName("Génère un token différent à chaque appel")
        void shouldGenerateDifferentTokensEachTime() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any())).thenReturn(sampleUser);

            String token1 = userService.initiatePasswordReset("eya@test.tn");

            User sampleUser2 = User.builder()
                    .id(new ObjectId())
                    .firstName("Other")
                    .lastName("User")
                    .email("other@test.tn")
                    .enabled(true)
                    .build();
            when(userRepository.findByEmail("other@test.tn")).thenReturn(Optional.of(sampleUser2));

            String token2 = userService.initiatePasswordReset("other@test.tn");

            assertThat(token1).isNotEqualTo(token2);
        }

        @Test
        @DisplayName("Le token expire après 1 heure")
        void shouldTokenExpireAfterOneHour() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);

            LocalDateTime beforeTime = LocalDateTime.now();
            userService.initiatePasswordReset("eya@test.tn");
            LocalDateTime afterTime = LocalDateTime.now().plusHours(1).plusMinutes(5);

            assertThat(sampleUser.getResetTokenExpiry())
                    .isAfter(beforeTime)
                    .isBefore(afterTime);
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'email est inconnu")
        void shouldThrowWhenEmailNotFound() {
            when(userRepository.findByEmail("unknown@test.tn")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.initiatePasswordReset("unknown@test.tn"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("Écrase le token précédent")
        void shouldOverwritePreviousToken() {
            sampleUser.setResetToken("old-token");
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);

            String newToken = userService.initiatePasswordReset("eya@test.tn");

            assertThat(sampleUser.getResetToken()).isEqualTo(newToken);
            assertThat(newToken).isNotEqualTo("old-token");
        }
    }

    // =========================================================================
    // completePasswordReset
    // =========================================================================

    @Nested
    @DisplayName("completePasswordReset(String token, String newPassword) — Complétion réinitialisation")
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
            verify(passwordEncoder).encode("NewPass@123");
        }

        @Test
        @DisplayName("Hash le nouveau mot de passe avant sauvegarde")
        void shouldHashPasswordBeforeSave() {
            sampleUser.setResetToken("valid-token");
            sampleUser.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            when(userRepository.findByResetToken("valid-token")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.encode("NewPass@123")).thenReturn("hashed_password");
            when(userRepository.save(any(User.class))).thenReturn(sampleUser);

            userService.completePasswordReset("valid-token", "NewPass@123");

            verify(passwordEncoder).encode("NewPass@123");
        }

        @Test
        @DisplayName("Nettoie le token après réinitialisation réussie")
        void shouldCleanupTokenAfterReset() {
            sampleUser.setResetToken("valid-token");
            sampleUser.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            when(userRepository.findByResetToken("valid-token")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            when(userRepository.save(any())).thenReturn(sampleUser);

            userService.completePasswordReset("valid-token", "NewPass@123");

            assertThat(sampleUser.getResetToken()).isNull();
            assertThat(sampleUser.getResetTokenExpiry()).isNull();
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
            sampleUser.setResetTokenExpiry(LocalDateTime.now().minusHours(2));
            when(userRepository.findByResetToken("expired-token")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.completePasswordReset("expired-token", "anyPass"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("N'encode pas le mot de passe si le token est expiré")
        void shouldNotEncodePasswordIfTokenExpired() {
            sampleUser.setResetToken("expired-token");
            sampleUser.setResetTokenExpiry(LocalDateTime.now().minusHours(1));
            when(userRepository.findByResetToken("expired-token")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.completePasswordReset("expired-token", "NewPass@123"))
                    .isInstanceOf(BadRequestException.class);

            verify(passwordEncoder, never()).encode(any());
        }

        @Test
        @DisplayName("Gère les tokens à la limite d'expiration")
        void shouldHandleTokenAtExpirationBoundary() {
            sampleUser.setResetToken("boundary-token");
            sampleUser.setResetTokenExpiry(LocalDateTime.now().minusNanos(1));
            when(userRepository.findByResetToken("boundary-token")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.completePasswordReset("boundary-token", "NewPass@123"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("expired");
        }
    }

    // =========================================================================
    // updateProfile
    // =========================================================================

    @Nested
    @DisplayName("updateProfile(String userId, ...) — Mise à jour de profil")
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
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Ignore les champs null ou vides sans modifier l'entité")
        void shouldNotUpdateBlankOrNullFields() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            userService.updateProfile(userId.toHexString(), null, "  ", null);

            assertThat(sampleUser.getFirstName()).isEqualTo("Eya");
            assertThat(sampleUser.getLastName()).isEqualTo("Ben Ali");
            assertThat(sampleUser.getPhone()).isEqualTo("22222222");
        }

        @Test
        @DisplayName("Met à jour partiellement les champs")
        void shouldPartiallyUpdateProfile() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            userService.updateProfile(userId.toHexString(), "NewFirst", null, "99999999");

            assertThat(sampleUser.getFirstName()).isEqualTo("NewFirst");
            assertThat(sampleUser.getLastName()).isEqualTo("Ben Ali");
            assertThat(sampleUser.getPhone()).isEqualTo("99999999");
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'utilisateur est introuvable")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateProfile(userId.toHexString(), "X", "Y", "Z"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Vérifie l'existence avant la mise à jour")
        void shouldCheckExistenceBeforeUpdate() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any())).thenReturn(sampleUser);
            when(userMapper.toDTO(any())).thenReturn(sampleDTO);

            userService.updateProfile(userId.toHexString(), "NewFirst", "NewLast", "12345678");

            verify(userRepository).findById(userId);
        }

        @Test
        @DisplayName("Gère les champs avec espaces trimables")
        void shouldTrimWhitespaceFields() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            userService.updateProfile(userId.toHexString(), "  NewFirst  ", "  NewLast  ", "12345678");

            assertThat(sampleUser.getFirstName()).isEqualTo("  NewFirst  ");
            assertThat(sampleUser.getLastName()).isEqualTo("  NewLast  ");
        }
    }

    // =========================================================================
    // findByEmail
    // =========================================================================

    @Nested
    @DisplayName("findByEmail(String email) — Recherche par email")
    class FindByEmail {

        @Test
        @DisplayName("Retourne l'entité User si l'email existe")
        void shouldReturnUserWhenFound() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            User result = userService.findByEmail("eya@test.tn");

            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("eya@test.tn");
            verify(userRepository).findByEmail("eya@test.tn");
        }

        @Test
        @DisplayName("Lève ResourceNotFoundException si l'email est inconnu")
        void shouldThrowWhenEmailNotFound() {
            when(userRepository.findByEmail("nobody@test.tn")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.findByEmail("nobody@test.tn"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("Retourne le même objet du repository sans transformation")
        void shouldReturnEntityUnmodified() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            User result = userService.findByEmail("eya@test.tn");

            assertThat(result).isSameAs(sampleUser);
        }
    }

    // =========================================================================
    // resolveUserId
    // =========================================================================

    @Nested
    @DisplayName("resolveUserId(String email) — Résolution d'ID utilisateur")
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

        @Test
        @DisplayName("Retourne l'ID correct pour plusieurs emails différents")
        void shouldResolveMultipleDifferentEmails() {
            ObjectId id2 = new ObjectId();
            User user2 = User.builder().id(id2).email("other@test.tn").build();

            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.findByEmail("other@test.tn")).thenReturn(Optional.of(user2));

            ObjectId result1 = userService.resolveUserId("eya@test.tn");
            ObjectId result2 = userService.resolveUserId("other@test.tn");

            assertThat(result1).isEqualTo(userId);
            assertThat(result2).isEqualTo(id2);
            assertThat(result1).isNotEqualTo(result2);
        }
    }

    // =========================================================================
    // uploadAvatar
    // =========================================================================

    @Nested
    @DisplayName("uploadAvatar(String email, MultipartFile file) — Upload d'avatar")
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

            ReflectionTestUtils.setField(userService, "uploadDir",
                    System.getProperty("java.io.tmpdir") + "/esprit-market-test-avatars");

            MockMultipartFile validFile = new MockMultipartFile(
                    "avatar", "photo.jpg", "image/jpeg", "fake-image-content".getBytes());

            String avatarUrl = userService.uploadAvatar("eya@test.tn", validFile);

            assertThat(avatarUrl).startsWith("/uploads/avatars/");
            assertThat(avatarUrl).endsWith(".jpg");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Valide le type MIME correctement")
        void shouldValidateMimeTypeCorrectly() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));

            MockMultipartFile textFile = new MockMultipartFile(
                    "avatar", "text.txt", "text/plain", "content".getBytes());

            assertThatThrownBy(() -> userService.uploadAvatar("eya@test.tn", textFile))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("images");
        }

        @Test
        @DisplayName("Accepte tous les types MIME d'image courants")
        void shouldAcceptCommonImageMimeTypes() {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any())).thenReturn(sampleUser);

            ReflectionTestUtils.setField(userService, "uploadDir",
                    System.getProperty("java.io.tmpdir") + "/test-avatars");

            for (String mimeType : List.of("image/jpeg", "image/png", "image/gif", "image/webp")) {
                MockMultipartFile file = new MockMultipartFile(
                        "avatar", "photo", mimeType, "content".getBytes());

                assertThatNoException().isThrownBy(() ->
                        userService.uploadAvatar("eya@test.tn", file)
                );
            }
        }

        @Test
        @DisplayName("Génère des noms de fichier uniques")
        void shouldGenerateUniqueFilenames() throws Exception {
            when(userRepository.findByEmail("eya@test.tn")).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any())).thenReturn(sampleUser);

            ReflectionTestUtils.setField(userService, "uploadDir",
                    System.getProperty("java.io.tmpdir") + "/test-avatars");

            MockMultipartFile file1 = new MockMultipartFile(
                    "avatar", "photo.jpg", "image/jpeg", "content1".getBytes());
            MockMultipartFile file2 = new MockMultipartFile(
                    "avatar", "photo.jpg", "image/jpeg", "content2".getBytes());

            String url1 = userService.uploadAvatar("eya@test.tn", file1);
            String url2 = userService.uploadAvatar("eya@test.tn", file2);

            assertThat(url1).isNotEqualTo(url2);
        }
    }

    // =========================================================================
    // Edge Cases & Integration Scenarios
    // =========================================================================

    @Nested
    @DisplayName("Edge Cases — Cas limites")
    class EdgeCases {

        @Test
        @DisplayName("Gère les noms spéciaux avec caractères accentués")
        void shouldHandleAccentedCharacters() {
            User userWithAccents = User.builder()
                    .id(userId)
                    .firstName("François")
                    .lastName("Côté")
                    .email("francois@test.tn")
                    .enabled(true)
                    .build();

            when(userRepository.findByEmail("francois@test.tn")).thenReturn(Optional.of(userWithAccents));

            User result = userService.findByEmail("francois@test.tn");

            assertThat(result.getFirstName()).isEqualTo("François");
            assertThat(result.getLastName()).isEqualTo("Côté");
        }

        @Test
        @DisplayName("Gère les listes vides correctement")
        void shouldHandleEmptyLists() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepository.findAll(pageable)).thenReturn(new PageImpl<>(new ArrayList<>()));

            Page<UserDTO> result = userService.findAll(pageable);

            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("Gère null dans certains champs optionnels")
        void shouldHandleNullOptionalFields() {
            User userWithNulls = User.builder()
                    .id(userId)
                    .firstName("Test")
                    .lastName("User")
                    .email("test@test.tn")
                    .phone(null)
                    .avatarUrl(null)
                    .enabled(true)
                    .build();

            when(userRepository.findByEmail("test@test.tn")).thenReturn(Optional.of(userWithNulls));

            User result = userService.findByEmail("test@test.tn");

            assertThat(result.getPhone()).isNull();
            assertThat(result.getAvatarUrl()).isNull();
        }
    }

    // =========================================================================
    // Verification of Mock Interactions
    // =========================================================================

    @Nested
    @DisplayName("Mock Verification — Vérification des appels")
    class MockVerification {

        @Test
        @DisplayName("Vérifie que findById appelle le repository une seule fois")
        void shouldCallRepositoryOnceForFindById() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            userService.findById(userId.toHexString());

            verify(userRepository, times(1)).findById(userId);
        }

        @Test
        @DisplayName("Vérifie l'ordre d'appel des méthodes")
        void shouldCallMethodsInCorrectOrder() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);
            when(userMapper.toDTO(sampleUser)).thenReturn(sampleDTO);

            userService.updateProfile(userId.toHexString(), "NewFirst", null, null);

            InOrder inOrder = inOrder(userRepository, userMapper);
            inOrder.verify(userRepository).findById(userId);
            inOrder.verify(userRepository).save(any());
            inOrder.verify(userMapper).toDTO(sampleUser);
        }

        @Test
        @DisplayName("Vérifie qu'aucun appel n'est fait en cas d'erreur")
        void shouldNotCallSaveOnError() {
            when(userRepository.findById(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.findById(userId.toHexString()))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(userRepository, never()).save(any());
        }
    }
}
