package esprit_market.dto.SAV;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SavFeedbackResponseDTO {
    private String id;
    private String type;
    private String message;
    private int rating;
    private String reason;
    private String status;
    private String problemNature;
    private String priority;
    private String desiredSolution;
    private List<String> positiveTags;
    private Boolean recommendsProduct;
    private String adminResponse;
    private Boolean readByAdmin;
    private LocalDateTime creationDate;
    private String cartItemId;
}
