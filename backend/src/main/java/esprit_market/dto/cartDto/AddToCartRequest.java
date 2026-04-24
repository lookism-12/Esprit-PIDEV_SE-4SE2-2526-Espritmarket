package esprit_market.dto.cartDto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.*;

/**
 * Request DTO for adding a product to cart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    
    @NotNull(message = "Product ID is required")
    @Pattern(regexp = "^[0-9a-fA-F]{24}$", message = "Product ID must be a valid 24-character hexadecimal string")
    private String productId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    /** Optional negotiated price — overrides the product's listed price when set. */
    private Double negotiatedPrice;
}
