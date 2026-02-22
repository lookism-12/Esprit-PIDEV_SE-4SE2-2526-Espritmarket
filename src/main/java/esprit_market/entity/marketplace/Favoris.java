package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "favoris")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Favoris {
    @Id
    private ObjectId id;
    
    // User — Favoris (OneToMany BIDIRECTIONAL)
    private ObjectId userId;

    // Favoris — Product (ManyToOne UNIDIRECTIONAL)
    private ObjectId productId;

    // Favoris — Service (ManyToOne UNIDIRECTIONAL)
    private ObjectId serviceId;
}
