package esprit_market.dto.forum;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating or updating a Post.
 * Merges CreatePostDto and UpdatePostDto.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    @NotBlank(message = "Content is required")
    @Size(min = 5, max = 5000, message = "Content must be between 5 and 5000 characters")
    private String content;

    private Boolean pinned;
    private Boolean approved;
}
