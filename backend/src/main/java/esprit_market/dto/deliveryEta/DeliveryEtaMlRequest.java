package esprit_market.dto.deliveryEta;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeliveryEtaMlRequest {
    private String orderId;
    private Double distanceKm;
    private Double routeDurationMinutes;
    private String weather;
    private Double temperatureC;
    private Double windSpeed;
    private Boolean isRain;
    private Integer hourOfDay;
    private Integer dayOfWeek;
    private String vehicleType;
}
