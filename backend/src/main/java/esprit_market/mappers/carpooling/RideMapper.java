package esprit_market.mappers.carpooling;

import esprit_market.dto.carpooling.RideResponseDTO;
import esprit_market.entity.carpooling.Ride;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.VehicleRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RideMapper {

    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final esprit_market.repository.carpoolingRepository.BookingRepository bookingRepository;
    private final esprit_market.repository.carpoolingRepository.RidePaymentRepository ridePaymentRepository;

    public RideResponseDTO toResponseDTO(Ride ride) {
        if (ride == null)
            return null;

        String driverName = "";
        String vehicleMake = "";
        String vehicleModel = "";

        var driverProfile = driverProfileRepository.findById(ride.getDriverProfileId()).orElse(null);
        if (driverProfile != null) {
            var user = userRepository.findById(driverProfile.getUserId()).orElse(null);
            if (user != null)
                driverName = user.getFirstName() + " " + user.getLastName();
        }

        var vehicle = vehicleRepository.findById(ride.getVehicleId()).orElse(null);
        int totalSeats = 4;
        if (vehicle != null) {
            vehicleMake = vehicle.getMake();
            vehicleModel = vehicle.getModel();
        }

        var bookings = bookingRepository.findByRideId(ride.getId());
        int bookedSeats = bookings.stream().mapToInt(b -> b.getNumberOfSeats()).sum();
        long paidBookingsCount = bookings.stream()
                .filter(b -> {
                    var payment = ridePaymentRepository.findByBookingId(b.getId());
                    return payment.isPresent()
                            && payment.get().getStatus() == esprit_market.Enum.carpoolingEnum.PaymentStatus.COMPLETED;
                })
                .count();

        // IMPROVEMENT #2: Calculate estimated earnings based on available seats
        // Potential earnings = remaining available seats * price per seat
        int actualAvailableSeats = Math.max(0, totalSeats - bookedSeats);
        Float estimatedEarnings = actualAvailableSeats * ride.getPricePerSeat();

        return RideResponseDTO.builder()
                .rideId(ride.getId() != null ? ride.getId().toHexString() : null)
                .driverProfileId(ride.getDriverProfileId() != null ? ride.getDriverProfileId().toHexString() : null)
                .driverName(driverName)
                .vehicleId(ride.getVehicleId() != null ? ride.getVehicleId().toHexString() : null)
                .vehicleMake(vehicleMake)
                .vehicleModel(vehicleModel)
                .departureLocation(ride.getDepartureLocation())
                .destinationLocation(ride.getDestinationLocation())
                .departureTime(ride.getDepartureTime())
                .availableSeats(ride.getAvailableSeats())
                .pricePerSeat(ride.getPricePerSeat())
                .status(ride.getStatus())
                .totalSeats(totalSeats)
                .bookedSeats(bookedSeats)
                .paidBookingsCount((int) paidBookingsCount)
                .estimatedEarnings(estimatedEarnings)
                .completedAt(ride.getCompletedAt())
                .build();
    }
}
