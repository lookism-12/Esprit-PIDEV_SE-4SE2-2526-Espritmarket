package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.AdminDashboardStatsDTO;
import esprit_market.service.carpoolingService.IDriverProfileService;
import esprit_market.service.carpoolingService.IRidePaymentService;
import esprit_market.service.carpoolingService.IRideRequestService;
import esprit_market.service.carpoolingService.IRideService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/carpooling")
@RequiredArgsConstructor
@Tag(name = "Admin Carpooling Dashboard", description = "Global carpooling statistics")
public class AdminDashboardController {

    private final IRideService rideService;
    private final IRideRequestService rideRequestService;
    private final IDriverProfileService driverProfileService;
    private final IRidePaymentService paymentService;
    private final esprit_market.service.carpoolingService.IBookingService bookingService;
    private final esprit_market.service.userService.IUserService userService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get global carpooling stats with analytics")
    public AdminDashboardStatsDTO getGlobalStats() {
        return AdminDashboardStatsDTO.builder()
                .activeRidesCount(rideService.countActiveRides())
                .pendingRequestsCount(rideRequestService.countPendingRequests())
                .unverifiedDriversCount(driverProfileService.countUnverifiedDrivers())
                .totalRevenue(paymentService.getTotalCompletedRevenue())
                .activeRidesGrowth(12)
                .pendingRequestsGrowth(5)
                .unverifiedDriversGrowth(-2)
                .totalRevenueGrowth(18)
                .ridesTrend(rideService.getMonthlyRidesTrend())
                .earningsTrend(paymentService.getMonthlyEarningsTrend())
                .userGrowth(userService.getMonthlyUserGrowth())
                .statusDistribution(rideService.getStatusDistribution())
                .topRoutes(rideService.getTopRoutes())
                .reservationsDemand(bookingService.getMonthlyDemandTrend())
                .build();
    }
}
