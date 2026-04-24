package esprit_market.dto.carpooling.stats;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AggregationAmountResult {
    private String id;
    private double amount;
}
