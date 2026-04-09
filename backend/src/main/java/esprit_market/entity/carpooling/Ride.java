package esprit_market.entity.carpooling;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "rides")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ride {
    @Id
    private ObjectId id;

    @Indexed
    private ObjectId driverProfileId;

    @Indexed
    private ObjectId vehicleId;

    private String departureLocation;
    private String destinationLocation;

    @Indexed
    private LocalDateTime departureTime;

    private Integer availableSeats;
    private Float pricePerSeat;

    @Indexed
    private RideStatus status;

    private Integer estimatedDurationMinutes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    private Integer passengerRating;
    private Integer driverRating;
    private String passengerComment;
    private String driverComment;
}
