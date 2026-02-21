package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "passenger_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerProfile {
    @Id
    private ObjectId id;
    
    // Bidirectional OneToOne User <-> PassengerProfile
    private ObjectId userId;
    
    // Bidirectional OneToMany PassengerProfile <-> Booking
    private List<ObjectId> bookingIds = new ArrayList<>();
}
