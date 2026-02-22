package esprit_market.service.userService;

import esprit_market.entity.user.User;
import org.bson.types.ObjectId;

import java.util.List;

public interface IUserService {
    List<User> findAll();

    User save(User user);

    User findById(ObjectId id);

    void deleteById(ObjectId id);
}
