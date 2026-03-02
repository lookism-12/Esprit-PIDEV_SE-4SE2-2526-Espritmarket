package esprit_market.dto.forum;

import lombok.*;

/**
 * Response DTO for CategoryForum entity.
 * Contains all fields that should be exposed to the client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryForumResponse {
    private String id;
    private String name;
    private String description;
}
