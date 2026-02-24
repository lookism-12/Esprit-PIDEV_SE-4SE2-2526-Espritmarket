package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDto {
    private String id;
    private String userId;
    private String categoryId;
    private String content;
    private LocalDateTime createdAt;
    private boolean pinned;
    private boolean approved;
    private List<String> commentIds;
    private List<String> reactionIds;
}
