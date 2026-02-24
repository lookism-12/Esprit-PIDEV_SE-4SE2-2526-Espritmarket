package esprit_market.dto.forum;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReactionDto {
    private String type; // LIKE, DISLIKE, LOVE, HAHA
    private String userId;
    private String postId;   // one of postId or commentId
    private String commentId;
}
