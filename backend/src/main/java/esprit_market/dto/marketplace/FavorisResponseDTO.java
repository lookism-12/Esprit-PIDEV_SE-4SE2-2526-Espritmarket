package esprit_market.dto.marketplace;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavorisResponseDTO {
    private String id;
    private String userId;
    private String productId;
    private String serviceId;
    private LocalDateTime createdAt;
}
