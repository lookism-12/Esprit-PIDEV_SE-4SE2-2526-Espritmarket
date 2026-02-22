package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "ride_payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RidePayment {
    @Id
    private ObjectId id;

    // Booking — RidePayment (OneToOne BIDIRECTIONAL)
    private ObjectId bookingId;

    private double amount;
    private String status;
}
