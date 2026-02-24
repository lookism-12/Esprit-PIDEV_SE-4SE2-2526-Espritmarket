package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionDto {
    private String id;
    private String type;
    private String userId;
    private String postId;
    private String commentId;
    private LocalDateTime createdAt;
}
