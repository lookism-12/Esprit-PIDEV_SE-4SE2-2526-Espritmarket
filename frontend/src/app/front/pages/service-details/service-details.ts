import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService, Service } from '../../../core/services/service.service';
import { BookingService, TimeSlot, BookingRequest, MeetingMode } from '../../../core/services/booking.service';
import { BookingResponse } from '../../../core/services/booking.service';
import { ChatService as RealtimeChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { BookingCalendarComponent } from '../../../shared/components/booking-calendar.component';
import { TimeSlotSelectorComponent } from '../../../shared/components/time-slot-selector.component';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BookingCalendarComponent, TimeSlotSelectorComponent],
  templateUrl: './service-details.html',
  styleUrl: './service-details.scss',
})
export class ServiceDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceService = inject(ServiceService);
  private bookingService = inject(BookingService);
  private realtimeChatService = inject(RealtimeChatService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  service = signal<Service | null>(null);
  isLoading = signal(true);
  serviceNotFound = signal(false);

  safeService = computed(() => this.service() || {} as Service);
  hasService = computed(() => this.service() !== null);

  relatedServices = signal<Service[]>([]);
  myServiceBookings = signal<BookingResponse[]>([]);

  // Booking state
  showBookingModal = signal(false);
  selectedDate = signal<Date | null>(null);
  selectedSlot = signal<TimeSlot | null>(null);
  selectedMeetingMode = signal<MeetingMode | null>(null);
  availableSlots = signal<TimeSlot[]>([]);
  isLoadingSlots = signal(false);
  isBooking = signal(false);
  bookingNotes = signal('');

  ngOnInit(): void {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadService(serviceId);
    }
  }

  private loadService(id: string): void {
    console.log('🔍 Loading service:', id);
    this.isLoading.set(true);
    this.serviceNotFound.set(false);
    
    this.serviceService.getById(id).subscribe({
      next: (data) => {
        console.log('✅ Service loaded:', data);
        this.service.set(data);
        this.loadRelatedServices(data.categoryIds);
        this.loadMyServiceBookings(data.id);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load service:', err);
        this.toastService.error('Failed to load service details');
        this.serviceNotFound.set(true);
        this.isLoading.set(false);
      }
    });
  }

  private loadRelatedServices(categoryIds: string[] | undefined): void {
    if (!categoryIds || categoryIds.length === 0) return;

    this.serviceService.getAll().subscribe({
      next: (services) => {
        const related = services
          .filter(s => 
            s.id !== this.service()?.id && 
            s.categoryIds?.some(catId => categoryIds.includes(catId))
          )
          .slice(0, 3);
        
        this.relatedServices.set(related);
      },
      error: (err) => {
        console.error('❌ Failed to load related services:', err);
      }
    });
  }

  contactProvider(): void {
    const service = this.service();
    if (!service) return;
    
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please login to contact the provider');
      this.router.navigate(['/login']);
      return;
    }
    
    this.toastService.success('Contact feature coming soon!');
  }

  openBookingModal(): void {
    const service = this.service();
    if (!service) return;
    
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please login to book this service');
      this.router.navigate(['/login']);
      return;
    }
    
    this.showBookingModal.set(true);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.selectedMeetingMode.set(null);
    this.availableSlots.set([]);
    this.bookingNotes.set('');
  }

  closeBookingModal(): void {
    this.showBookingModal.set(false);
  }

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    this.selectedMeetingMode.set(null);
    this.loadAvailableSlots(date);
  }

  private loadMyServiceBookings(serviceId: string): void {
    if (!this.authService.isAuthenticated()) return;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.myServiceBookings.set(bookings.filter(booking => booking.serviceId === serviceId));
      },
      error: () => this.myServiceBookings.set([])
    });
  }

  onSlotSelected(slot: TimeSlot): void {
    this.selectedSlot.set(slot);
    const modes = slot.availableModes || ['ONLINE', 'IN_PERSON'];
    this.selectedMeetingMode.set(modes.length === 1 ? modes[0] : null);
  }

  private loadAvailableSlots(date: Date): void {
    const service = this.service();
    if (!service) return;

    this.isLoadingSlots.set(true);
    const dateStr = date.toISOString().split('T')[0];

    this.bookingService.getAvailableTimeSlots(service.id, dateStr).subscribe({
      next: (slots) => {
        console.log('✅ Loaded slots:', slots);
        this.availableSlots.set(slots);
        this.isLoadingSlots.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load slots:', err);
        this.toastService.error('Failed to load available time slots');
        this.isLoadingSlots.set(false);
      }
    });
  }

  confirmBooking(): void {
    const service = this.service();
    const date = this.selectedDate();
    const slot = this.selectedSlot();

    const meetingMode = this.selectedMeetingMode();

    if (!service || !date || !slot || !meetingMode) {
      this.toastService.error('Please select a date, time slot, and meeting mode');
      return;
    }

    this.isBooking.set(true);

    const request: BookingRequest = {
      serviceId: service.id,
      bookingDate: date.toISOString().split('T')[0],
      startTime: slot.startTime,
      meetingMode,
      notes: this.bookingNotes() || undefined
    };

    this.bookingService.createBooking(request).subscribe({
      next: (booking) => {
        console.log('✅ Booking created:', booking);
        this.toastService.success('Booking request sent to the provider');
        this.loadMyServiceBookings(service.id);
        this.closeBookingModal();
        this.isBooking.set(false);
      },
      error: (err) => {
        console.error('❌ Booking failed:', err);
        this.toastService.error(err.error?.message || 'Failed to book service');
        this.isBooking.set(false);
      }
    });
  }

  canConfirmBooking = computed(() => {
    return this.selectedDate() !== null && this.selectedSlot() !== null && this.selectedMeetingMode() !== null && !this.isBooking();
  });

  canUseMode(mode: MeetingMode): boolean {
    const slot = this.selectedSlot();
    if (!slot) return false;
    return (slot.availableModes || ['ONLINE', 'IN_PERSON']).includes(mode);
  }

  openBookingChat(booking: BookingResponse): void {
    const currentUserId = this.authService.getUserId() || localStorage.getItem('userId') || '';
    const providerId = booking.providerId;
    if (!currentUserId || !providerId) {
      this.toastService.error('Unable to open chat');
      return;
    }
    this.bookingService.openBookingChat(booking.id).subscribe({
      next: () => {
        this.realtimeChatService.openChatPopup(currentUserId, providerId);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Chat is available after acceptance');
      }
    });
  }

  getAllowedDays(): string[] {
    const service = this.service();
    if (!service || !service.availability || !service.availability.workingDays) {
      return []; // No restrictions if not configured
    }
    return service.availability.workingDays;
  }

  formatAllowedDays(): string {
    const days = this.getAllowedDays();
    if (days.length === 0) return 'All days';
    
    const dayNames: { [key: string]: string } = {
      'MONDAY': 'Mon',
      'TUESDAY': 'Tue',
      'WEDNESDAY': 'Wed',
      'THURSDAY': 'Thu',
      'FRIDAY': 'Fri',
      'SATURDAY': 'Sat',
      'SUNDAY': 'Sun'
    };
    
    return days.map(d => dayNames[d] || d).join(', ');
  }

  bookService(): void {
    this.openBookingModal();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'AVAILABLE': return 'bg-green-100 text-green-700';
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'PARTIALLY_BOOKED': return 'bg-yellow-100 text-yellow-700';
      case 'FULLY_BOOKED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'UNAVAILABLE': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
