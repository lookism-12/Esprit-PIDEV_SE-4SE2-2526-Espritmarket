package esprit_market.controller.carpoolingController;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.dto.carpooling.BookingRequestDTO;
import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.carpoolingService.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking Management", description = "APIs for managing ride bookings")
public class BookingController {

        private final BookingService bookingService;
        private final PassengerProfileRepository passengerProfileRepository;
        private final UserRepository userRepository;

        @PostMapping
        @Operation(summary = "Create a booking", description = "Creates a new booking for a ride")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Booking created successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data or passenger profile not found"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - passenger role required")
        })
        public BookingResponseDTO create(@Valid @RequestBody BookingRequestDTO dto,
                        @AuthenticationPrincipal UserDetails user) {
                var u = userRepository.findByEmail(user.getUsername()).orElseThrow();
                var passengerProfile = passengerProfileRepository.findByUserId(u.getId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Passenger profile not found. Register as passenger first."));
                return bookingService.createBooking(dto, user.getUsername(), passengerProfile.getId());
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get booking by ID", description = "Retrieves a booking by its ID")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Booking found"),
                        @ApiResponse(responseCode = "404", description = "Booking not found")
        })
        public BookingResponseDTO getById(@PathVariable String id) {
                Booking booking = bookingService.findById(new ObjectId(id));
                if (booking == null)
                        throw new IllegalArgumentException("Booking not found");
                return bookingService.toResponseDTO(booking);
        }

        @GetMapping("/ride/{rideId}")
        @Operation(summary = "Get bookings by ride", description = "Retrieves all bookings for a specific ride")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Bookings retrieved successfully")
        })
        public List<BookingResponseDTO> getByRideId(@PathVariable String rideId) {
                return bookingService.findByRideId(new ObjectId(rideId)).stream()
                                .map(bookingService::toResponseDTO).toList();
        }

        @GetMapping("/passenger/{passengerUserId}")
        @Operation(summary = "Get bookings by passenger", description = "Retrieves all bookings for a specific passenger")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Bookings retrieved successfully")
        })
        public List<BookingResponseDTO> getByPassengerUserId(@PathVariable String passengerUserId) {
                var passengerProfile = passengerProfileRepository.findByUserId(new ObjectId(passengerUserId))
                                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
                return bookingService.findByPassengerProfileId(passengerProfile.getId()).stream()
                                .map(bookingService::toResponseDTO).toList();
        }

        @GetMapping("/my")
        @Operation(summary = "Get my bookings", description = "Returns all bookings of the authenticated passenger")
        public List<BookingResponseDTO> getMyBookings(@AuthenticationPrincipal UserDetails user) {
                var u = userRepository.findByEmail(user.getUsername()).orElseThrow();
                var passengerProfile = passengerProfileRepository.findByUserId(u.getId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Passenger profile not found. Register as passenger first."));
                return bookingService.findByPassengerProfileId(passengerProfile.getId()).stream()
                                .map(bookingService::toResponseDTO).toList();
        }

        @GetMapping
        @Operation(summary = "Get bookings by status", description = "Retrieves bookings filtered by status")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Bookings retrieved successfully")
        })
        public List<BookingResponseDTO> getByStatus(
                        @Parameter(description = "Booking status filter") @RequestParam(required = false) BookingStatus status) {
                if (status == null) {
                        checkIsAdmin();
                        return bookingService.findAll().stream()
                                        .map(bookingService::toResponseDTO).toList();
                }
                return bookingService.findByStatus(status).stream()
                                .map(bookingService::toResponseDTO).toList();
        }

        private void checkIsAdmin() {
                var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext()
                                .getAuthentication();
                if (authentication == null || authentication.getAuthorities().stream()
                                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "Only ADMIN can list all bookings without filter");
                }
        }

        @PatchMapping("/{id}")
        @Operation(summary = "Update booking", description = "Updates an existing booking")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Booking updated successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data"),
                        @ApiResponse(responseCode = "404", description = "Booking not found")
        })
        public BookingResponseDTO update(@PathVariable String id,
                        @Valid @RequestBody BookingRequestDTO dto,
                        @AuthenticationPrincipal UserDetails user) {
                var u = userRepository.findByEmail(user.getUsername()).orElseThrow();
                var passengerProfile = passengerProfileRepository.findByUserId(u.getId())
                                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));

                Booking booking = new Booking();
                booking.setNumberOfSeats(dto.getNumberOfSeats());
                booking.setPickupLocation(dto.getPickupLocation());
                booking.setDropoffLocation(dto.getDropoffLocation());

                Booking updated = bookingService.update(new ObjectId(id), booking, passengerProfile.getId());
                return bookingService.toResponseDTO(updated);
        }

        @PatchMapping("/{id}/status")
        @Operation(summary = "Update booking status", description = "Updates the status of a booking")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Booking status updated successfully"),
                        @ApiResponse(responseCode = "404", description = "Booking not found")
        })
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
        public BookingResponseDTO updateStatus(@PathVariable String id,
                        @Parameter(description = "New booking status") @RequestParam BookingStatus status) {
                Booking updated = bookingService.updateStatus(new ObjectId(id), status);
                return bookingService.toResponseDTO(updated);
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Cancel booking", description = "Cancels a booking")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Booking cancelled successfully"),
                        @ApiResponse(responseCode = "400", description = "Passenger profile not found"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - only booking owner can cancel"),
                        @ApiResponse(responseCode = "404", description = "Booking not found")
        })
        public void delete(@PathVariable String id, @AuthenticationPrincipal UserDetails user) {
                var u = userRepository.findByEmail(user.getUsername()).orElseThrow();
                var passengerProfile = passengerProfileRepository.findByUserId(u.getId())
                                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
                bookingService.cancelBooking(id, user.getUsername(), passengerProfile.getId());
        }
}
