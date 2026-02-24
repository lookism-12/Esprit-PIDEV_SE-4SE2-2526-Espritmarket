package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private String id;
    private String postId;
    private String userId;
    private String parentCommentId;
    private String content;
    private LocalDateTime createdAt;
    private List<String> reactionIds;
}
