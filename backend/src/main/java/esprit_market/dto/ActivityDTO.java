package esprit_market.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDTO {
    private String type;
    private String passengerName;
    private String message;
    private Long timestamp;
    private String status;
}
