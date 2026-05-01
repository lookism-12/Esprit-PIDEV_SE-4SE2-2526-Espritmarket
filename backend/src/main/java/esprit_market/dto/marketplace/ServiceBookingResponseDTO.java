package esprit_market.dto.marketplace;

import esprit_market.Enum.marketplaceEnum.BookingStatus;
import esprit_market.Enum.marketplaceEnum.MeetingMode;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for service booking response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceBookingResponseDTO {
    
    private String id;
    private String serviceId;
    private String serviceName;
    private String userId;
    private String userName;
    private String clientId;
    private String clientName;
    private String providerId;
    private String shopId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private MeetingMode meetingMode;
    private BookingStatus status;
    private LocalDateTime createdAt;
    private String notes;
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String rejectionReason;
    private LocalDateTime rejectedAt;
    private LocalDateTime approvedAt;
    private String conversationId;
}
