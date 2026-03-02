package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "category_forum")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryForum {
    @Id
    private ObjectId id;
    private String name;
    private String description;
}
