package esprit_market.entity.SAV;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Delivery {
    @Id
    private ObjectId id;
    
    private String address;
    
    @Builder.Default
    private LocalDateTime deliveryDate = LocalDateTime.now();
    
    private String status; // PREPARING, IN_TRANSIT, DELIVERED, RETURNED, DRIVER_REFUSED
    
    // Relations (Unidirectional as per standard MongoDB usage)
    private ObjectId userId; // The confirmed delivery driver
    private ObjectId cartId; // The Cart containing items for delivery

    // Driver assignment workflow fields
    private ObjectId pendingDriverId;   // Driver assigned but not yet responded
    private String declineReason;       // Reason provided by driver on decline
    private String declinedByDriverId;  // ID of driver who refused (for history/admin)
}
