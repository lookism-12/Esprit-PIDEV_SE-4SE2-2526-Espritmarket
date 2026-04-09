package esprit_market.service.carpoolingService;

import esprit_market.dto.ActivityDTO;
import esprit_market.dto.DashboardDTO;
import esprit_market.dto.carpooling.DashboardBookingResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IDashboardService {
    DashboardDTO getDriverDashboard(ObjectId driverId);
    List<Double> getEarningsHistory(ObjectId driverId);
    List<DashboardBookingResponseDTO> getPendingBookings(ObjectId driverId);
    List<ActivityDTO> getRecentActivities(ObjectId driverId, Integer limit);
}
