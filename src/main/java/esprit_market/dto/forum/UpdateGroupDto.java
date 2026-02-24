package esprit_market.dto.forum;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupDto {
    private String name;
    private String topic;
    private String level;
    private String speciality;
    private List<String> memberIds; // if present, must be >= 2
}
