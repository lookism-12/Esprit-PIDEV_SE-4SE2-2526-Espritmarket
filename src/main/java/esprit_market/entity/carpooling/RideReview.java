package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "ride_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideReview {
    @Id
    private ObjectId id;

    @Indexed
    private ObjectId rideId;

    private ObjectId reviewerId;
    private ObjectId revieweeId;
    private Integer rating;
    private String comment;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
