package esprit_market.dto.marketplace;

import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for service availability configuration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceAvailabilityDTO {
    
    /**
     * Days of week when service is available
     */
    @Builder.Default
    private List<DayOfWeek> workingDays = new ArrayList<>();
    
    /**
     * Time ranges when service is available
     */
    @Builder.Default
    private List<TimeRangeDTO> timeRanges = new ArrayList<>();
    
    /**
     * Optional break times
     */
    @Builder.Default
    private List<TimeRangeDTO> breaks = new ArrayList<>();
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeRangeDTO {
        private LocalTime startTime;
        private LocalTime endTime;
    }
}
