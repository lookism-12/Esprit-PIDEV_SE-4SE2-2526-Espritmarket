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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/carpooling")
@RequiredArgsConstructor
@Tag(name = "Admin Carpooling Dashboard", description = "Management APIs for carpooling global statistics")
public class AdminDashboardController {

        private final IRideService rideService;
        private final IRideRequestService rideRequestService;
        private final IDriverProfileService driverProfileService;
        private final IRidePaymentService paymentService;

        @GetMapping("/stats")
        @PreAuthorize("hasRole('ADMIN')")
        @Operation(summary = "Get global carpooling stats", description = "Returns aggregated counts for rides, requests, drivers, and revenue")
        public AdminDashboardStatsDTO getGlobalStats() {
                long activeRides = rideService.countActiveRides();
                long pendingRequests = rideRequestService.countPendingRequests();
                long unverifiedDrivers = driverProfileService.countUnverifiedDrivers();
                double totalRevenue = paymentService.getTotalCompletedRevenue();

                return AdminDashboardStatsDTO.builder()
                                .activeRidesCount(activeRides)
                                .pendingRequestsCount(pendingRequests)
                                .unverifiedDriversCount(unverifiedDrivers)
                                .totalRevenue(totalRevenue)
                                .activeRidesGrowth(12) // Placeholder for now
                                .pendingRequestsGrowth(5)
                                .unverifiedDriversGrowth(-2)
                                .totalRevenueGrowth(18)
                                .build();
        }
}
