package esprit_market.dto.forum;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentDto {
    private String postId;
    private String userId;
    private String parentCommentId; // optional, for reply to another comment
    private String content;
}
