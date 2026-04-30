package esprit_market.dto.deliveryEta;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeliveryEtaPredictionDTO {
    private String id;
    private String deliveryId;
    private String orderId;
    private String orderNumber;
    private Integer estimatedMinutes;
    private String riskLevel;
    private String reason;
    private String weather;
    private Double temperatureC;
    private Double windSpeed;
    private Double distanceKm;
    private Double routeDurationMinutes;
    private Double originLatitude;
    private Double originLongitude;
    private Double destinationLatitude;
    private Double destinationLongitude;
    private String modelVersion;
    private String source;
    private LocalDateTime createdAt;
}
