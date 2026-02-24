package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyDto {
    private String id;
    private String commentId;
    private String userId;
    private String content;
    private LocalDateTime createdAt;
}
