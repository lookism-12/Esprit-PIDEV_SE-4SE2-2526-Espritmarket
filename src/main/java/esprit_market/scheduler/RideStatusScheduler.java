package esprit_market.scheduler;

import esprit_market.service.carpoolingService.IBookingService;
import esprit_market.service.carpoolingService.IDriverProfileService;
import esprit_market.service.carpoolingService.IPassengerProfileService;
import esprit_market.service.carpoolingService.IRidePaymentService;
import esprit_market.service.carpoolingService.IRideService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RideStatusScheduler {

    private final IRideService rideService;
    private final IBookingService bookingService;
    private final IRidePaymentService ridePaymentService;
    private final IPassengerProfileService passengerProfileService;
    private final IDriverProfileService driverProfileService;

    @Scheduled(fixedRate = 60000) // Every minute
    public void transitionRideStatuses() {
        rideService.processStatusTransitions();
    }
}
