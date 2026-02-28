package esprit_market.scheduler;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.Ride;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.service.carpoolingService.DriverProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RideStatusScheduler {

    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final RidePaymentRepository ridePaymentRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final DriverProfileService driverProfileService;

    @Scheduled(fixedRate = 60000) // Every minute
    public void transitionRideStatuses() {
        LocalDateTime now = LocalDateTime.now();

        List<Ride> confirmedRides = rideRepository.findByStatusAndDepartureTimeBefore(RideStatus.CONFIRMED, now);
        for (Ride ride : confirmedRides) {
            ride.setStatus(RideStatus.IN_PROGRESS);
            rideRepository.save(ride);

            // Logic improvement: Cancel any remaining PENDING bookings when ride starts
            List<Booking> pendingBookings = bookingRepository.findByRideIdAndStatus(ride.getId(),
                    BookingStatus.PENDING);
            for (Booking b : pendingBookings) {
                b.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(b);
                log.debug("Pending booking {} cancelled because ride {} started", b.getId(), ride.getId());
            }

            log.debug("Ride {} transitioned to IN_PROGRESS", ride.getId());
        }

        List<Ride> inProgressRides = rideRepository.findByStatus(RideStatus.IN_PROGRESS);
        for (Ride ride : inProgressRides) {
            int duration = ride.getEstimatedDurationMinutes() != null ? ride.getEstimatedDurationMinutes() : 120;
            if (ride.getDepartureTime().plusMinutes(duration).isBefore(now)) {
                ride.setStatus(RideStatus.COMPLETED);
                ride.setCompletedAt(now);
                rideRepository.save(ride);

                List<Booking> bookings = bookingRepository.findByRideIdAndStatus(ride.getId(), BookingStatus.CONFIRMED);
                float totalEarnings = 0;
                for (Booking b : bookings) {
                    b.setStatus(BookingStatus.COMPLETED);
                    bookingRepository.save(b);

                    // Part 2: Increment passenger total rides
                    passengerProfileRepository.findById(b.getPassengerProfileId()).ifPresent(p -> {
                        p.setTotalRidesCompleted(
                                p.getTotalRidesCompleted() != null ? p.getTotalRidesCompleted() + 1 : 1);
                        passengerProfileRepository.save(p);
                    });

                    ridePaymentRepository.findByBookingId(b.getId()).ifPresent(payment -> {
                        payment.setStatus(PaymentStatus.COMPLETED);
                        ridePaymentRepository.save(payment);
                    });
                    totalEarnings += b.getTotalPrice() != null ? b.getTotalPrice() : 0;
                }
                final float finalEarnings = totalEarnings;
                driverProfileService.incrementTotalRidesAndEarnings(ride.getDriverProfileId(), finalEarnings);

                log.debug("Ride {} transitioned to COMPLETED", ride.getId());
            }
        }
    }
}
