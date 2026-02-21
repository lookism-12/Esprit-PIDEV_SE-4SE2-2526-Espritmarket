package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "driver_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfile {
    @Id
    private ObjectId id;
    
    // Bidirectional OneToOne User <-> DriverProfile
    private ObjectId userId;
    
    // Bidirectional OneToMany DriverProfile <-> Vehicle
    private List<ObjectId> vehicleIds = new ArrayList<>();
    
    // Bidirectional OneToMany DriverProfile <-> Ride
    private List<ObjectId> rideIds = new ArrayList<>();
}
