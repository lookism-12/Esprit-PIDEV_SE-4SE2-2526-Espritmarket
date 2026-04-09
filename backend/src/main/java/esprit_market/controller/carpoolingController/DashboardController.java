package esprit_market.controller.carpoolingController;

import esprit_market.dto.DashboardDTO;
import esprit_market.service.carpoolingService.IDashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
@Tag(name = "Driver Dashboard", description = "Driver dashboard aggregated data")
public class DashboardController {

    private final IDashboardService dashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDriverDashboard(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId) {
        if (driverId == null || driverId.isEmpty()) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.ok(dashboardService.getDriverDashboard(new ObjectId(driverId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/earnings-history")
    public ResponseEntity<?> getEarningsHistory(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId) {
        if (driverId == null || driverId.isEmpty()) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.ok(dashboardService.getEarningsHistory(new ObjectId(driverId)));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/pending-bookings")
    public ResponseEntity<?> getPendingBookings(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId) {
        if (driverId == null || driverId.isEmpty()) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.ok(dashboardService.getPendingBookings(new ObjectId(driverId)));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/activities")
    public ResponseEntity<?> getRecentActivities(
            @RequestHeader(value = "X-Driver-Id", required = false) String driverId,
            @RequestParam(defaultValue = "10") Integer limit) {
        if (driverId == null || driverId.isEmpty()) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.ok(dashboardService.getRecentActivities(new ObjectId(driverId), limit));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
