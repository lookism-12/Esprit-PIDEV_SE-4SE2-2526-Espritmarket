package esprit_market.dto.forum;

import lombok.*;
import java.util.List;

/**
 * Response DTO for Group entity.
 * Contains all fields that should be exposed to the client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {
    private String id;
    private String name;
    private String topic;
    private String level;
    private String speciality;
    private List<String> memberIds;
    private List<String> messageIds;
}
