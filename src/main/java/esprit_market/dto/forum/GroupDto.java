package esprit_market.dto.forum;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDto {
    private String id;
    private String name;
    private String topic;
    private String level;
    private String speciality;
    private List<String> memberIds;
    private List<String> messageIds;
}
