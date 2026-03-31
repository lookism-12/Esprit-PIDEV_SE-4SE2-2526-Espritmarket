package esprit_market.dto.carpoolingDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerProfileResponseDTO {
    private String id;
    private String userId;
    private String fullName;
    private String email;
    private Float averageRating;
    private String preferences;
    private List<String> bookingIds;
    private Integer totalRidesCompleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
