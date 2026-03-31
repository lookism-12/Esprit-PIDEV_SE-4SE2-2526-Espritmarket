package esprit_market.dto.carpooling;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Booking Response DTO
 * Used for GET /api/bookings endpoints
 * Transfers seat reservation data with denormalized passenger info
 * 
 * Backend -> Frontend: Booking entity + User info (denormalized)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDTO {

    // ==================== Identity ====================
    /** MongoDB ObjectId (string representation) */
    private String bookingId;
    private String rideId;               // Reference to Ride
    
    // ==================== Passenger Info ====================
    private String passengerProfileId;   // Reference to PassengerProfile
    private String passengerName;        // firstName + lastName (denormalized)
    
    // ==================== Booking Details ====================
    private Integer numberOfSeats;      // Seats reserved
    private String pickupLocation;      // Where to pick up passenger
    private String dropoffLocation;     // Where to drop off passenger
    
    // ==================== Status & Pricing ====================
    private BookingStatus status;       // PENDING | CONFIRMED | CANCELLED | COMPLETED
    private Float totalPrice;           // numberOfSeats × ride.pricePerSeat
    
    // ==================== Timestamps ====================
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;  // When cancelled (if cancelled)
}
