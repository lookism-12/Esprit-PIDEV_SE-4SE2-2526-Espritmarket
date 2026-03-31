package esprit_market.entity.carpooling;

import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "ride_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideRequest {
    @Id
    private ObjectId id;

    @Indexed
    private ObjectId passengerProfileId;

    private String departureLocation;
    private String destinationLocation;

    @Indexed
    private LocalDateTime departureTime;

    private Integer requestedSeats;

    private Float proposedPrice;

    @Indexed
    private RideRequestStatus status; // PENDING, ACCEPTED, CANCELLED

    private ObjectId driverProfileId;

    private ObjectId rideId; // set when driver accepts — the created Ride's ID

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private Float counterPrice;
    private String counterPriceNote;
}
