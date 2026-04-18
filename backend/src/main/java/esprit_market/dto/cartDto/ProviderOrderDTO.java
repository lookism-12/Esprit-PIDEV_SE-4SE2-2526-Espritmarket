package esprit_market.dto.cartDto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderOrderDTO {
    private String orderId;
    private String cartItemId;
    private String clientName;
    private String clientEmail;
    private String clientAvatar;  // ✅ Added for UI display
    private String productName;
    private Integer quantity;
    private Double unitPrice;
    private Double subTotal;
    private String orderStatus;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime orderDate;
}
