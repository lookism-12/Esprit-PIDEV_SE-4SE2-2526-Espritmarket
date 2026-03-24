package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "passenger_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerProfile {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    private ObjectId userId;

    private Float averageRating;
    private String preferences;

    private java.util.List<ObjectId> bookingIds;
    private Integer totalRidesCompleted;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
