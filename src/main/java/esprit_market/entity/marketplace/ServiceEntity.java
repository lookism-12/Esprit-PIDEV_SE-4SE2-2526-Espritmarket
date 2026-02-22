package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "services")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEntity {
    @Id
    private ObjectId id;
    private String name;
    private String description;
    private double price;
    private ObjectId shopId;
    private ObjectId categoryId;
}
