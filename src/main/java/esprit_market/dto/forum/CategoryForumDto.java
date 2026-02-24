package esprit_market.dto.forum;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryForumDto {
    private String id;
    private String name;
    private String description;
}
