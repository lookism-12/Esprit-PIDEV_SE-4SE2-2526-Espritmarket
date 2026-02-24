package esprit_market.dto.forum;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostDto {
    private String userId;
    private String categoryId;
    private String content;
}
