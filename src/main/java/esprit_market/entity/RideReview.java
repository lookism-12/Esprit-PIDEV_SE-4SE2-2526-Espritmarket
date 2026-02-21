package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "ride_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideReview {
    @Id
    private ObjectId id;

    // Ride — RideReview (OneToMany BIDIRECTIONAL)
    private ObjectId rideId;

    private ObjectId passengerProfileId;
    private int rating;
    private String comment;
}
