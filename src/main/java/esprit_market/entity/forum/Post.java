package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
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
    private ObjectId userId;
    private ObjectId categoryId;
    private String content;
    private LocalDateTime createdAt;
    private boolean isPinned;
    private boolean isApproved;
    private List<ObjectId> commentIds = new ArrayList<>();
    private List<ObjectId> reactionIds = new ArrayList<>();
}
