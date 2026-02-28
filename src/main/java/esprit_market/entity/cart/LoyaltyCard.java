package esprit_market.entity.cart;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "loyalty_cards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyCard {
    @Id
    private ObjectId id;
    
    // User — LoyaltyCard (OneToOne BIDIRECTIONAL)
    private ObjectId userId;
    
    private Integer points;
    
    private String level; // e.g., "BRONZE", "SILVER", "GOLD", "PLATINUM"
    
    private Integer totalPointsEarned;
    
    private LocalDate pointsExpireAt;
    
    private Double convertedToDiscount;
}
