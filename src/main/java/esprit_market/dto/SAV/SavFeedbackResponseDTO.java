package esprit_market.dto.SAV;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SavFeedbackResponseDTO {
    private String id;
    private String type;
    private String message;
    private int rating;
    private String reason;
    private String status;
    private LocalDateTime creationDate;
    private String cartItemId;
}
