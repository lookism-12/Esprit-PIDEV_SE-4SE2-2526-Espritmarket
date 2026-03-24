package esprit_market.dto.cartDto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelOrderItemRequest {
    
    @NotBlank(message = "Cart item ID is required")
    private String cartItemId;
    
    @Min(value = 1, message = "Quantity to cancel must be at least 1")
    private Integer quantityToCancel;
    
    private String reason;
}
