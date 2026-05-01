package esprit_market.entity.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * TaxConfig — Configurable TVA (Tax) for Tunisia.
 *
 * Business rules:
 *  - Only ONE record can be isDefault=true at a time (enforced in service)
 *  - If no active config exists the service falls back to DEFAULT_TVA = 0.19
 *  - At checkout: priceTTC = priceHT + (priceHT * rate)
 */
@Document(collection = "tax_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxConfig {

    @Id
    private ObjectId id;

    /** Human-readable label, e.g. "TVA Standard 19%" */
    private String name;

    /** Tax rate as decimal, e.g. 0.19 for 19% */
    private double rate;

    /** Whether this is the default/active tax applied at checkout */
    @Builder.Default
    private boolean isDefault = false;

    /** Whether this tax config is enabled */
    @Builder.Default
    private boolean active = true;

    /** ISO description, e.g. "Taux standard TVA Tunisie" */
    private String description;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}
