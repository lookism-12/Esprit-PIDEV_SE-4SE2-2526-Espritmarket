package esprit_market.entity.marketplace;

import esprit_market.Enum.marketplaceEnum.BookingStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Service Booking entity for appointment/reservation system
 */
@Document(collection = "service_bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceBooking {
    
    @Id
    private ObjectId id;
    
    /**
     * Service being booked
     */
    private ObjectId serviceId;
    
    /**
     * User who made the booking
     */
    private ObjectId userId;
    
    /**
     * Shop providing the service
     */
    private ObjectId shopId;
    
    /**
     * Booking date
     */
    private LocalDate bookingDate;
    
    /**
     * Start time of the booking
     */
    private LocalTime startTime;
    
    /**
     * End time of the booking (calculated from start + duration)
     */
    private LocalTime endTime;
    
    /**
     * Booking status
     */
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;
    
    /**
     * When the booking was created
     */
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * Optional notes from customer
     */
    private String notes;
    
    /**
     * Cancellation reason (if cancelled)
     */
    private String cancellationReason;
    
    /**
     * When the booking was cancelled
     */
    private LocalDateTime cancelledAt;
    
    /**
     * Rejection reason (if rejected by provider)
     */
    private String rejectionReason;
    
    /**
     * When the booking was rejected
     */
    private LocalDateTime rejectedAt;
    
    /**
     * When the booking was approved
     */
    private LocalDateTime approvedAt;
}
