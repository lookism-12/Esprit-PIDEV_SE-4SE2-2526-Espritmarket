package esprit_market.dto.forum;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

/**
 * Request DTO for creating or updating a Group.
 * Merges CreateGroupDto and UpdateGroupDto into a single unified request model.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupRequest {
    @NotBlank(message = "Group name is required")
    @Size(min = 2, max = 100, message = "Group name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Topic is required")
    @Size(min = 2, max = 255, message = "Topic must be between 2 and 255 characters")
    private String topic;

    @NotBlank(message = "Level is required")
    @Size(min = 2, max = 50, message = "Level must be between 2 and 50 characters")
    private String level;

    @NotBlank(message = "Speciality is required")
    @Size(min = 2, max = 100, message = "Speciality must be between 2 and 100 characters")
    private String speciality;

    @NotNull(message = "At least 2 members are required")
    @Size(min = 2, message = "Group must have at least 2 members")
    private List<@NotBlank(message = "Member ID cannot be blank") String> memberIds;
}
