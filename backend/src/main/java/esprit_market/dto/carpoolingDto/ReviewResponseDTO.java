package esprit_market.dto.carpooling;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseDTO {
    private String id;
    private String passengerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
