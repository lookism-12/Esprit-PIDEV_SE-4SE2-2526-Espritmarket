package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.dto.carpooling.PassengerRideRequestCreationDTO;
import esprit_market.dto.carpooling.RideRequestResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.carpooling.RideRequest;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.RideRequestMapper;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.carpoolingRepository.RideRequestRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import esprit_market.Enum.notificationEnum.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideRequestService implements IRideRequestService {

        private final RideRequestRepository rideRequestRepository;
        private final PassengerProfileRepository passengerProfileRepository;
        private final DriverProfileRepository driverProfileRepository;
        private final UserRepository userRepository;
        private final RideRepository rideRepository;
        private final BookingRepository bookingRepository;
        private final RideRequestMapper rideRequestMapper;
        private final NotificationService notificationService;
        private final esprit_market.repository.carpoolingRepository.VehicleRepository vehicleRepository;

        @Override
        public RideRequestResponseDTO createRequest(PassengerRideRequestCreationDTO dto, String passengerEmail) {
                User user = userRepository.findByEmail(passengerEmail)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                PassengerProfile profile = passengerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));

                RideRequest request = RideRequest.builder()
                                .passengerProfileId(profile.getId())
                                .departureLocation(dto.getDepartureLocation())
                                .destinationLocation(dto.getDestinationLocation())
                                .departureTime(dto.getDepartureTime())
                                .requestedSeats(dto.getRequestedSeats())
                                .proposedPrice(dto.getProposedPrice())
                                .status(RideRequestStatus.PENDING)
                                .build();

                return rideRequestMapper.toResponseDTO(rideRequestRepository.save(request));
        }

        @Override
        public List<RideRequestResponseDTO> getMyRequests(String passengerEmail) {
                User user = userRepository.findByEmail(passengerEmail)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                PassengerProfile profile = passengerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));

                return rideRequestRepository.findByPassengerProfileId(profile.getId()).stream()
                                .map(rideRequestMapper::toResponseDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public List<RideRequestResponseDTO> getAvailableRequests() {
                return rideRequestRepository
                                .findByStatusAndDepartureTimeAfter(RideRequestStatus.PENDING, LocalDateTime.now())
                                .stream()
                                .map(rideRequestMapper::toResponseDTO)
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional
        public RideRequestResponseDTO acceptRequest(String requestId, String driverEmail, String vehicleId) {
                User user = userRepository.findByEmail(driverEmail)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                DriverProfile driverProfile = driverProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

                RideRequest request = rideRequestRepository.findById(new ObjectId(requestId))
                                .orElseThrow(() -> new IllegalArgumentException("Ride request not found"));

                if (request.getStatus() != RideRequestStatus.PENDING) {
                        throw new IllegalStateException("Ride request is no longer available.");
                }

                // 1. Create a Ride mapping this request to the driver's vehicle
                esprit_market.entity.carpooling.Vehicle vehicle = vehicleRepository.findById(new ObjectId(vehicleId))
                                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
                int totalSeats = vehicle.getNumberOfSeats() != null ? vehicle.getNumberOfSeats() : 4;
                int remainingSeats = Math.max(0, totalSeats - request.getRequestedSeats());

                Ride ride = Ride.builder()
                                .driverProfileId(driverProfile.getId())
                                .vehicleId(new ObjectId(vehicleId))
                                .departureLocation(request.getDepartureLocation())
                                .destinationLocation(request.getDestinationLocation())
                                .departureTime(request.getDepartureTime())
                                .availableSeats(remainingSeats)
                                .pricePerSeat(request.getProposedPrice() != null ? request.getProposedPrice() : 5.0f)
                                .status(RideStatus.ACCEPTED)
                                .estimatedDurationMinutes(60)
                                .build();
                ride = rideRepository.save(ride);

                // 2. Create the Booking confirming it immediately
                Booking booking = Booking.builder()
                                .rideId(ride.getId())
                                .passengerProfileId(request.getPassengerProfileId())
                                .numberOfSeats(request.getRequestedSeats())
                                .pickupLocation(request.getDepartureLocation())
                                .dropoffLocation(request.getDestinationLocation())
                                .status(BookingStatus.CONFIRMED)
                                .totalPrice(request.getRequestedSeats() * ride.getPricePerSeat())
                                .build();
                bookingRepository.save(booking);

                // 3. Mark the request as accepted
                request.setStatus(RideRequestStatus.ACCEPTED);
                request.setDriverProfileId(driverProfile.getId());
                request.setRideId(ride.getId());
                final RideRequest savedRequest = rideRequestRepository.save(request);

                // 4. Notify the passenger
                passengerProfileRepository.findById(savedRequest.getPassengerProfileId()).ifPresent(passengerProfile ->
                        userRepository.findById(passengerProfile.getUserId()).ifPresent(passengerUser ->
                                notificationService.sendNotification(
                                        passengerUser,
                                        "Ride Request Accepted! 🚗",
                                        "A driver has accepted your request from " + savedRequest.getDepartureLocation()
                                                + " to " + savedRequest.getDestinationLocation() + ". Your booking is confirmed.",
                                        NotificationType.RIDE_UPDATE,
                                        savedRequest.getId().toHexString()
                                )
                        )
                );

                // 5. Notify admins about the new ride request acceptance
                notificationService.notifyAllAdmins(
                        "Ride Request Accepted 🚗",
                        "A driver (" + user.getFirstName() + " " + user.getLastName() 
                                + ") has accepted a ride request from " + savedRequest.getDepartureLocation()
                                + " to " + savedRequest.getDestinationLocation() + ".",
                        NotificationType.RIDE_UPDATE,
                        savedRequest.getId().toHexString()
                );

                return rideRequestMapper.toResponseDTO(savedRequest);
        }

        @Override
        public void cancelRequest(String requestId, String passengerEmail) {
                User user = userRepository.findByEmail(passengerEmail)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                PassengerProfile profile = passengerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));

                RideRequest request = rideRequestRepository.findById(new ObjectId(requestId))
                                .orElseThrow(() -> new IllegalArgumentException("Ride request not found"));

                if (!request.getPassengerProfileId().equals(profile.getId())) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "Only the owner can delete this request");
                }

                if (request.getStatus() == RideRequestStatus.CANCELLED) {
                        throw new IllegalStateException("Request is already cancelled");
                }

                // If already accepted, cancel the associated booking too
                if (request.getStatus() == RideRequestStatus.ACCEPTED && request.getRideId() != null) {
                        bookingRepository.findByRideId(request.getRideId()).stream()
                                .filter(b -> b.getPassengerProfileId().equals(profile.getId())
                                        && b.getStatus() != BookingStatus.CANCELLED
                                        && b.getStatus() != BookingStatus.COMPLETED)
                                .forEach(b -> {
                                        b.setStatus(BookingStatus.CANCELLED);
                                        b.setCancelledAt(java.time.LocalDateTime.now());
                                        bookingRepository.save(b);
                                        // Restore seats on the ride
                                        rideRepository.findById(request.getRideId()).ifPresent(ride -> {
                                                ride.setAvailableSeats(ride.getAvailableSeats() + b.getNumberOfSeats());
                                                rideRepository.save(ride);
                                        });
                                });
                }

                request.setStatus(RideRequestStatus.CANCELLED);
                rideRequestRepository.save(request);
        }

        @Override
        public List<RideRequestResponseDTO> findAll() {
                return rideRequestRepository.findAll().stream()
                                .map(rideRequestMapper::toResponseDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public long countPendingRequests() {
                return rideRequestRepository.countByStatus(RideRequestStatus.PENDING);
        }

        @Override
        public RideRequestResponseDTO counterPrice(String requestId, Float price, String note) {
                RideRequest request = rideRequestRepository.findById(new ObjectId(requestId))
                                .orElseThrow(() -> new IllegalArgumentException("Ride request not found"));

                if (request.getStatus() != RideRequestStatus.PENDING) {
                        throw new IllegalStateException("Can only counter-price a PENDING request");
                }

                request.setCounterPrice(price);
                request.setCounterPriceNote(note);
                RideRequest saved = rideRequestRepository.save(request);

                // Notify the passenger about the counter offer
                passengerProfileRepository.findById(saved.getPassengerProfileId()).ifPresent(profile ->
                        userRepository.findById(profile.getUserId()).ifPresent(passengerUser ->
                                notificationService.sendNotification(
                                        passengerUser,
                                        "Counter Offer Received 💬",
                                        "A driver has proposed " + price + " TND for your ride from "
                                                + saved.getDepartureLocation() + " to " + saved.getDestinationLocation()
                                                + (note != null && !note.isBlank() ? ". Note: " + note : ""),
                                        NotificationType.RIDE_UPDATE,
                                        saved.getId().toHexString()
                                )
                        )
                );

                return rideRequestMapper.toResponseDTO(saved);
        }
}
