package esprit_market.entity.carpooling;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    private ObjectId id;

    @Indexed
    private ObjectId rideId;

    @Indexed
    private ObjectId passengerProfileId;

    private Integer numberOfSeats;
    private String pickupLocation;
    private String dropoffLocation;

    @Indexed
    private BookingStatus status;

    private Float totalPrice;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime cancelledAt;
}
