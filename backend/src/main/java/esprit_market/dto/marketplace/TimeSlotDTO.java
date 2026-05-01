package esprit_market.dto.marketplace;

import esprit_market.Enum.marketplaceEnum.MeetingMode;
import lombok.*;

import java.time.LocalTime;
import java.util.List;

/**
 * DTO representing an available time slot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotDTO {
    
    /**
     * Start time of the slot
     */
    private LocalTime startTime;
    
    /**
     * End time of the slot
     */
    private LocalTime endTime;
    
    /**
     * Whether this slot is available
     */
    private boolean available;
    
    /**
     * Display label (e.g., "09:00 - 10:00")
     */
    private String label;
    
    /**
     * Meeting modes allowed for this slot.
     */
    private List<MeetingMode> availableModes;
}
