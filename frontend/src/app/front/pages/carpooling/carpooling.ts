import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  CarpoolingService, RideResponseDTO, VehicleDTO, DriverProfileDTO,
  BookingResponseDTO, RideRequestResponseDTO, DriverStatsDTO
} from '../../core/carpooling.service';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';

import { CarpoolingMapComponent, MapRide } from '../../shared/components/carpooling-map/carpooling-map.component';
import { ForumChatWidget } from '../../shared/components/forum-chat-widget/forum-chat-widget';
import { ChatService } from '../../../core/services/chat.service';
import { RideReviewModal } from '../../shared/components/ride-review-modal/ride-review-modal';
import { RideReviewService } from '../../core/ride-review.service';
import { PassengerEngagementWidget } from '../../shared/components/passenger-engagement-widget/passenger-engagement-widget';

@Component({
  selector: 'app-carpooling',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, RouterModule, CarpoolingMapComponent, ForumChatWidget, RideReviewModal, PassengerEngagementWidget],
  templateUrl: './carpooling.html',
  styleUrl: './carpooling.scss',
})
export class Carpooling implements OnInit {
  readonly carpoolingService = inject(CarpoolingService);
  private readonly fb = inject(FormBuilder);
  // Re-triggering build for analytics integration
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly chatService = inject(ChatService);
  private readonly reviewService = inject(RideReviewService);

  // ── Review modal state ────────────────────────────────────────────────
  showReviewModal = signal(false);
  reviewRideId = signal<string | null>(null);
  reviewOtherPartyName = signal('your ride partner');

  activeView = signal<'passenger' | 'driver'>('passenger');
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Passenger
  rides = signal<RideResponseDTO[]>([]);
  searchSortBy = signal<'cheapest' | 'fastest' | 'rated'>('cheapest');
  showBookingPanel = signal<string | false>(false);
  showCreateRideRequestModal = signal(false);
  hasPassengerProfile = signal(false);
  passengerTab = signal<'rides' | 'co-requests' | 'my-requests'>('rides');
  predictionResult = signal<RideRequestResponseDTO | null>(null);
  isCheckingAI = signal(false);
  myRideRequests = signal<RideRequestResponseDTO[]>([]);

  /** Driver profile ID of the currently logged-in user (null if not a driver) */
  myDriverProfileId = signal<string | null>(null);
  
  // Autocomplete
  suggestions = signal<any[]>([]);
  activeAutocompleteField = signal<'from' | 'to' | 'reqFrom' | 'reqTo' | null>(null);
  private searchTimeout: any = null;

