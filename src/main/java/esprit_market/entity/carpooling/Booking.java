package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    private ObjectId id;

    // Ride — Booking (OneToMany BIDIRECTIONAL)
    private ObjectId rideId;

    // PassengerProfile — Booking (OneToMany BIDIRECTIONAL)
    private ObjectId passengerProfileId;

    // Booking — RidePayment (OneToOne BIDIRECTIONAL)
    private ObjectId paymentId;
}
