package esprit_market.service.marketplaceService;

import esprit_market.Enum.marketplaceEnum.BookingStatus;
import esprit_market.Enum.marketplaceEnum.AvailabilityMode;
import esprit_market.Enum.marketplaceEnum.MeetingMode;
import esprit_market.Enum.marketplaceEnum.ServiceStatus;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.marketplace.ServiceBookingRequestDTO;
import esprit_market.dto.marketplace.ServiceBookingResponseDTO;
import esprit_market.dto.marketplace.TimeSlotDTO;
import esprit_market.entity.chat.ChatConversation;
import esprit_market.entity.marketplace.ServiceAvailability;
import esprit_market.entity.marketplace.ServiceBooking;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ServiceBookingRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceBookingService {
    
    private final ServiceBookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    
    /**
     * Generate available time slots for a service on a specific date
     * Based on PROVIDER-DEFINED availability rules
     */
    public List<TimeSlotDTO> getAvailableTimeSlots(ObjectId serviceId, LocalDate date) {
        // Get service
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        
        // Check if date is on a working day
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        ServiceAvailability availability = service.getAvailability();
        
        // Fallback to legacy working hours if no availability rules defined
        if (availability == null || availability.getWorkingDays() == null || availability.getWorkingDays().isEmpty()) {
            System.out.println("⚠️ Using legacy working hours for service " + service.getName());
            return generateSlotsFromLegacyHours(service, date, serviceId);
        }
        
        // Check if this day is in provider's working days
        if (!availability.getWorkingDays().contains(dayOfWeek)) {
            System.out.println("🚫 Date " + date + " is not in provider's working days");
            return new ArrayList<>(); // No slots on non-working days
        }
        
        // Get existing confirmed bookings for this date
        List<ServiceBooking> existingBookings = bookingRepository
                .findByServiceIdAndBookingDateAndStatus(serviceId, date, BookingStatus.CONFIRMED);
        
        // Generate slots from provider's time ranges
        List<TimeSlotDTO> slots = new ArrayList<>();
        int duration = service.getDurationMinutes();
        
        // Check if time ranges are defined
        if (availability.getTimeRanges() == null || availability.getTimeRanges().isEmpty()) {
            System.out.println("⚠️ No time ranges defined, using legacy hours");
            return generateSlotsFromLegacyHours(service, date, serviceId);
        }
        
        for (ServiceAvailability.TimeRange timeRange : availability.getTimeRanges()) {
            LocalTime currentTime = timeRange.getStartTime();
            LocalTime endTime = timeRange.getEndTime();
            
            while (currentTime.plusMinutes(duration).isBefore(endTime) || 
                   currentTime.plusMinutes(duration).equals(endTime)) {
                LocalTime slotStart = currentTime;
                LocalTime slotEnd = currentTime.plusMinutes(duration);
                
                // Check if slot is during a break
                boolean isDuringBreak = false;
                if (availability.getBreaks() != null) {
                    isDuringBreak = availability.getBreaks().stream()
                            .anyMatch(breakTime -> breakTime.overlaps(
                                    ServiceAvailability.TimeRange.builder()
                                            .startTime(slotStart)
                                            .endTime(slotEnd)
                                            .build()));
                }
                
                if (!isDuringBreak) {
                    // Check if slot overlaps with any existing booking
                    boolean isAvailable = !hasOverlap(slotStart, slotEnd, existingBookings);
                    
                    // Create slot DTO
                    TimeSlotDTO slot = TimeSlotDTO.builder()
                            .startTime(slotStart)
                            .endTime(slotEnd)
                            .available(isAvailable)
                            .label(formatTimeRange(slotStart, slotEnd))
                            .availableModes(toMeetingModes(timeRange.getAvailableMode()))
                            .build();
                    
                    slots.add(slot);
                }
                
                currentTime = currentTime.plusMinutes(duration);
            }
        }
        
        System.out.println("✅ Generated " + slots.size() + " slots for " + date + " (" + dayOfWeek + ")");
        return slots;
    }
    
    /**
     * Fallback method for services without availability rules (backward compatibility)
     */
    private List<TimeSlotDTO> generateSlotsFromLegacyHours(ServiceEntity service, LocalDate date, ObjectId serviceId) {
        System.out.println("⚠️ Using legacy working hours for service " + service.getName());
        
        LocalTime workStart = LocalTime.parse(service.getWorkingHoursStart());
        LocalTime workEnd = LocalTime.parse(service.getWorkingHoursEnd());
        int duration = service.getDurationMinutes();
        
        List<ServiceBooking> existingBookings = bookingRepository
                .findByServiceIdAndBookingDateAndStatus(serviceId, date, BookingStatus.CONFIRMED);
        
        List<TimeSlotDTO> slots = new ArrayList<>();
        LocalTime currentTime = workStart;
        
        while (currentTime.plusMinutes(duration).isBefore(workEnd) || 
               currentTime.plusMinutes(duration).equals(workEnd)) {
            LocalTime slotStart = currentTime;
            LocalTime slotEnd = currentTime.plusMinutes(duration);
            
            boolean isAvailable = !hasOverlap(slotStart, slotEnd, existingBookings);
            
            TimeSlotDTO slot = TimeSlotDTO.builder()
                    .startTime(slotStart)
                    .endTime(slotEnd)
                    .available(isAvailable)
                    .label(formatTimeRange(slotStart, slotEnd))
                    .availableModes(List.of(MeetingMode.ONLINE, MeetingMode.IN_PERSON))
                    .build();
            
            slots.add(slot);
            currentTime = currentTime.plusMinutes(duration);
        }
        
        return slots;
    }
    
    /**
     * Check if a time slot overlaps with existing bookings
     */
    private boolean hasOverlap(LocalTime slotStart, LocalTime slotEnd, List<ServiceBooking> bookings) {
        for (ServiceBooking booking : bookings) {
            // Check for any overlap
            if (!(slotEnd.isBefore(booking.getStartTime()) || slotEnd.equals(booking.getStartTime()) ||
                  slotStart.isAfter(booking.getEndTime()) || slotStart.equals(booking.getEndTime()))) {
                return true; // Overlap detected
            }
        }
        return false;
    }
    
    /**
     * Format time range for display
     */
    private String formatTimeRange(LocalTime start, LocalTime end) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        return start.format(formatter) + " - " + end.format(formatter);
    }
    
    /**
     * Create a new booking
     */
    @Transactional
    public ServiceBookingResponseDTO createBooking(ServiceBookingRequestDTO dto) {
        // Get authenticated user
        User user = getCurrentUser();
        
        // Get service
        ObjectId serviceId = new ObjectId(dto.getServiceId());
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        Shop shop = shopRepository.findById(service.getShopId())
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));
        ObjectId requestOwnerId = service.getCreatedByUserId() != null ? service.getCreatedByUserId() : shop.getOwnerId();
        
        // Calculate end time
        LocalTime endTime = dto.getStartTime().plusMinutes(service.getDurationMinutes());

        if (dto.getMeetingMode() == null) {
            throw new IllegalStateException("Meeting mode is required");
        }

        if (!isSlotAllowedForMode(service, dto.getBookingDate(), dto.getStartTime(), endTime, dto.getMeetingMode())) {
            throw new IllegalStateException("Selected meeting mode is not available for this time slot");
        }
        
        // Check for overlaps
        List<ServiceBooking> existingBookings = bookingRepository
                .findByServiceIdAndBookingDateAndStatus(serviceId, dto.getBookingDate(), BookingStatus.CONFIRMED);
        
        if (hasOverlap(dto.getStartTime(), endTime, existingBookings)) {
            throw new IllegalStateException("This time slot is already booked");
        }
        
        // Create booking
        ServiceBooking booking = ServiceBooking.builder()
                .serviceId(serviceId)
                .userId(user.getId())
                .shopId(service.getShopId())
                .providerId(requestOwnerId)
                .bookingDate(dto.getBookingDate())
                .startTime(dto.getStartTime())
                .endTime(endTime)
                .meetingMode(dto.getMeetingMode())
                .status(BookingStatus.PENDING)
                .notes(dto.getNotes())
                .build();
        
        booking = bookingRepository.save(booking);
        
        // Update service booking list
        service.getBookingIds().add(booking.getId());
        serviceRepository.save(service);
        
        // Update service status
        updateServiceStatus(serviceId);
        
        System.out.println("📅 Booking created: " + booking.getId() + " for service: " + service.getName());
        
        return toResponseDTO(booking, service.getName());
    }
    
    /**
     * Get all bookings for current user
     */
    public List<ServiceBookingResponseDTO> getMyBookings() {
        User user = getCurrentUser();
        List<ServiceBooking> bookings = bookingRepository.findByUserId(user.getId());
        
        return bookings.stream()
                .map(booking -> {
                    ServiceEntity service = serviceRepository.findById(booking.getServiceId())
                            .orElse(null);
                    String serviceName = service != null ? service.getName() : "Unknown Service";
                    return toResponseDTO(booking, serviceName);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all bookings for a service
     */
    public List<ServiceBookingResponseDTO> getServiceBookings(ObjectId serviceId) {
        List<ServiceBooking> bookings = bookingRepository.findByServiceId(serviceId);
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        
        return bookings.stream()
                .map(booking -> toResponseDTO(booking, service.getName()))
                .collect(Collectors.toList());
    }
    
    /**
     * Cancel a booking
     */
    @Transactional
    public ServiceBookingResponseDTO cancelBooking(ObjectId bookingId, String reason) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        // Verify user owns this booking
        User user = getCurrentUser();
        if (!booking.getUserId().equals(user.getId())) {
            throw new IllegalStateException("You can only cancel your own bookings");
        }
        
        // Update booking status
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        booking.setCancelledAt(java.time.LocalDateTime.now());
        
        booking = bookingRepository.save(booking);
        
        // Update service status
        updateServiceStatus(booking.getServiceId());
        
        System.out.println("❌ Booking cancelled: " + bookingId);
        
        ServiceEntity service = serviceRepository.findById(booking.getServiceId())
                .orElse(null);
        String serviceName = service != null ? service.getName() : "Unknown Service";
        
        return toResponseDTO(booking, serviceName);
    }
    
    /**
     * Approve a booking (provider only)
     */
    @Transactional
    public ServiceBookingResponseDTO approveBooking(ObjectId bookingId) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        User user = getCurrentUser();
        ServiceEntity service = serviceRepository.findById(booking.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        ensureProviderOwnsBooking(user, booking);
        
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be approved");
        }
        
        List<ServiceBooking> existingBookings = bookingRepository
                .findByServiceIdAndBookingDateAndStatus(booking.getServiceId(), booking.getBookingDate(), BookingStatus.CONFIRMED);
        if (hasOverlap(booking.getStartTime(), booking.getEndTime(), existingBookings)) {
            throw new IllegalStateException("This time slot is already accepted for another request");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setApprovedAt(java.time.LocalDateTime.now());
        
        booking = bookingRepository.save(booking);
        
        // Update service status
        updateServiceStatus(booking.getServiceId());
        
        System.out.println("✅ Booking approved: " + bookingId);
        
        return toResponseDTO(booking, service.getName());
    }
    
    /**
     * Reject a booking (provider only)
     */
    @Transactional
    public ServiceBookingResponseDTO rejectBooking(ObjectId bookingId, String reason) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        User user = getCurrentUser();
        ServiceEntity service = serviceRepository.findById(booking.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        ensureProviderOwnsBooking(user, booking);
        
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be rejected");
        }
        
        // Update booking status
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        booking.setRejectedAt(java.time.LocalDateTime.now());
        
        booking = bookingRepository.save(booking);
        
        // Update service status
        updateServiceStatus(booking.getServiceId());
        
        System.out.println("❌ Booking rejected: " + bookingId + " - Reason: " + reason);
        
        return toResponseDTO(booking, service.getName());
    }
    
    /**
     * Get pending bookings for provider's services
     */
    public List<ServiceBookingResponseDTO> getPendingBookingsForProvider() {
        return getBookingsForProvider().stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING)
                .collect(Collectors.toList());
    }

    /**
     * Get all bookings for the authenticated provider.
     */
    public List<ServiceBookingResponseDTO> getBookingsForProvider() {
        User user = getCurrentUser();
        List<ServiceBooking> bookings = bookingRepository.findByProviderId(user.getId());
        
        return bookings.stream()
                .map(booking -> {
                    ServiceEntity service = serviceRepository.findById(booking.getServiceId())
                            .orElse(null);
                    String serviceName = service != null ? service.getName() : "Unknown Service";
                    return toResponseDTO(booking, serviceName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get all service booking requests for admin dashboards.
     */
    public List<ServiceBookingResponseDTO> getAllBookingsForAdmin() {
        User user = getCurrentUser();
        if (!isAdmin(user)) {
            throw new IllegalStateException("Only admins can view all service requests");
        }

        return bookingRepository.findAll().stream()
                .map(booking -> {
                    ServiceEntity service = serviceRepository.findById(booking.getServiceId())
                            .orElse(null);
                    String serviceName = service != null ? service.getName() : "Unknown Service";
                    return toResponseDTO(booking, serviceName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Open or create a chat conversation for an accepted booking.
     */
    public ChatConversation openConversationForBooking(ObjectId bookingId) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        User user = getCurrentUser();

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Chat is available only after the booking is accepted");
        }

        boolean isClient = booking.getUserId().equals(user.getId());
        boolean isProvider = booking.getProviderId() != null && booking.getProviderId().equals(user.getId());
        if (!isClient && !isProvider) {
            throw new IllegalStateException("You are not allowed to open this conversation");
        }

        return chatService.getOrCreateConversation(
                booking.getUserId().toHexString(),
                booking.getProviderId().toHexString());
    }
    
    /**
     * Update service status based on bookings
     */
    private void updateServiceStatus(ObjectId serviceId) {
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        
        long confirmedBookings = bookingRepository.countByServiceIdAndStatus(serviceId, BookingStatus.CONFIRMED);
        
        if (confirmedBookings == 0) {
            service.setStatus(ServiceStatus.AVAILABLE);
        } else {
            // Check if there are any available slots in the next 7 days
            boolean hasAvailableSlots = false;
            LocalDate today = LocalDate.now();
            
            for (int i = 0; i < 7; i++) {
                LocalDate checkDate = today.plusDays(i);
                List<TimeSlotDTO> slots = getAvailableTimeSlots(serviceId, checkDate);
                if (slots.stream().anyMatch(TimeSlotDTO::isAvailable)) {
                    hasAvailableSlots = true;
                    break;
                }
            }
            
            service.setStatus(hasAvailableSlots ? ServiceStatus.PARTIALLY_BOOKED : ServiceStatus.FULLY_BOOKED);
        }
        
        serviceRepository.save(service);
        System.out.println("🔄 Service status updated: " + service.getStatus());
    }
    
    /**
     * Convert entity to DTO
     */
    private ServiceBookingResponseDTO toResponseDTO(ServiceBooking booking, String serviceName) {
        // Get user name
        String userName = "Unknown User";
        try {
            User user = userRepository.findById(booking.getUserId()).orElse(null);
            if (user != null) {
                userName = user.getFirstName() + " " + user.getLastName();
            }
        } catch (Exception e) {
            System.err.println("Error fetching user: " + e.getMessage());
        }
        
        return ServiceBookingResponseDTO.builder()
                .id(booking.getId().toHexString())
                .serviceId(booking.getServiceId().toHexString())
                .serviceName(serviceName)
                .userId(booking.getUserId().toHexString())
                .userName(userName)
                .clientId(booking.getUserId().toHexString())
                .clientName(userName)
                .providerId(booking.getProviderId() != null ? booking.getProviderId().toHexString() : null)
                .shopId(booking.getShopId().toHexString())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .meetingMode(booking.getMeetingMode())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .notes(booking.getNotes())
                .cancellationReason(booking.getCancellationReason())
                .cancelledAt(booking.getCancelledAt())
                .rejectionReason(booking.getRejectionReason())
                .rejectedAt(booking.getRejectedAt())
                .approvedAt(booking.getApprovedAt())
                .conversationId(buildConversationId(booking))
                .build();
    }

    private boolean isSlotAllowedForMode(ServiceEntity service, LocalDate bookingDate, LocalTime startTime,
                                         LocalTime endTime, MeetingMode meetingMode) {
        ServiceAvailability availability = service.getAvailability();
        if (availability == null || availability.getWorkingDays() == null || availability.getWorkingDays().isEmpty()) {
            return true;
        }
        if (!availability.getWorkingDays().contains(bookingDate.getDayOfWeek())) {
            return false;
        }
        if (availability.getTimeRanges() == null || availability.getTimeRanges().isEmpty()) {
            return true;
        }

        return availability.getTimeRanges().stream().anyMatch(range -> {
            AvailabilityMode mode = range.getAvailableMode() != null ? range.getAvailableMode() : AvailabilityMode.BOTH;
            boolean containsSlot = !startTime.isBefore(range.getStartTime()) && !endTime.isAfter(range.getEndTime());
            return containsSlot && mode.allows(meetingMode);
        });
    }

    private List<MeetingMode> toMeetingModes(AvailabilityMode availabilityMode) {
        AvailabilityMode mode = availabilityMode != null ? availabilityMode : AvailabilityMode.BOTH;
        if (mode == AvailabilityMode.ONLINE) {
            return List.of(MeetingMode.ONLINE);
        }
        if (mode == AvailabilityMode.IN_PERSON) {
            return List.of(MeetingMode.IN_PERSON);
        }
        return List.of(MeetingMode.ONLINE, MeetingMode.IN_PERSON);
    }

    private void ensureProviderOwnsBooking(User user, ServiceBooking booking) {
        if (isAdmin(user)) {
            return;
        }
        if (booking.getProviderId() == null || !booking.getProviderId().equals(user.getId())) {
            throw new IllegalStateException("You can only manage requests for your own services");
        }
    }

    private boolean isAdmin(User user) {
        return user.getRoles() != null && user.getRoles().contains(esprit_market.Enum.userEnum.Role.ADMIN);
    }

    private String buildConversationId(ServiceBooking booking) {
        if (booking.getUserId() == null || booking.getProviderId() == null || booking.getStatus() != BookingStatus.CONFIRMED) {
            return null;
        }
        String clientId = booking.getUserId().toHexString();
        String providerId = booking.getProviderId().toHexString();
        return clientId.compareTo(providerId) < 0 ? clientId + "_" + providerId : providerId + "_" + clientId;
    }
    
    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