  filteredRides = computed(() => {
    const sort = this.searchSortBy();
    const now = new Date();
    // Passenger view: exclude expired rides (departureTime in the past)
    const list = [...this.rides()].filter(r =>
      (r.status === 'CONFIRMED' || r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS') &&
      new Date(r.departureTime) > now
    );
    if (sort === 'cheapest') return list.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    if (sort === 'fastest') return list.sort((a, b) => (a.estimatedDurationMinutes ?? 999) - (b.estimatedDurationMinutes ?? 999));
    // Default: newest post first (by createdAt)
    return list.sort((a, b) => new Date(b.createdAt ?? b.departureTime).getTime() - new Date(a.createdAt ?? a.departureTime).getTime());
  });

  searchForm!: FormGroup;
  bookingForm!: FormGroup;
  createRideRequestForm!: FormGroup;
  counterForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadPassengerView();
    // Load current user's driver profile ID so we can block self-booking
    this.carpoolingService.getDriverProfile().subscribe({
      next: (p) => this.myDriverProfileId.set(p.id),
      error: () => this.myDriverProfileId.set(null)
    });
    this.carpoolingService.getAvailableRideRequests().subscribe();
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'request') {
        this.activeView.set('passenger');
        this.passengerTab.set('rides');
        setTimeout(() => this.openCreateRideRequestModal(), 300);
      }
    });
  }

  private initForms(): void {
    this.searchForm = this.fb.group({ from: [''], to: [''], date: [''], seats: [1], postedSince: [''] });
    this.bookingForm = this.fb.group({
      pickupLocation: ['', Validators.required], dropoffLocation: ['', Validators.required],
    });
    this.createRideRequestForm = this.fb.group({
      departureLocation: ['', Validators.required],
      destinationLocation: ['', Validators.required],
      departureTime: ['', [Validators.required, this.futureDateValidator]],
      requestedSeats: [1, [Validators.required, Validators.min(1), Validators.max(7)]],
      proposedPrice: [null, [Validators.min(0)]],
    });

    // Trigger AI prediction ONLY when proposedPrice has a value and form is valid
    this.createRideRequestForm.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe((v: any) => {
      const hasPrice = v?.proposedPrice !== null && v?.proposedPrice !== undefined && v?.proposedPrice !== '';
      if (hasPrice && this.createRideRequestForm.valid) {
        this.checkAcceptance();
      } else {
        this.predictionResult.set(null);
        this.isCheckingAI.set(false);
      }
    });

    this.counterForm = this.fb.group({
      price: [0, [Validators.required, Validators.min(0.5)]], note: [''],
    });
  }

  setSort(s: 'cheapest' | 'fastest' | 'rated'): void { this.searchSortBy.set(s); }

  // Map rides adapter
  mapRides = computed((): MapRide[] =>
    this.rides().map(r => ({
      rideId: r.rideId,
      driverName: r.driverName || 'Driver',
      driverRating: r.driverRating,
      departureLocation: r.departureLocation,
      destinationLocation: r.destinationLocation,
      pricePerSeat: r.pricePerSeat,
      availableSeats: r.availableSeats,
      status: r.status,
      departureTime: r.departureTime,
      estimatedDurationMinutes: r.estimatedDurationMinutes
    }))
  );
  formatDate(d: string): string { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  formatPrice(p: number): string { return `${p.toFixed(1)} TND`; }
  isRideFull(ride: RideResponseDTO): boolean { return ride.availableSeats <= 0; }
  isExpired(ride: RideResponseDTO): boolean { return new Date(ride.departureTime) < new Date(); }
  isFieldInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field); return !!(c && c.invalid && (c.dirty || c.touched));
  }
  swapCities(): void {
    const from = this.searchForm.get('from')?.value;
    const to = this.searchForm.get('to')?.value;
    this.searchForm.patchValue({ from: to, to: from });
  }
  starsArray(rating: number): boolean[] { return [1, 2, 3, 4, 5].map(i => i <= Math.round(rating)); }

  private loadPassengerView(): void {
    this.carpoolingService.getAllRides().subscribe({ next: rides => this.rides.set(rides), error: () => { } });
    this.carpoolingService.getPassengerProfile().subscribe({
      next: () => this.hasPassengerProfile.set(true),
      error: () => this.hasPassengerProfile.set(false)
    });
    this.carpoolingService.getMyRideRequests().subscribe({
      next: reqs => this.myRideRequests.set(reqs),
      error: () => { }
    });
  }

  onSearch(): void {
    const { from, to, date, seats, postedSince } = this.searchForm.value;

    // Map dropdown to ISO string
    let postedSinceDate: string | undefined;
    if (postedSince) {
      const now = new Date();
      if (postedSince === 'last2h') now.setHours(now.getHours() - 2);
      else if (postedSince === 'last6h') now.setHours(now.getHours() - 6);
      else if (postedSince === 'today') now.setHours(0, 0, 0, 0);
      else if (postedSince === 'last24h') now.setHours(now.getHours() - 24);
      postedSinceDate = now.toISOString().slice(0, 19);
    }

    this.isLoading.set(true);
    this.carpoolingService.searchRides(from, to, date, seats, postedSinceDate).subscribe({
      next: (res: any) => { this.rides.set(res.content || res); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  /** True when the logged-in user is the driver of this ride */
  isOwnRide(ride: RideResponseDTO): boolean {
    const myId = this.myDriverProfileId();
    return !!myId && myId === ride.driverProfileId;
  }

  openBookingPanel(rideId: string): void {
    // Prevent driver from booking their own ride
    const ride = this.rides().find(r => r.rideId === rideId);
    if (ride && this.isOwnRide(ride)) {
      this.error.set("You can't book your own ride.");
      setTimeout(() => this.error.set(null), 3000);
      return;
    }
    if (!this.hasPassengerProfile()) {
      this.carpoolingService.registerAsPassenger().subscribe({
        next: () => { this.hasPassengerProfile.set(true); this.showBookingPanel.set(rideId); },
        error: () => this.error.set('Could not activate passenger profile.')
      });
      return;
    }
    this.showBookingPanel.set(rideId);
  }
  closeBookingPanel(): void { this.showBookingPanel.set(false); }

  confirmBooking(ride: RideResponseDTO): void {
    if (this.bookingForm.invalid) return;
    const { pickupLocation, dropoffLocation } = this.bookingForm.value;
    this.carpoolingService.createBooking({ rideId: ride.rideId, pickupLocation, dropoffLocation, numberOfSeats: 1 }).subscribe({
      next: () => { this.error.set(null); this.closeBookingPanel(); this.bookingForm.reset(); this.loadPassengerView(); },
      error: e => this.error.set(e.error?.message || 'Booking failed')
    });
  }

  openCreateRideRequestModal(): void { this.showCreateRideRequestModal.set(true); }
  closeCreateRideRequestModal(): void { this.showCreateRideRequestModal.set(false); }

  submitRideRequest(): void {
    if (this.createRideRequestForm.invalid) return;
    const v = this.createRideRequestForm.value;
    this.carpoolingService.createRideRequest({ ...v, departureTime: new Date(v.departureTime).toISOString() }).subscribe({
      next: () => {
        this.error.set(null);
        this.success.set('Your ride request has been broadcasted to all drivers!');
        this.closeCreateRideRequestModal();
        this.createRideRequestForm.reset();
        this.predictionResult.set(null);
        // Refresh my requests so the new one appears in the "My Requests" tab
        this.carpoolingService.getMyRideRequests().subscribe({
          next: reqs => this.myRideRequests.set(reqs),
          error: () => { }
        });
      },
      error: e => this.error.set(e.error?.message || 'Request failed')
    });
  }

  checkAcceptance(): void {
    if (this.createRideRequestForm.invalid) {
      this.createRideRequestForm.markAllAsTouched();
      return;
    }
    this.isCheckingAI.set(true);
    const v = this.createRideRequestForm.value;
    this.carpoolingService.predictRideAcceptance({
      ...v,
      departureTime: new Date(v.departureTime).toISOString()
    }).subscribe({
      next: (res) => {
        this.predictionResult.set(res);
        this.isCheckingAI.set(false);
      },
      error: () => {
        this.isCheckingAI.set(false);
        this.error.set('AI Prediction Service is currently unavailable.');
      }
    });
  }

  private futureDateValidator(control: import('@angular/forms').AbstractControl) {
    if (!control.value) return null;
    return new Date(control.value) > new Date() ? null : { pastDate: true };
  }

  joinCoRequest(req: RideRequestResponseDTO): void {
    if (req.status === 'ACCEPTED' && req.rideId) {
      this.openBookingPanel(req.rideId);
    } else {
      this.error.set('This request is still pending or not yet linked to a confirmed ride.');
    }
  }

  /**
   * Opens a real-time chat popup between the current user and the other party
   * on an accepted ride request. Works for both passenger (chatting with driver)
   * and driver (chatting with passenger).
   */
  openRideChat(req: RideRequestResponseDTO): void {
    const currentUserId = this.auth.userId();
    if (!currentUserId) {
      this.error.set('You must be logged in to use the chat.');
      return;
    }
    // Determine the other party's user ID
    const otherUserId = currentUserId === req.passengerUserId
      ? req.driverUserId
      : req.passengerUserId;

    if (!otherUserId) {
      this.error.set('Chat is only available after the ride request is accepted.');
      return;
    }
    this.chatService.openChatPopup(currentUserId, otherUserId);
  }


  // Video event handlers
  onVideoLoadStart(): void {
    console.log('🎬 Video loading started');
  }

  onVideoCanPlay(): void {
    console.log('🎬 Video can play - loaded successfully');
  }

  onVideoError(event: Event): void {
    console.error('🎬 Video failed to load:', event);
    // Fallback: ensure the hero section still has the red background
    const heroSection = document.querySelector('.hero-section') as HTMLElement;
    if (heroSection) {
      heroSection.style.backgroundColor = '#8B0000';
    }
  }

  // ==================== REVIEW SYSTEM ====================

  openReviewModal(rideId: string, otherPartyName: string): void {
    this.reviewRideId.set(rideId);
    this.reviewOtherPartyName.set(otherPartyName);
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.reviewRideId.set(null);
  }

  // Autocomplete Logic
  onLocationInput(val: string, field: 'from' | 'to' | 'reqFrom' | 'reqTo'): void {
    this.activeAutocompleteField.set(field);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (val.length < 3) { this.suggestions.set([]); return; }
    this.searchTimeout = setTimeout(() => this.fetchSuggestions(val), 400);
  }

  private async fetchSuggestions(q: string): Promise<void> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Tunisia')}&format=json&limit=5&countrycodes=tn`);
      const data = await res.json();
      this.suggestions.set(data || []);
    } catch { this.suggestions.set([]); }
  }

  selectSuggestion(s: any): void {
    const name = s.display_name.split(',')[0];
    const field = this.activeAutocompleteField();
    if (field === 'from' || field === 'to') {
      this.searchForm.patchValue({ [field]: name });
    } else if (field === 'reqFrom') {
      this.createRideRequestForm.patchValue({ departureLocation: name });
    } else if (field === 'reqTo') {
      this.createRideRequestForm.patchValue({ destinationLocation: name });
    }
    this.suggestions.set([]);
    this.activeAutocompleteField.set(null);
  }

  onReviewSubmitted(): void {
    this.showReviewModal.set(false);
    this.reviewRideId.set(null);
    this.success.set('Your review has been submitted! ⭐');
  }
}
