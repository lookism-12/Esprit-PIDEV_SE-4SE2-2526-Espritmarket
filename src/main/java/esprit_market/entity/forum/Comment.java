package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    private ObjectId id;

    // Post — Comment (OneToMany BIDIRECTIONAL)
    private ObjectId postId;

    private String content;

    // Comment — Reaction (OneToMany BIDIRECTIONAL)
    @Builder.Default
    private List<ObjectId> replyIds = new ArrayList<>();
}
