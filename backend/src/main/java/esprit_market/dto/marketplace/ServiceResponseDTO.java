package esprit_market.dto.marketplace;

import esprit_market.Enum.marketplaceEnum.ServiceStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceResponseDTO {
    private String id;
    private String name;
    private String description;
    private double price;
    private String shopId;
    private String categoryId;
    private String createdByUserId;
    
    // Booking system fields
    private int durationMinutes;
    private ServiceStatus status;
    private String workingHoursStart;
    private String workingHoursEnd;
    
    // Provider-controlled availability
    private ServiceAvailabilityDTO availability;
}
