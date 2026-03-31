package esprit_market.service.carpoolingService;

import esprit_market.dto.DashboardDTO;
import org.bson.types.ObjectId;

public interface IDashboardService {
    /**
     * Get complete driver dashboard with all aggregated data
     * 
     * @param driverId Driver's user ID
     * @return DashboardDTO with stats, rides, bookings, earnings, activities
     */
    DashboardDTO getDriverDashboard(ObjectId driverId);

    /**
     * Get earnings history for the last 12 months
     * 
     * @param driverId Driver's user ID
     * @return List of monthly earnings
     */
    java.util.List<Double> getEarningsHistory(ObjectId driverId);

    /**
     * Get pending booking requests for driver's rides
     * 
     * @param driverId Driver's user ID
     * @return List of pending bookings
     */
    java.util.List<esprit_market.dto.carpooling.DashboardBookingResponseDTO> getPendingBookings(ObjectId driverId);

    /**
     * Get recent activity (bookings, completions, reviews)
     * 
     * @param driverId Driver's user ID
     * @param limit    Number of recent activities to return
     * @return List of activities
     */
    java.util.List<esprit_market.dto.ActivityDTO> getRecentActivities(ObjectId driverId, Integer limit);
}
