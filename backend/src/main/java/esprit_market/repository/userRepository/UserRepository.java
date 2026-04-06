package esprit_market.repository.userRepository;

import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, ObjectId> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<User> findByRolesContaining(esprit_market.Enum.userEnum.Role role);

    Optional<User> findByResetToken(String resetToken);
}
