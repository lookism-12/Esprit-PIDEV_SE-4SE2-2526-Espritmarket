package esprit_market.dto.forum;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendedForumPost {
    @JsonProperty("post_id")
    private String postId;

    private String title;
    private String excerpt;
    private String content;

    @JsonProperty("category_id")
    private String categoryId;

    private String category;
    private Double score;
    private String source;
}
