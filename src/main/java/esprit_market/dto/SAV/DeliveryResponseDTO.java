package esprit_market.dto.SAV;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeliveryResponseDTO {
    private String id;
    private String address;
    private LocalDateTime deliveryDate;
    private String status;
    private String userId;
    private String cartId;
}
