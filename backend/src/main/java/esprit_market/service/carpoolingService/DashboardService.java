package esprit_market.service.carpoolingService;

import esprit_market.dto.DashboardDTO;
import esprit_market.dto.ActivityDTO;
import esprit_market.dto.carpooling.*;
import esprit_market.repository.carpoolingRepository.RideReviewRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.dto.carpooling.ReviewResponseDTO;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService implements IDashboardService {

    @Autowired
    private IDriverProfileService driverProfileService;

    @Autowired
    private IRideService rideService;

    @Autowired
    private IBookingService bookingService;

    @Autowired
    private IVehicleService vehicleService;

    @Autowired
    private RideReviewRepository rideReviewRepository;

    @Autowired
    private PassengerProfileRepository passengerProfileRepository;

    @Autowired
    private esprit_market.repository.userRepository.UserRepository userRepository;

    @Override
    public DashboardDTO getDriverDashboard(ObjectId driverId) {
        try {
            // Get driver profile
            DriverProfileResponseDTO driverDTO = driverProfileService.findByUserId(driverId);
            if (driverDTO == null) {
                throw new RuntimeException("Driver profile not found");
            }

            // Get driver's rides
            List<RideResponseDTO> allRidesDTO = rideService.findByDriverProfileId(new ObjectId(driverDTO.getId()));

            // Separate scheduled and completed rides
            List<RideResponseDTO> scheduledRides = allRidesDTO.stream()
                    .filter(r -> "CONFIRMED".equals(r.getStatus().toString())
                            || "ACTIVE".equals(r.getStatus().toString()))
                    .limit(5)
                    .collect(Collectors.toList());

            // Calculate this month's earnings
            Double earningsThisMonth = calculateMonthlyEarnings(allRidesDTO);

            // Get pending booking requests
            List<DashboardBookingResponseDTO> pendingBookings = getPendingBookingsByRides(allRidesDTO);

            // Get current vehicle
            DashboardVehicleResponseDTO currentVehicle = getCurrentVehicleByDriverId(new ObjectId(driverDTO.getId()));

            // Get recent activities
            List<ActivityDTO> recentActivities = getRecentActivitiesByRides(allRidesDTO, 5);

            // Get earnings history
            List<Double> earningsHistory = getEarningsHistory(allRidesDTO);
            List<String> earningsLabels = getMonthLabels();

            // Get recent reviews
            List<ReviewResponseDTO> recentReviews = getRecentReviewsByDriverId(new ObjectId(driverDTO.getId()));

            // Calculate Total Balance
            Double totalBalance = allRidesDTO.stream()
                    .filter(r -> "COMPLETED".equals(r.getStatus().toString()))
                    .mapToDouble(r -> {
                        // For simplicity, sum of ride price * requested seats in bookings
                        // Or just sum of payments if available
                        return r.getPricePerSeat() * (4 - r.getAvailableSeats());
                    })
                    .sum();

            // Count active rides
            Integer activeRidesCount = (int) allRidesDTO.stream()
                    .filter(r -> "ACTIVE".equals(r.getStatus().toString()))
                    .count();

            return DashboardDTO.builder()
                    .completedRides(driverDTO.getTotalRidesCompleted() != null ? driverDTO.getTotalRidesCompleted() : 0)
                    .averageRating(driverDTO.getAverageRating() != null ? driverDTO.getAverageRating() : 0f)
                    .earningsThisMonth(earningsThisMonth)
                    .activeRides(activeRidesCount)
                    .totalEarnings(driverDTO.getTotalEarnings() != null ? driverDTO.getTotalEarnings() : 0.0)
                    .scheduledRides(convertToRideDTOs(scheduledRides))
                    .pendingBookings(pendingBookings)
                    .currentVehicle(currentVehicle)
                    .recentActivities(recentActivities)
                    .earningsHistory(earningsHistory)
                    .earningsLabels(earningsLabels)
                    .recentReviews(recentReviews)
                    .totalBalance(totalBalance)
                    .driverName(driverDTO.getFullName() != null ? driverDTO.getFullName() : "Elite Driver")
                    .isVerified(driverDTO.getIsVerified() != null ? driverDTO.getIsVerified() : false)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to load dashboard: " + e.getMessage());
        }
    }

    @Override
    public List<Double> getEarningsHistory(ObjectId driverId) {
        // This method needs to be called from dashboard with rides
        return new ArrayList<>();
    }

    private List<Double> getEarningsHistory(List<RideResponseDTO> allRidesDTO) {
        List<Double> earnings = new ArrayList<>();

        // Get last 12 months of earnings
        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            Double monthEarnings = calculateMonthlyEarningsForMonth(allRidesDTO, month);
            earnings.add(monthEarnings);
        }

        return earnings;
    }

    @Override
    public List<DashboardBookingResponseDTO> getPendingBookings(ObjectId driverId) {
        return new ArrayList<>();
    }

    private List<DashboardBookingResponseDTO> getPendingBookingsByRides(List<RideResponseDTO> ridesDTOs) {
        try {
            List<DashboardBookingResponseDTO> allBookings = new ArrayList<>();

            for (RideResponseDTO ride : ridesDTOs) {
                try {
                    ObjectId rideId = new ObjectId(ride.getRideId());
                    List<BookingResponseDTO> bookings = bookingService.findByRideId(rideId);

                    bookings.stream()
                            .filter(b -> "PENDING".equals(b.getStatus().toString()))
                            .forEach(b -> allBookings.add(DashboardBookingResponseDTO.builder()
                                    .bookingId(b.getBookingId())
                                    .rideId(ride.getRideId())
                                    .passengerName(b.getPassengerName())
                                    .seatsRequested(b.getNumberOfSeats())
                                    .status(b.getStatus().toString())
                                    .build()));
                } catch (Exception e) {
                    // Skip this ride if there's an error
                }
            }

            return allBookings;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @Override
    public List<ActivityDTO> getRecentActivities(ObjectId driverId, Integer limit) {
        return new ArrayList<>();
    }

    private List<ActivityDTO> getRecentActivitiesByRides(List<RideResponseDTO> ridesDTOs, Integer limit) {
        try {
            List<ActivityDTO> activities = new ArrayList<>();

            for (RideResponseDTO ride : ridesDTOs) {
                try {
                    ObjectId rideId = new ObjectId(ride.getRideId());
                    List<BookingResponseDTO> bookings = bookingService.findByRideId(rideId);

                    bookings.forEach(booking -> {
                        ActivityDTO activity = ActivityDTO.builder()
                                .type("BOOKING_" + booking.getStatus().toString())
                                .passengerName(booking.getPassengerName())
                                .message("Booking for " + booking.getPassengerName() + " is "
                                        + booking.getStatus().toString().toLowerCase())
                                .timestamp(System.currentTimeMillis())
                                .status(booking.getStatus().toString())
                                .build();
                        activities.add(activity);
                    });
                } catch (Exception e) {
                    // Skip this ride if there's an error
                }
            }

            return activities.stream()
                    .sorted((a, b) -> Long.compare(b.getTimestamp(), a.getTimestamp()))
                    .limit(limit)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // ==================== HELPER METHODS ====================

    private Double calculateMonthlyEarnings(List<RideResponseDTO> allRidesDTO) {
        return calculateMonthlyEarningsForMonth(allRidesDTO, YearMonth.now());
    }

    private Double calculateMonthlyEarningsForMonth(List<RideResponseDTO> allRidesDTO, YearMonth month) {
        try {
            return allRidesDTO.stream()
                    .filter(r -> isInMonth(r.getDepartureTime(), month))
                    .filter(r -> "COMPLETED".equals(r.getStatus().toString()))
                    .mapToDouble(ride -> ride.getPricePerSeat() * getConfirmedBookingsCount(ride.getRideId()))
                    .sum();
        } catch (Exception e) {
            return 0.0;
        }
    }

    private Long getConfirmedBookingsCount(String rideId) {
        try {
            ObjectId rideObjectId = new ObjectId(rideId);
            List<BookingResponseDTO> bookings = bookingService.findByRideId(rideObjectId);
            return bookings.stream()
                    .filter(b -> "CONFIRMED".equals(b.getStatus().toString()))
                    .count();
        } catch (Exception e) {
            return 0L;
        }
    }

    private List<DashboardRideResponseDTO> convertToRideDTOs(List<RideResponseDTO> ridesDTO) {
        return ridesDTO.stream()
                .map(ride -> DashboardRideResponseDTO.builder()
                        .rideId(ride.getRideId())
                        .departureLocation(ride.getDepartureLocation())
                        .destinationLocation(ride.getDestinationLocation())
                        .departureTime(ride.getDepartureTime().toString())
                        .availableSeats(ride.getAvailableSeats())
                        .pricePerSeat(ride.getPricePerSeat() != null ? ride.getPricePerSeat().doubleValue() : 0.0)
                        .status(ride.getStatus().toString())
                        .build())
                .collect(Collectors.toList());
    }

    private DashboardVehicleResponseDTO getCurrentVehicleByDriverId(ObjectId driverProfileId) {
        try {
            List<VehicleResponseDTO> vehiclesDTO = vehicleService.findByDriverProfileId(driverProfileId);
            if (vehiclesDTO.isEmpty())
                return null;

            VehicleResponseDTO vehicle = vehiclesDTO.get(0);
            return DashboardVehicleResponseDTO.builder()
                    .vehicleId(vehicle.getId())
                    .registrationNumber(vehicle.getLicensePlate())
                    .make(vehicle.getMake())
                    .model(vehicle.getModel())
                    .seatingCapacity(vehicle.getNumberOfSeats())
                    .isActive(true)
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> getMonthLabels() {
        List<String> labels = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            labels.add(month.getMonth().toString().substring(0, 3) + " " + month.getYear());
        }
        return labels;
    }

    private boolean isInMonth(LocalDateTime dateTime, YearMonth month) {
        return YearMonth.from(dateTime).equals(month);
    }

    private List<ReviewResponseDTO> getRecentReviewsByDriverId(ObjectId driverProfileId) {
        try {
            return rideReviewRepository.findByRevieweeId(driverProfileId).stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .limit(5)
                    .map(review -> {
                        String passengerName = "Anonymous";
                        try {
                            var passenger = passengerProfileRepository.findById(review.getReviewerId()).orElse(null);
                            if (passenger != null) {
                                var user = userRepository.findById(passenger.getUserId()).orElse(null);
                                if (user != null)
                                    passengerName = user.getFirstName() + " " + user.getLastName();
                            }
                        } catch (Exception e) {
                        }
                        return ReviewResponseDTO.builder()
                                .id(review.getId().toHexString())
                                .passengerName(passengerName)
                                .rating(review.getRating())
                                .comment(review.getComment())
                                .createdAt(review.getCreatedAt())
                                .build();
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
