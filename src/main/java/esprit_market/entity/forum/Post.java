package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    @Id
    private ObjectId id;
    
    // User — Post (OneToMany BIDIRECTIONAL)
    private ObjectId userId;
    
    private String content;
    
    // Post — Comment (OneToMany BIDIRECTIONAL)
    private List<ObjectId> commentIds = new ArrayList<>();
}
