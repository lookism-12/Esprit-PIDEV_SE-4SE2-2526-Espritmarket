package esprit_market.dto.SAV;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SavFeedbackRequestDTO {

    @NotBlank(message = "Le type (SAV, FEEDBACK) est obligatoire")
    private String type;

    @NotBlank(message = "Le message est obligatoire")
    private String message;

    @Min(value = 1, message = "La note minimale est 1")
    @Max(value = 5, message = "La note maximale est 5")
    private int rating;

    private String reason;

    private String status;

    @NotBlank(message = "L'ID du produit acheté (CartItem) est obligatoire pour lier le feedback/réclamation")
    private String cartItemId;
}
