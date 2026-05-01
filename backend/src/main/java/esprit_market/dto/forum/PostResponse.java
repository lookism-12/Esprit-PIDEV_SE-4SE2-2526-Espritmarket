package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for Post entity.
 * Contains all fields that should be exposed to the client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private String id;
    private String userId;
    private String categoryId;
    private String content;
    private LocalDateTime createdAt;
    private boolean pinned;
    private boolean approved;
    private List<String> commentIds;
    private List<String> reactionIds;
    @Builder.Default
    private List<RecommendedForumPost> recommendedPosts = new ArrayList<>();
}
