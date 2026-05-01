package esprit_market.dto.forum;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumRecommendationResponse {
    @JsonProperty("post_id")
    private String postId;

    @Builder.Default
    private List<RecommendedForumPost> recommendations = new ArrayList<>();

    @JsonProperty("total_count")
    private Integer totalCount;

    @JsonProperty("algorithm_used")
    private String algorithmUsed;

    @JsonProperty("generated_at")
    private String generatedAt;
}
