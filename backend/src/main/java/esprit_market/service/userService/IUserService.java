package esprit_market.service.userService;

import esprit_market.dto.userDto.UserDTO;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface IUserService {

    Page<UserDTO> findAll(Pageable pageable);

    UserDTO findById(String id);

    UserDTO save(User user);

    void deleteById(String id);

    boolean existsByEmail(String email);

    String initiatePasswordReset(String email);

    void completePasswordReset(String token, String newPassword);

    UserDTO updateProfile(String userId, String firstName, String lastName, String phone);

    User findByEmail(String email);

    ObjectId resolveUserId(String email);

    String uploadAvatar(String email, MultipartFile file) throws Exception;
}
