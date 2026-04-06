package esprit_market.dto.SAV;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliveryRequestDTO {

    @NotBlank(message = "L'adresse de livraison est obligatoire")
    private String address;

    private LocalDateTime deliveryDate;

    private String status;

    @NotBlank(message = "L'ID de l'utilisateur (assigné) est obligatoire")
    private String userId;

    @NotBlank(message = "L'ID du panier (Cart) est obligatoire")
    private String cartId;
}
