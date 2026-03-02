package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id
    private ObjectId id;
    private String name;

    // Product — Category (ManyToMany BIDIRECTIONAL)
    @Builder.Default
    private List<ObjectId> productIds = new ArrayList<>();
}
