package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "driver_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfile {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    private ObjectId userId;

    private String licenseNumber;
    private String licenseDocument;
    private Boolean isVerified;
    private Float averageRating;
    private Integer totalRidesCompleted;
    private Float totalEarnings;

    /** Composite score 0–100 computed from rating, rides completed, acceptance rate */
    private Float driverScore;

    /** Badge tier: BRONZE / SILVER / GOLD */
    private String badge;

    private java.util.List<ObjectId> rideIds;
    private java.util.List<ObjectId> vehicleIds;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
