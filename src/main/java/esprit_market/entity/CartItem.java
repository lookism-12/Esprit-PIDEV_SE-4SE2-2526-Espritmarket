package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "cart_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    @Id
    private ObjectId id;
    
    // Cart — CartItem (OneToMany BIDIRECTIONAL)
    private ObjectId cartId;
    
    // Product — CartItem (OneToMany UNIDIRECTIONAL CartItem -> Product)
    private ObjectId productId;
    
    private int quantity;
}
