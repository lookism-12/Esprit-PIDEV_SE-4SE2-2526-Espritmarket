package esprit_market.dto.forum;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReplyDto {
    private String commentId;
    private String userId;
    private String content;
}
