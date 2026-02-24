package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "shops")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shop {
    @Id
    private ObjectId id;
    private ObjectId ownerId;
}
