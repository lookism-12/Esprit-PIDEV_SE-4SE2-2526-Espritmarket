package esprit_market.service.carpoolingService;

import esprit_market.dto.ActivityDTO;
import esprit_market.dto.DashboardDTO;
import esprit_market.dto.carpooling.*;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RideReviewRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService implements IDashboardService {

    private final IDriverProfileService driverProfileService;
    private final IRideService rideService;
    private final IBookingService bookingService;
    private final IVehicleService vehicleService;
    private final RideReviewRepository rideReviewRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;

    @Override
    public DashboardDTO getDriverDashboard(ObjectId driverId) {
        DriverProfileResponseDTO driverDTO = driverProfileService.findByUserId(driverId);
        if (driverDTO == null) throw new RuntimeException("Driver profile not found");

        List<RideResponseDTO> allRides = rideService.findByDriverProfileId(new ObjectId(driverDTO.getId()));

        List<RideResponseDTO> scheduledRides = allRides.stream()
                .filter(r -> "CONFIRMED".equals(r.getStatus().toString()) || "ACCEPTED".equals(r.getStatus().toString()))
                .limit(5).collect(Collectors.toList());

        Double earningsThisMonth = calculateMonthlyEarnings(allRides);
        List<DashboardBookingResponseDTO> pendingBookings = getPendingBookingsByRides(allRides);
        DashboardVehicleResponseDTO currentVehicle = getCurrentVehicle(new ObjectId(driverDTO.getId()));
        List<ActivityDTO> recentActivities = getRecentActivitiesByRides(allRides, 5);
        List<Double> earningsHistory = getEarningsHistoryByRides(allRides);
        List<String> earningsLabels = getMonthLabels();
        List<ReviewResponseDTO> recentReviews = getRecentReviews(new ObjectId(driverDTO.getId()));

        Double totalBalance = allRides.stream()
                .filter(r -> "COMPLETED".equals(r.getStatus().toString()))
                .mapToDouble(r -> r.getPricePerSeat() * (4 - r.getAvailableSeats()))
                .sum();

        Integer activeRidesCount = (int) allRides.stream()
                .filter(r -> "ACCEPTED".equals(r.getStatus().toString()) || "ON_ROUTE".equals(r.getStatus().toString()))
                .count();

        return DashboardDTO.builder()
                .completedRides(driverDTO.getTotalRidesCompleted() != null ? driverDTO.getTotalRidesCompleted() : 0)
                .averageRating(driverDTO.getAverageRating() != null ? driverDTO.getAverageRating() : 0f)
                .earningsThisMonth(earningsThisMonth)
                .activeRides(activeRidesCount)
                .totalEarnings(driverDTO.getTotalEarnings() != null ? driverDTO.getTotalEarnings().doubleValue() : 0.0)
                .scheduledRides(convertToRideDTOs(scheduledRides))
                .pendingBookings(pendingBookings)
                .currentVehicle(currentVehicle)
                .recentActivities(recentActivities)
                .earningsHistory(earningsHistory)
                .earningsLabels(earningsLabels)
                .recentReviews(recentReviews)
                .totalBalance(totalBalance)
                .driverName(driverDTO.getFullName() != null ? driverDTO.getFullName() : "Driver")
                .isVerified(driverDTO.getIsVerified() != null ? driverDTO.getIsVerified() : false)
                .build();
    }

    @Override
    public List<Double> getEarningsHistory(ObjectId driverId) {
        DriverProfileResponseDTO driverDTO = driverProfileService.findByUserId(driverId);
        if (driverDTO == null) return new ArrayList<>();
        return getEarningsHistoryByRides(rideService.findByDriverProfileId(new ObjectId(driverDTO.getId())));
    }

    @Override
    public List<DashboardBookingResponseDTO> getPendingBookings(ObjectId driverId) {
        DriverProfileResponseDTO driverDTO = driverProfileService.findByUserId(driverId);
        if (driverDTO == null) return new ArrayList<>();
        return getPendingBookingsByRides(rideService.findByDriverProfileId(new ObjectId(driverDTO.getId())));
    }

    @Override
    public List<ActivityDTO> getRecentActivities(ObjectId driverId, Integer limit) {
        DriverProfileResponseDTO driverDTO = driverProfileService.findByUserId(driverId);
        if (driverDTO == null) return new ArrayList<>();
        return getRecentActivitiesByRides(rideService.findByDriverProfileId(new ObjectId(driverDTO.getId())), limit);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private List<DashboardBookingResponseDTO> getPendingBookingsByRides(List<RideResponseDTO> rides) {
        List<DashboardBookingResponseDTO> result = new ArrayList<>();
        for (RideResponseDTO ride : rides) {
            try {
                bookingService.findByRideId(new ObjectId(ride.getRideId())).stream()
                        .filter(b -> "PENDING".equals(b.getStatus().toString()))
                        .forEach(b -> result.add(DashboardBookingResponseDTO.builder()
                                .bookingId(b.getBookingId())
                                .rideId(ride.getRideId())
                                .passengerName(b.getPassengerName())
                                .seatsRequested(b.getNumberOfSeats())
                                .status(b.getStatus().toString())
                                .build()));
            } catch (Exception ignored) {}
        }
        return result;
    }

    private List<ActivityDTO> getRecentActivitiesByRides(List<RideResponseDTO> rides, Integer limit) {
        List<ActivityDTO> activities = new ArrayList<>();
        for (RideResponseDTO ride : rides) {
            try {
                bookingService.findByRideId(new ObjectId(ride.getRideId())).forEach(b ->
                        activities.add(ActivityDTO.builder()
                                .type("BOOKING_" + b.getStatus())
                                .passengerName(b.getPassengerName())
                                .message("Booking for " + b.getPassengerName() + " is " + b.getStatus().toString().toLowerCase())
                                .timestamp(System.currentTimeMillis())
                                .status(b.getStatus().toString())
                                .build()));
            } catch (Exception ignored) {}
        }
        return activities.stream()
                .sorted((a, b) -> Long.compare(b.getTimestamp(), a.getTimestamp()))
                .limit(limit).collect(Collectors.toList());
    }

    private Double calculateMonthlyEarnings(List<RideResponseDTO> rides) {
        return calculateMonthlyEarningsForMonth(rides, YearMonth.now());
    }

    private Double calculateMonthlyEarningsForMonth(List<RideResponseDTO> rides, YearMonth month) {
        try {
            return rides.stream()
                    .filter(r -> isInMonth(r.getDepartureTime(), month))
                    .filter(r -> "COMPLETED".equals(r.getStatus().toString()))
                    .mapToDouble(r -> r.getPricePerSeat() * getConfirmedBookingsCount(r.getRideId()))
                    .sum();
        } catch (Exception e) { return 0.0; }
    }

    private long getConfirmedBookingsCount(String rideId) {
        try {
            return bookingService.findByRideId(new ObjectId(rideId)).stream()
                    .filter(b -> "CONFIRMED".equals(b.getStatus().toString())).count();
        } catch (Exception e) { return 0L; }
    }

    private List<Double> getEarningsHistoryByRides(List<RideResponseDTO> rides) {
        List<Double> earnings = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            earnings.add(calculateMonthlyEarningsForMonth(rides, YearMonth.now().minusMonths(i)));
        }
        return earnings;
    }

    private List<String> getMonthLabels() {
        List<String> labels = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth m = YearMonth.now().minusMonths(i);
            labels.add(m.getMonth().toString().substring(0, 3) + " " + m.getYear());
        }
        return labels;
    }

    private boolean isInMonth(LocalDateTime dt, YearMonth month) {
        return YearMonth.from(dt).equals(month);
    }

    private DashboardVehicleResponseDTO getCurrentVehicle(ObjectId driverProfileId) {
        try {
            List<VehicleResponseDTO> vehicles = vehicleService.findByDriverProfileId(driverProfileId);
            if (vehicles.isEmpty()) return null;
            VehicleResponseDTO v = vehicles.get(0);
            return DashboardVehicleResponseDTO.builder()
                    .vehicleId(v.getId()).registrationNumber(v.getLicensePlate())
                    .make(v.getMake()).model(v.getModel())
                    .seatingCapacity(v.getNumberOfSeats()).isActive(true).build();
        } catch (Exception e) { return null; }
    }

    private List<DashboardRideResponseDTO> convertToRideDTOs(List<RideResponseDTO> rides) {
        return rides.stream().map(r -> DashboardRideResponseDTO.builder()
                .rideId(r.getRideId()).departureLocation(r.getDepartureLocation())
                .destinationLocation(r.getDestinationLocation())
                .departureTime(r.getDepartureTime().toString())
                .availableSeats(r.getAvailableSeats())
                .pricePerSeat(r.getPricePerSeat() != null ? r.getPricePerSeat().doubleValue() : 0.0)
                .status(r.getStatus().toString()).build())
                .collect(Collectors.toList());
    }

    private List<ReviewResponseDTO> getRecentReviews(ObjectId driverProfileId) {
        try {
            return rideReviewRepository.findByRevieweeId(driverProfileId).stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .limit(5)
                    .map(review -> {
                        String passengerName = "Anonymous";
                        try {
                            var pp = passengerProfileRepository.findById(review.getReviewerId()).orElse(null);
                            if (pp != null) {
                                var u = userRepository.findById(pp.getUserId()).orElse(null);
                                if (u != null) passengerName = u.getFirstName() + " " + u.getLastName();
                            }
                        } catch (Exception ignored) {}
                        return ReviewResponseDTO.builder()
                                .id(review.getId().toHexString())
                                .reviewerName(passengerName)
                                .rating(review.getRating())
                                .comment(review.getComment())
                                .createdAt(review.getCreatedAt())
                                .build();
                    }).collect(Collectors.toList());
        } catch (Exception e) { return new ArrayList<>(); }
    }
}
