package esprit_market.dto.carpooling;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponseDTO {
    private String id;
    private String passengerName;
    private String passengerAvatar;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
