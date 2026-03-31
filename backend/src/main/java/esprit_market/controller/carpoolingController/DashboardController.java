package esprit_market.controller.carpoolingController;

import esprit_market.dto.DashboardDTO;
import esprit_market.service.carpoolingService.IDashboardService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Driver Dashboard Controller
 * Provides endpoints for drivers to view their dashboard with stats, rides, and activities
 */
@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private IDashboardService dashboardService;

    /**
     * Get driver dashboard with all aggregated data
     * Endpoint: GET /api/driver/dashboard
     * 
     * @return DashboardDTO containing:
     *         - Stats (completed rides, rating, earnings, active rides)
     *         - Scheduled rides (upcoming/active)
     *         - Pending booking requests
     *         - Current vehicle info
     *         - Recent activities
     *         - Earnings history (12 months)
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDriverDashboard(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId) {
        try {
            // TODO: Get driverId from JWT token in a real scenario
            // For now, using X-Driver-Id header for testing
            if (driverId == null || driverId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            ObjectId driverIdObj = new ObjectId(driverId);
            DashboardDTO dashboard = dashboardService.getDriverDashboard(driverIdObj);
            
            return ResponseEntity.ok(dashboard);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get earnings history for charts
     * Endpoint: GET /api/driver/earnings-history
     */
    @GetMapping("/earnings-history")
    public ResponseEntity<?> getEarningsHistory(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId) {
        try {
            if (driverId == null || driverId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            ObjectId driverIdObj = new ObjectId(driverId);
            var earningsHistory = dashboardService.getEarningsHistory(driverIdObj);
            
            return ResponseEntity.ok(earningsHistory);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get pending booking requests
     * Endpoint: GET /api/driver/pending-bookings
     */
    @GetMapping("/pending-bookings")
    public ResponseEntity<?> getPendingBookings(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId) {
        try {
            if (driverId == null || driverId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            ObjectId driverIdObj = new ObjectId(driverId);
            var pendingBookings = dashboardService.getPendingBookings(driverIdObj);
            
            return ResponseEntity.ok(pendingBookings);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get recent activities
     * Endpoint: GET /api/driver/activities?limit=10
     */
    @GetMapping("/activities")
    public ResponseEntity<?> getRecentActivities(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId,
            @RequestParam(value = "limit", defaultValue = "10") Integer limit) {
        try {
            if (driverId == null || driverId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            ObjectId driverIdObj = new ObjectId(driverId);
            var activities = dashboardService.getRecentActivities(driverIdObj, limit);
            
            return ResponseEntity.ok(activities);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
