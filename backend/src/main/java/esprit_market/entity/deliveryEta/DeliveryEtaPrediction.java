package esprit_market.entity.deliveryEta;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "delivery_eta_predictions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryEtaPrediction {
    @Id
    private ObjectId id;
    private ObjectId deliveryId;
    private ObjectId orderId;
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
