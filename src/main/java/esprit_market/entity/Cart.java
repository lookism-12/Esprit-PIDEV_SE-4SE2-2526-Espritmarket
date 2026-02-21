package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "carts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cart {
    @Id
    private ObjectId id;
    
    // User — Cart (OneToMany BIDIRECTIONAL)
    private ObjectId userId;
    
    // Cart — CartItem (OneToMany BIDIRECTIONAL)
    private List<ObjectId> cartItemIds = new ArrayList<>();
    
    private double totalPrice;
}
