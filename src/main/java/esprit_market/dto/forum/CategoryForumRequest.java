package esprit_market.dto.forum;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating or updating a CategoryForum.
 * Merges CreateCategoryForumDto and UpdateCategoryForumDto.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryForumRequest {
    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 100, message = "Category name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 500, message = "Description must be between 5 and 500 characters")
    private String description;
}
