package esprit_market.dto.forum;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupDto {
    private String name;
    private String topic;
    private String level;
    private String speciality;
    private List<String> memberIds; // minimum 2 required
}
