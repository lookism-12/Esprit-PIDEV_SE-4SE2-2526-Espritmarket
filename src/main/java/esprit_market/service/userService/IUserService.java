package esprit_market.service.userService;

import esprit_market.entity.user.User;
import org.bson.types.ObjectId;

import java.util.List;
import java.util.Optional;

public interface IUserService {
    List<User> findAll();

    User save(User user);

    User findById(ObjectId id);
    
    Optional<User> findByEmail(String email);

    void deleteById(ObjectId id);
    
    boolean existsByEmail(String email);
}
