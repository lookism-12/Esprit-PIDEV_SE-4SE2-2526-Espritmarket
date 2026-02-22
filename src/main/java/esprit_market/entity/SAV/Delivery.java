package esprit_market.entity.SAV;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Delivery {
    @Id
    private ObjectId id;
    
    // Cart — Delivery (OneToMany UNIDIRECTIONAL Delivery -> Cart)
    private ObjectId cartId;
    
    private ObjectId deliveryAgentId;
    private String status;
}
