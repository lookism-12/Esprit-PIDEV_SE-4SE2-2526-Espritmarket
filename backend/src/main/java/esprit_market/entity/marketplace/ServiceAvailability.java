package esprit_market.entity.marketplace;

import esprit_market.Enum.marketplaceEnum.AvailabilityMode;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents provider-defined availability rules for a service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceAvailability {
    
    /**
     * Days of week when service is available
     */
    @Builder.Default
    private List<DayOfWeek> workingDays = new ArrayList<>();
    
    /**
     * Time ranges when service is available
     */
    @Builder.Default
    private List<TimeRange> timeRanges = new ArrayList<>();
    
    /**
     * Optional break times (e.g., lunch break)
     */
    @Builder.Default
    private List<TimeRange> breaks = new ArrayList<>();
    
    /**
     * Represents a time range (start - end)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeRange {
        private LocalTime startTime;
        private LocalTime endTime;
        
        @Builder.Default
        private AvailabilityMode availableMode = AvailabilityMode.BOTH;
        
        /**
         * Check if a time falls within this range
         */
        public boolean contains(LocalTime time) {
            return !time.isBefore(startTime) && !time.isAfter(endTime);
        }
        
        /**
         * Check if this range overlaps with another
         */
        public boolean overlaps(TimeRange other) {
            return !(endTime.isBefore(other.startTime) || endTime.equals(other.startTime) ||
                    startTime.isAfter(other.endTime) || startTime.equals(other.endTime));
        }
    }
}
