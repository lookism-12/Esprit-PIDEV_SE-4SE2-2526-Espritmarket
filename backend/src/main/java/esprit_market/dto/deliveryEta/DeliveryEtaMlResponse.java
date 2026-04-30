package esprit_market.dto.deliveryEta;

import lombok.Data;

@Data
public class DeliveryEtaMlResponse {
    private String orderId;
    private Integer estimatedMinutes;
    private String riskLevel;
    private String reason;
    private String weather;
    private Double distanceKm;
    private String modelVersion;
}
