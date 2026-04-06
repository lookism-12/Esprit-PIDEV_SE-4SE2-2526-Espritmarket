package esprit_market.dto.SAV;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

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

    private String problemNature;

    private String priority;

    private String desiredSolution;

    private List<String> positiveTags;

    private Boolean recommendsProduct;

    private String adminResponse;

    private Boolean readByAdmin;

    @NotBlank(message = "L'ID du produit acheté (CartItem) est obligatoire pour lier le feedback/réclamation")
    private String cartItemId;
}
