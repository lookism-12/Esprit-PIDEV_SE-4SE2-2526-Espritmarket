package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "rides")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ride {
    @Id
    private ObjectId id;

    // DriverProfile — Ride (OneToMany BIDIRECTIONAL)
    private ObjectId driverProfileId;

    // Vehicle — Ride (OneToMany UNIDIRECTIONAL Ride -> Vehicle)
    private ObjectId vehicleId;

    private String departure;
    private String destination;

    // Ride — Booking (OneToMany BIDIRECTIONAL)
    private List<ObjectId> bookingIds = new ArrayList<>();

    // Ride — RideReview (OneToMany BIDIRECTIONAL)
    private List<ObjectId> reviewIds = new ArrayList<>();
}
