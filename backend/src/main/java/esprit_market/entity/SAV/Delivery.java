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
    
    private String status; // PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
    
    // Relations (Unidirectional as per standard MongoDB usage)
    private ObjectId userId; // The assigned admin or delivery driver
    private ObjectId cartId; // The Cart containing items for delivery
}
