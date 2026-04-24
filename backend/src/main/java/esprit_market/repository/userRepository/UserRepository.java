package esprit_market.repository.userRepository;

import esprit_market.dto.carpooling.stats.AggregationResult;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, ObjectId> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = {
        "{ $group: { _id: { $dateToString: { format: '%m', date: '$createdAt' } }, count: { $sum: 1 } } }",
        "{ $sort: { _id: 1 } }"
    })
    List<AggregationResult> getMonthlyUserGrowth();
}
