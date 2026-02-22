package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vehicles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    @Id
    private ObjectId id;
    
    // DriverProfile — Vehicle (OneToMany BIDIRECTIONAL)
    private ObjectId driverProfileId;
    
    private String model;
    private String plateNumber;
}
