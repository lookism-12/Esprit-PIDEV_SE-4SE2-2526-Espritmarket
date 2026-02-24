package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "product_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategory {
    @Id
    private ObjectId id;
    private ObjectId productId;
    private ObjectId categoryId;
}
