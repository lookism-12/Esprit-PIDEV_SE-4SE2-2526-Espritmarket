package esprit_market.dto.negociation;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NegociationRequest {

    @NotBlank(message = "Service ID is required")
    private String serviceId;

    private Double amount;

    private Integer quantity;

    private String message;

    private String exchangeImage;

    private Boolean isExchange;
}
