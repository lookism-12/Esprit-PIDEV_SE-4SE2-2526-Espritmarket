package esprit_market.entity.marketplace;

import esprit_market.Enum.marketplaceEnum.ServiceStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "services")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEntity {
    @Id
    private ObjectId id;
    private String name;
    private String description;
    private double price;
    private ObjectId shopId;
    private ObjectId categoryId;
    private ObjectId createdByUserId;
    
    // ========================================
    // SERVICE BOOKING SYSTEM FIELDS
    // ========================================
    
    /**
     * Service duration in minutes (e.g., 60 for 1 hour)
     */
    @Builder.Default
    private int durationMinutes = 60;
    
    /**
     * List of booking IDs for this service
     */
    @Builder.Default
    private List<ObjectId> bookingIds = new ArrayList<>();
    
    /**
     * Service availability status
     */
    @Builder.Default
    private ServiceStatus status = ServiceStatus.AVAILABLE;
    
    /**
     * DEPRECATED: Use availability.timeRanges instead
     * Kept for backward compatibility
     */
    @Builder.Default
    private String workingHoursStart = "09:00";
    
    /**
     * DEPRECATED: Use availability.timeRanges instead
     * Kept for backward compatibility
     */
    @Builder.Default
    private String workingHoursEnd = "18:00";
    
    // ========================================
    // PROVIDER-CONTROLLED AVAILABILITY
    // ========================================
    
    /**
     * Provider-defined availability rules
     * Defines when the service can be booked
     */
    @Builder.Default
    private ServiceAvailability availability = new ServiceAvailability();
}
