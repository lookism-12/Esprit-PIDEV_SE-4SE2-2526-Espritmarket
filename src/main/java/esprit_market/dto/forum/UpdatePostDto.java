package esprit_market.dto.forum;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePostDto {
    private String content;
    private Boolean pinned;
    private Boolean approved;
}
