package esprit_market.entity.cart;

import com.fasterxml.jackson.annotation.JsonIgnore;
import esprit_market.entity.user.User;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
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
    
    @DBRef
    @JsonIgnore
    private User user;
    
    private Integer points;
    
    private String level;
    
    private Integer totalPointsEarned;
    
    private LocalDate pointsExpireAt;
    
    private Double convertedToDiscount;
    
    @JsonIgnore
    public ObjectId getUserId() {
        return user != null ? user.getId() : null;
    }
}
