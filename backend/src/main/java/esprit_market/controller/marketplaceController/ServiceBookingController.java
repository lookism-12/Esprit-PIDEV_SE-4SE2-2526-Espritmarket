package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ServiceBookingRequestDTO;
import esprit_market.dto.marketplace.ServiceBookingResponseDTO;
import esprit_market.dto.marketplace.TimeSlotDTO;
import esprit_market.service.marketplaceService.ServiceBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/service-bookings")
@RequiredArgsConstructor
@Tag(name = "Service Booking", description = "Service booking and appointment management")
@CrossOrigin(origins = "*")
public class ServiceBookingController {
    
    private final ServiceBookingService bookingService;
    
    /**
     * Get available time slots for a service on a specific date
     */
    @GetMapping("/services/{serviceId}/available-slots")
    @Operation(summary = "Get available time slots", 
               description = "Get all available time slots for a service on a specific date")
    public ResponseEntity<List<TimeSlotDTO>> getAvailableTimeSlots(
            @PathVariable String serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        ObjectId id = new ObjectId(serviceId);
        List<TimeSlotDTO> slots = bookingService.getAvailableTimeSlots(id, date);
        return ResponseEntity.ok(slots);
    }
    
    /**
     * Create a new booking
     */
    @PostMapping
    @Operation(summary = "Create booking", 
               description = "Create a new service booking")
    public ResponseEntity<ServiceBookingResponseDTO> createBooking(
            @RequestBody ServiceBookingRequestDTO dto) {
        
        ServiceBookingResponseDTO response = bookingService.createBooking(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get all bookings for current user
     */
    @GetMapping("/my-bookings")
    @Operation(summary = "Get my bookings", 
               description = "Get all bookings for the authenticated user")
    public ResponseEntity<List<ServiceBookingResponseDTO>> getMyBookings() {
        List<ServiceBookingResponseDTO> bookings = bookingService.getMyBookings();
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * Get all bookings for a service
     */
    @GetMapping("/services/{serviceId}")
    @Operation(summary = "Get service bookings", 
               description = "Get all bookings for a specific service")
    public ResponseEntity<List<ServiceBookingResponseDTO>> getServiceBookings(
            @PathVariable String serviceId) {
        
        ObjectId id = new ObjectId(serviceId);
        List<ServiceBookingResponseDTO> bookings = bookingService.getServiceBookings(id);
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * Cancel a booking
     */
    @DeleteMapping("/{bookingId}")
    @Operation(summary = "Cancel booking", 
               description = "Cancel an existing booking")
    public ResponseEntity<ServiceBookingResponseDTO> cancelBooking(
            @PathVariable String bookingId,
            @RequestBody(required = false) Map<String, String> body) {
        
        ObjectId id = new ObjectId(bookingId);
        String reason = body != null ? body.get("reason") : null;
        ServiceBookingResponseDTO response = bookingService.cancelBooking(id, reason);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Approve a booking (provider only)
     */
    @PostMapping("/{bookingId}/approve")
    @Operation(summary = "Approve booking", 
               description = "Approve a pending booking (provider only)")
    public ResponseEntity<ServiceBookingResponseDTO> approveBooking(
            @PathVariable String bookingId) {
        
        ObjectId id = new ObjectId(bookingId);
        ServiceBookingResponseDTO response = bookingService.approveBooking(id);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Reject a booking (provider only)
     */
    @PostMapping("/{bookingId}/reject")
    @Operation(summary = "Reject booking", 
               description = "Reject a pending booking with reason (provider only)")
    public ResponseEntity<ServiceBookingResponseDTO> rejectBooking(
            @PathVariable String bookingId,
            @RequestBody Map<String, String> body) {
        
        ObjectId id = new ObjectId(bookingId);
        String reason = body.get("reason");
        
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        ServiceBookingResponseDTO response = bookingService.rejectBooking(id, reason);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get pending bookings for provider
     */
    @GetMapping("/pending")
    @Operation(summary = "Get pending bookings", 
               description = "Get all pending bookings for provider's services")
    public ResponseEntity<List<ServiceBookingResponseDTO>> getPendingBookings() {
        List<ServiceBookingResponseDTO> bookings = bookingService.getPendingBookingsForProvider();
        return ResponseEntity.ok(bookings);
    }
}
