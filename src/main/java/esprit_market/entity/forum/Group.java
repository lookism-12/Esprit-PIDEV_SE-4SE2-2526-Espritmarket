package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Group {
    @Id
    private ObjectId id;
    private String name;

    // User — Group (ManyToMany BIDIRECTIONAL)
    @Builder.Default
    private List<ObjectId> memberIds = new ArrayList<>();

    // Group — Message (OneToMany UNIDIRECTIONAL Group -> Message only)
    @Builder.Default
    private List<ObjectId> messageIds = new ArrayList<>();
}
