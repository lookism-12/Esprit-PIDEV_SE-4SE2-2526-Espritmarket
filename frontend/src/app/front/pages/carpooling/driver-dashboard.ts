import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  CarpoolingService, DriverStatsDTO, RideResponseDTO, VehicleDTO, 
  DriverProfileDTO, BookingResponseDTO, RideRequestResponseDTO 
} from '../../core/carpooling.service';
import { AuthService } from '../../core/auth.service';
import { CarpoolingMapComponent } from '../../shared/components/carpooling-map/carpooling-map.component';
import { ForumChatWidget } from '../../shared/components/forum-chat-widget/forum-chat-widget';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CurrencyPipe, DatePipe, CarpoolingMapComponent, ForumChatWidget],
  templateUrl: './driver-dashboard.html',
  styleUrls: ['./driver-dashboard.scss']
})
export class DriverDashboard implements OnInit {
  public service = inject(CarpoolingService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  readonly chatService = inject(ChatService);

  lastSelectedDistance = signal<number | null>(null);
  currentYear = new Date();
  
  // Monthly Earnings Trend — real data from backend, last 6 months
  monthlyTrend = computed(() => {
    const trend = this.stats()?.monthlyEarningsTrend || [];
    if (trend.length === 0) return [
      { label: 'Jan', earnings: 0 },
      { label: 'Feb', earnings: 0 },
      { label: 'Mar', earnings: 0 },
      { label: 'Apr', earnings: 0 },
      { label: 'May', earnings: 0 },
      { label: 'Jun', earnings: 0 },
    ];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return trend.slice(-6).map(t => {
      // t.month is "YYYY-MM" or "MM"
      const parts = t.month.split('-');
      const monthIndex = parseInt(parts[parts.length - 1], 10) - 1;
      return {
        label: monthNames[monthIndex] ?? t.month,
        earnings: t.earnings
      };
    });
  });

  maxMonthlyEarnings = computed(() => {
    const max = Math.max(...this.monthlyTrend().map(s => s.earnings));
    return max > 0 ? max : 1; // avoid division by zero
  });

  // Ride Activity Distribution
  rideActivity = computed(() => {
    const s = this.stats();
    if (!s) return [
      { label: 'Completed', value: 0, color: '#8B0000' },
      { label: 'Cancelled', value: 0, color: '#1a1a1a' },
      { label: 'Pending', value: 100, color: '#BD9C7C' }
    ];
    const total = (s.totalRidesCreated || 0) + (s.pendingRequests || 0);
    if (total === 0) return [{ label: 'No Activity', value: 100, color: '#eee' }];
    
    return [
      { label: 'Completed', value: Math.round(((s.totalRidesCompleted || 0) / total) * 100), color: '#8B0000' },
      { label: 'Active/Pending', value: Math.round(((s.pendingRequests || 0) / total) * 100), color: '#BD9C7C' },
      { label: 'Other', value: Math.max(0, 100 - Math.round(((s.totalRidesCompleted || 0) / total) * 100) - Math.round(((s.pendingRequests || 0) / total) * 100)), color: '#1a1a1a' }
    ];
  });

  maxWeeklyEarnings = computed(() => this.maxMonthlyEarnings());
  
  // Stats & Core Info
  stats = signal<DriverStatsDTO | null>(null);
  driverProfile = signal<DriverProfileDTO | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  onRouteSelected(event: {from: string, to: string, distanceKm: number}): void {
    this.createRideForm.patchValue({
      departureLocation: event.from,
      destinationLocation: event.to
    });
    this.lastSelectedDistance.set(event.distanceKm);
  }

  // Preview price logic (simplified version of backend logic for UI feedback)
  previewPrice = computed(() => {
    const dist = this.lastSelectedDistance();
    if (!dist) return null;
    const base = dist * 0.12;
    // ... we can add peak/demand multipliers here if we want more accuracy
    return Math.max(3.0, Math.min(base, 60.0)).toFixed(1);
  });

  // Management Data
  myRides = signal<RideResponseDTO[]>([]);
  myVehicles = signal<VehicleDTO[]>([]);
  myBookings = signal<Map<string, BookingResponseDTO[]>>(new Map());
  
  // UI State
  activeTab = signal<'overview' | 'trips' | 'requests'>('overview');
  showCreateRideModal = signal(false);
  showAddVehicleModal = signal(false);
  showRideBookings = signal<string | null>(null);
  showOnboarding = signal(false);
  showCounterModal = signal(false);
  selectedRequest = signal<RideRequestResponseDTO | null>(null);

  // Forms
  createRideForm!: FormGroup;
  addVehicleForm!: FormGroup;
  driverOnboardingForm!: FormGroup;
  counterForm!: FormGroup;

  hasProfile = computed(() => !!this.driverProfile());

  ngOnInit(): void {
    this.initForms();
    this.loadInitialData();
  }

  private initForms(): void {
    this.createRideForm = this.fb.group({
      departureLocation: ['', Validators.required],
      destinationLocation: ['', Validators.required],
      departureTime: ['', Validators.required],
      estimatedDurationMinutes: [60, [Validators.required, Validators.min(1)]],
      vehicleId: ['', Validators.required],
      availableSeats: [3, [Validators.required, Validators.min(1), Validators.max(7)]],
      pricePerSeat: [5.0, [Validators.required, Validators.min(0.5)]],
    });

    this.addVehicleForm = this.fb.group({
      make: ['', Validators.required],
      model: ['', Validators.required],
      licensePlate: ['', Validators.required],
      numberOfSeats: [5, [Validators.required, Validators.min(1), Validators.max(7)]],
    });

    this.driverOnboardingForm = this.fb.group({
      licenseNumber: [''],
      licenseDocument: ['NO_DOCUMENT'],
    });

    this.counterForm = this.fb.group({
      price: [0, [Validators.required, Validators.min(0.5)]],
      note: [''],
    });
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    this.service.getDriverProfile().subscribe({
      next: p => {
        this.driverProfile.set(p);
        this.loadStats();
        this.loadManagementData();
      },
      error: () => {
        // No driver profile? Register automatically without asking for license
        this.service.registerAsDriver({
          licenseNumber: 'NOT_REQUIRED',
          licenseDocument: 'AUTO_REGISTERED'
        }).subscribe({
          next: p => {
            this.driverProfile.set(p);
            this.loadInitialData(); // Reload stats and data
          },
          error: (err) => {
            console.error('Auto-registration failed', err);
            this.isLoading.set(false);
          }
        });
      }
    });
    this.service.getAvailableRideRequests().subscribe();
  }

  loadStats(): void {
    this.service.getMyDriverStats().subscribe({
      next: data => this.stats.set(data),
      error: err => console.error('Failed to load stats', err)
    });
  }

  loadManagementData(): void {
    this.service.getMyVehicles().subscribe({ next: v => this.myVehicles.set(v) });
    this.service.getMyRides().subscribe({
      next: (rides) => {
        this.myRides.set(rides);
        rides.forEach(r => {
          this.service.getBookingsForRide(r.rideId).subscribe({
            next: bookings => this.myBookings.update(m => { m.set(r.rideId, bookings); return new Map(m); })
          });
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Management Methods
  openCreateRide(): void {
    if (this.myVehicles().length === 0) {
      this.error.set('Please add a vehicle first.');
      this.showAddVehicleModal.set(true);
      return;
    }
    this.showCreateRideModal.set(true);
  }

  publishRide(): void {
    if (this.createRideForm.invalid) return;
    const v = this.createRideForm.value;
    this.service.createRide({
      ...v,
      departureTime: new Date(v.departureTime).toISOString(),
      distanceKm: this.lastSelectedDistance()
    }).subscribe({
      next: () => {
        this.success.set('Trip published successfully!');
        this.showCreateRideModal.set(false);
        this.createRideForm.reset();
        this.lastSelectedDistance.set(null);
        this.loadManagementData();
        this.loadStats();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: e => this.error.set(e.error?.message || 'Failed to publish trip')
    });
  }

  submitVehicle(): void {
    if (this.addVehicleForm.invalid) return;
    this.service.addVehicle(this.addVehicleForm.value).subscribe({
      next: (veh) => {
        this.myVehicles.update(v => [...v, veh]);
        this.showAddVehicleModal.set(false);
        this.success.set('Vehicle added!');
        setTimeout(() => this.success.set(null), 3000);
      }
    });
  }

  acceptBooking(bookingId: string): void {
    this.service.acceptBooking(bookingId).subscribe({
      next: () => this.loadManagementData()
    });
  }

  rejectBooking(bookingId: string): void {
    this.service.rejectBooking(bookingId).subscribe({
      next: () => this.loadManagementData()
    });
  }


  submitOnboarding(): void {
    if (this.driverOnboardingForm.invalid) return;
    this.service.registerAsDriver(this.driverOnboardingForm.value).subscribe({
      next: p => {
        this.driverProfile.set(p);
        this.showOnboarding.set(false);
        this.loadInitialData();
      }
    });
  }

  openCounterOffer(req: RideRequestResponseDTO): void {
    this.selectedRequest.set(req);
    this.counterForm.patchValue({ price: (req.proposedPrice || 5) + 2 });
    this.showCounterModal.set(true);
  }

  submitCounter(): void {
    if (this.counterForm.invalid || !this.selectedRequest()) return;
    const { price, note } = this.counterForm.value;
    this.service.counterPrice(this.selectedRequest()!.id, price, note).subscribe({
      next: () => {
        this.showCounterModal.set(false);
        this.success.set('Counter offer sent!');
        this.service.getAvailableRideRequests().subscribe();
        setTimeout(() => this.success.set(null), 3000);
      }
    });
  }

  quickAccept(req: RideRequestResponseDTO): void {
    const vehId = this.myVehicles()[0]?.id;
    if (!vehId) {
      this.error.set('No vehicle found');
      return;
    }
    this.service.acceptRideRequest(req.id, vehId).subscribe({
      next: () => {
        this.success.set('Request accepted!');
        this.loadManagementData();
        this.service.getAvailableRideRequests().subscribe();
        setTimeout(() => this.success.set(null), 3000);
      }
    });
  }

  // Helpers
  getBookings(rideId: string): BookingResponseDTO[] {
    return this.myBookings().get(rideId) || [];
  }

  goBack(): void {
    this.router.navigate(['/front/profile']); // Navigate to user profile
  }

  logout(): void {
    this.auth.logout();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  getAcceptanceColor(rate: number): string {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-red-500';
  }

  getMaxEarnings(): number {
    const trend = this.stats()?.monthlyEarningsTrend || [];
    if (trend.length === 0) return 1;
    return Math.max(...trend.map(t => t.earnings));
  }

  /**
   * Opens a real-time chat popup with the passenger of an accepted ride request.
   */
  openRideChat(req: RideRequestResponseDTO): void {
    const currentUserId = this.auth.userId();
    if (!currentUserId) return;
    const otherUserId = req.passengerUserId;
    if (!otherUserId) {
      this.error.set('Chat is only available after the ride request is accepted.');
      return;
    }
    this.chatService.openChatPopup(currentUserId, otherUserId);
  }

  /**
   * Opens a real-time chat popup with the passenger of a confirmed booking.
   */
  openBookingChat(booking: BookingResponseDTO): void {
    const currentUserId = this.auth.userId();
    if (!currentUserId) return;
    const otherUserId = booking.passengerUserId;
    if (!otherUserId) {
      this.error.set('Chat is only available for confirmed bookings.');
      return;
    }
    this.chatService.openChatPopup(currentUserId, otherUserId);
  }
}
