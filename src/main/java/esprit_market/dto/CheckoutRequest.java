package esprit_market.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    private String shippingAddress;
    private String billingAddress;
    private String notes;
}
