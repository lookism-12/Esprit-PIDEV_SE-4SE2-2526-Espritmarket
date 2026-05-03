package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.Enum.notificationEnum.NotificationType;

import esprit_market.dto.carpooling.PassengerRideRequestCreationDTO;
import esprit_market.dto.carpooling.RideRequestResponseDTO;
import esprit_market.entity.carpooling.*;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.RideRequestMapper;
import esprit_market.repository.carpoolingRepository.*;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import esprit_market.service.mlService.PredictiveAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final VehicleRepository vehicleRepository;
    private final RideRequestMapper rideRequestMapper;
    private final NotificationService notificationService;
    private final PredictiveAiService predictiveAiService;
    private final PassengerEngagementService engagementService;

    @Override
    public RideRequestResponseDTO createRequest(PassengerRideRequestCreationDTO dto, String passengerEmail) {
        User user = userRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        PassengerProfile profile = passengerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    PassengerProfile newProfile = PassengerProfile.builder()
                            .userId(user.getId())
                            .averageRating(0f)
                            .preferences("")
                            .build();
                    newProfile = passengerProfileRepository.save(newProfile);
                    user.setPassengerProfileId(newProfile.getId());
                    List<esprit_market.Enum.userEnum.Role> currentRoles = user.getRoles();
                    if (currentRoles == null) {
                        currentRoles = new java.util.ArrayList<>();
                    } else {
                        currentRoles = new java.util.ArrayList<>(currentRoles);
                    }
                    
                    if (!currentRoles.contains(esprit_market.Enum.userEnum.Role.PASSENGER)) {
                        currentRoles.add(esprit_market.Enum.userEnum.Role.PASSENGER);
                        user.setRoles(currentRoles);
                    }
                    userRepository.save(user);
                    return newProfile;
                });

        RideRequest request = RideRequest.builder()
                .passengerProfileId(profile.getId())
                .departureLocation(dto.getDepartureLocation())
                .destinationLocation(dto.getDestinationLocation())
                .departureTime(dto.getDepartureTime())
                .requestedSeats(dto.getRequestedSeats())
                .proposedPrice(dto.getProposedPrice())
                .status(RideRequestStatus.PENDING)
                .build();

        RideRequest saved = rideRequestRepository.save(request);
        // Award engagement points for submitting a ride request
        engagementService.awardRideRequestPoints(profile.getId());
        return rideRequestMapper.toResponseDTO(saved);
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
                .findByStatusAndDepartureTimeAfter(RideRequestStatus.PENDING, LocalDateTime.now()).stream()
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

        Vehicle vehicle = vehicleRepository.findById(new ObjectId(vehicleId))
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

        request.setStatus(RideRequestStatus.ACCEPTED);
        request.setDriverProfileId(driverProfile.getId());
        request.setRideId(ride.getId());
        final RideRequest saved = rideRequestRepository.save(request);

        // Notify passenger
        passengerProfileRepository.findById(saved.getPassengerProfileId())
                .ifPresent(pp -> userRepository.findById(pp.getUserId())
                        .ifPresent(passengerUser -> notificationService.sendNotification(passengerUser,
                                "Ride Request Accepted! 🚗",
                                "A driver has accepted your request from " + saved.getDepartureLocation()
                                        + " to " + saved.getDestinationLocation() + ". Your booking is confirmed.",
                                NotificationType.RIDE_UPDATE, saved.getId().toHexString())));

        notificationService.notifyAllAdmins("Ride Request Accepted 🚗",
                "Driver " + user.getFirstName() + " " + user.getLastName()
                        + " accepted a ride request from " + saved.getDepartureLocation()
                        + " to " + saved.getDestinationLocation() + ".",
                NotificationType.RIDE_UPDATE, saved.getId().toHexString());

        // ── ML incremental learning: ACCEPT outcome ───────────────────────────
        try {
            PassengerProfile passengerProfile = passengerProfileRepository
                    .findById(saved.getPassengerProfileId()).orElse(null);
            float passengerRating = passengerProfile != null
                    && passengerProfile.getAverageRating() != null
                    ? passengerProfile.getAverageRating() : 3.5f;

            PredictiveAiService.CarpoolingFeedback feedback = PredictiveAiService.CarpoolingFeedback.builder()
                    .passenger_rating(passengerRating)
                    .ride_distance_km(15.0)
                    .pickup_distance_km(2.0)
                    .fare_offered(saved.getProposedPrice() != null ? saved.getProposedPrice() : 10.0f)
                    .requested_seats(saved.getRequestedSeats() != null ? saved.getRequestedSeats() : 1)
                    .available_seats(4)
                    .time_of_day(getTimeOfDay(saved.getDepartureTime()))
                    .is_weekend(isWeekend(saved.getDepartureTime()) ? 1 : 0)
                    .has_luggage(0)
                    .has_pets(0)
                    .passenger_gender("MALE")
                    .driver_gender("MALE")
                    .driver_decision("ACCEPT")
                    .build();
            predictiveAiService.sendCarpoolingFeedback(feedback);
        } catch (Exception e) {
            log.warn("Carpooling ML feedback (accept) failed: {}", e.getMessage());
        }

        return rideRequestMapper.toResponseDTO(saved);
    }

    @Override
    public void cancelRequest(String requestId, String passengerEmail) {
        RideRequest request = rideRequestRepository.findById(new ObjectId(requestId))
                .orElseThrow(() -> new IllegalArgumentException("Ride request not found"));

        if (passengerEmail != null) {
            User user = userRepository.findByEmail(passengerEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            PassengerProfile profile = passengerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
            if (!request.getPassengerProfileId().equals(profile.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Only the owner can cancel this request");
            }
        }

        if (request.getStatus() == RideRequestStatus.CANCELLED) {
            throw new IllegalStateException("Request is already cancelled");
        }

        if (request.getStatus() == RideRequestStatus.ACCEPTED && request.getRideId() != null) {
            bookingRepository.findByRideId(request.getRideId()).stream()
                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED && b.getStatus() != BookingStatus.COMPLETED)
                    .forEach(b -> {
                        b.setStatus(BookingStatus.CANCELLED);
                        b.setCancelledAt(LocalDateTime.now());
                        bookingRepository.save(b);
                        rideRepository.findById(request.getRideId()).ifPresent(ride -> {
                            ride.setAvailableSeats(ride.getAvailableSeats() + b.getNumberOfSeats());
                            rideRepository.save(ride);
                        });
                    });
        }

        request.setStatus(RideRequestStatus.CANCELLED);
        rideRequestRepository.save(request);

        // ── ML incremental learning: REJECT outcome when driver never accepted ─
        // Only send feedback if the request was PENDING (never accepted = implicit reject)
        if (request.getDriverProfileId() == null) {
            try {
                PredictiveAiService.CarpoolingFeedback feedback = PredictiveAiService.CarpoolingFeedback.builder()
                        .passenger_rating(3.5)
                        .ride_distance_km(15.0)
                        .pickup_distance_km(2.0)
                        .fare_offered(request.getProposedPrice() != null ? request.getProposedPrice() : 10.0f)
                        .requested_seats(request.getRequestedSeats() != null ? request.getRequestedSeats() : 1)
                        .available_seats(4)
                        .time_of_day(getTimeOfDay(request.getDepartureTime()))
                        .is_weekend(isWeekend(request.getDepartureTime()) ? 1 : 0)
                        .has_luggage(0)
                        .has_pets(0)
                        .passenger_gender("MALE")
                        .driver_gender("MALE")
                        .driver_decision("REJECT")
                        .build();
                predictiveAiService.sendCarpoolingFeedback(feedback);
            } catch (Exception e) {
                log.warn("Carpooling ML feedback (cancel) failed: {}", e.getMessage());
            }
        }
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

        passengerProfileRepository.findById(saved.getPassengerProfileId())
                .ifPresent(profile -> userRepository.findById(profile.getUserId())
                        .ifPresent(passengerUser -> notificationService.sendNotification(passengerUser,
                                "Counter Offer Received 💬",
                                "A driver proposed " + price + " TND for your ride from "
                                        + saved.getDepartureLocation() + " to " + saved.getDestinationLocation()
                                        + (note != null && !note.isBlank() ? ". Note: " + note : ""),
                                NotificationType.RIDE_UPDATE, saved.getId().toHexString())));

        return rideRequestMapper.toResponseDTO(saved);
    }

    @Override
    public RideRequestResponseDTO predictAcceptance(PassengerRideRequestCreationDTO dto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        PassengerProfile profile = passengerProfileRepository.findByUserId(user.getId()).orElse(null);

        // Estimate distance from city names (Tunisian city lookup table)
        double rideDistanceKm   = estimateDistanceKm(dto.getDepartureLocation(), dto.getDestinationLocation());
        double pickupDistanceKm = estimatePickupKm(dto.getDepartureLocation());

        // Prepare request for ML service
        PredictiveAiService.CarpoolingAiRequest aiRequest = PredictiveAiService.CarpoolingAiRequest.builder()
                .passenger_rating(profile != null && profile.getAverageRating() != null ? profile.getAverageRating() : 4.0)
                .ride_distance_km(rideDistanceKm)
                .pickup_distance_km(pickupDistanceKm)
                .fare_offered(dto.getProposedPrice() != null ? dto.getProposedPrice() : 0.0)
                .requested_seats(dto.getRequestedSeats())
                .available_seats(4)
                .time_of_day(getTimeOfDay(dto.getDepartureTime()))
                .is_weekend(isWeekend(dto.getDepartureTime()) ? 1 : 0)
                .has_luggage(0)
                .has_pets(0)
                .passenger_gender("MALE")
                .driver_gender("MALE")
                .build();

        log.info("Predict: {} → {} | dist={} km | pickup={} km | fare={} TND | seats={}",
                dto.getDepartureLocation(), dto.getDestinationLocation(),
                rideDistanceKm, pickupDistanceKm,
                dto.getProposedPrice(), dto.getRequestedSeats());

        RideRequestResponseDTO response = RideRequestResponseDTO.builder()
                .departureLocation(dto.getDepartureLocation())
                .destinationLocation(dto.getDestinationLocation())
                .departureTime(dto.getDepartureTime())
                .requestedSeats(dto.getRequestedSeats())
                .proposedPrice(dto.getProposedPrice())
                .status(RideRequestStatus.PENDING)
                .build();

        try {
            PredictiveAiService.CarpoolingAiResponse aiResponse = predictiveAiService.predictCarpooling(aiRequest).block();
            if (aiResponse != null) {
                log.info("AI probability: {}", aiResponse.getAccept_probability());
                response.setAiAcceptanceProbability(aiResponse.getAccept_probability());
                response.setAiExplanation(aiResponse.getExplanation());
            } else {
                response.setAiExplanation(java.util.List.of("AI service returned no insights."));
            }
        } catch (Exception e) {
            log.error("AI Prediction failed: {}", e.getMessage());
            response.setAiExplanation(java.util.List.of("AI service temporarily unavailable."));
        }

        return response;
    }

    /**
     * Estimate ride distance in km from city name keywords.
     * Uses a lookup table of common Tunisian city pairs.
     * Falls back to 50 km if neither city is recognised.
     */
    private double estimateDistanceKm(String from, String to) {
        if (from == null || to == null) return 50.0;
        String f = from.toLowerCase();
        String t = to.toLowerCase();

        // Symmetric lookup: check both directions
        double d = lookupDistance(f, t);
        if (d < 0) d = lookupDistance(t, f);
        return d > 0 ? d : 50.0;
    }

    private double lookupDistance(String f, String t) {
        // Tunis ↔ others
        if (contains(f, "tunis") && contains(t, "ariana"))      return 12;
        if (contains(f, "tunis") && contains(t, "ben arous"))   return 15;
        if (contains(f, "tunis") && contains(t, "marsa"))       return 20;
        if (contains(f, "tunis") && contains(t, "sousse"))      return 140;
        if (contains(f, "tunis") && contains(t, "sfax"))        return 270;
        if (contains(f, "tunis") && contains(t, "nabeul"))      return 80;
        if (contains(f, "tunis") && contains(t, "bizerte"))     return 65;
        if (contains(f, "tunis") && contains(t, "zaghouan"))    return 55;
        if (contains(f, "tunis") && contains(t, "hammamet"))    return 65;
        if (contains(f, "tunis") && contains(t, "monastir"))    return 160;
        if (contains(f, "tunis") && contains(t, "mahdia"))      return 200;
        if (contains(f, "tunis") && contains(t, "kairouan"))    return 155;
        if (contains(f, "tunis") && contains(t, "gafsa"))       return 340;
        if (contains(f, "tunis") && contains(t, "gabes"))       return 400;
        if (contains(f, "tunis") && contains(t, "djerba"))      return 500;
        if (contains(f, "tunis") && contains(t, "jendouba"))    return 155;
        if (contains(f, "tunis") && contains(t, "beja"))        return 105;
        if (contains(f, "tunis") && contains(t, "siliana"))     return 130;
        if (contains(f, "tunis") && contains(t, "kef"))         return 175;
        if (contains(f, "tunis") && contains(t, "kasserine"))   return 250;
        if (contains(f, "tunis") && contains(t, "manouba"))     return 12;
        // Sousse ↔ others
        if (contains(f, "sousse") && contains(t, "monastir"))   return 20;
        if (contains(f, "sousse") && contains(t, "sfax"))       return 130;
        if (contains(f, "sousse") && contains(t, "kairouan"))   return 55;
        if (contains(f, "sousse") && contains(t, "hammamet"))   return 75;
        if (contains(f, "sousse") && contains(t, "mahdia"))     return 60;
        // Sfax ↔ others
        if (contains(f, "sfax") && contains(t, "gabes"))        return 130;
        if (contains(f, "sfax") && contains(t, "gafsa"))        return 130;
        if (contains(f, "sfax") && contains(t, "mahdia"))       return 70;
        if (contains(f, "sfax") && contains(t, "kairouan"))     return 130;
        // Gabes ↔ others
        if (contains(f, "gabes") && contains(t, "djerba"))      return 75;
        if (contains(f, "gabes") && contains(t, "gafsa"))       return 120;
        if (contains(f, "gabes") && contains(t, "medenine"))    return 75;
        if (contains(f, "gabes") && contains(t, "tataouine"))   return 170;
        // Nabeul / Hammamet
        if (contains(f, "nabeul") && contains(t, "hammamet"))   return 12;
        if (contains(f, "nabeul") && contains(t, "sousse"))     return 90;
        // Ariana / Ben Arous / Manouba (Tunis suburbs — short)
        if (contains(f, "ariana") && contains(t, "marsa"))      return 10;
        if (contains(f, "ariana") && contains(t, "sousse"))     return 145;
        if (contains(f, "manouba") && contains(t, "bizerte"))   return 70;
        // Same city / suburb
        if (f.equals(t))                                         return 5;
        return -1; // unknown
    }

    private boolean contains(String haystack, String needle) {
        return haystack.contains(needle);
    }

    /**
     * Estimate pickup detour based on city size.
     * Larger cities = larger average pickup distance.
     */
    private double estimatePickupKm(String city) {
        if (city == null) return 2.5;
        String c = city.toLowerCase();
        if (contains(c, "tunis") || contains(c, "sfax") || contains(c, "sousse")) return 3.5;
        if (contains(c, "ariana") || contains(c, "ben arous") || contains(c, "manouba")) return 2.0;
        if (contains(c, "nabeul") || contains(c, "bizerte") || contains(c, "monastir")) return 2.5;
        return 2.0; // small city default
    }

    private String getTimeOfDay(LocalDateTime dt) {
        int hour = dt.getHour();
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >= 17 && hour < 21) return "evening";
        return "night";
    }

    private boolean isWeekend(LocalDateTime dt) {
        DayOfWeek dw = dt.getDayOfWeek();
        return dw == DayOfWeek.SATURDAY || dw == DayOfWeek.SUNDAY;
    }
}
