import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  CarpoolingService, RideResponseDTO, VehicleDTO, DriverProfileDTO,
  BookingResponseDTO, RideRequestResponseDTO, DriverStatsDTO
} from '../../core/carpooling.service';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';

import { CarpoolingMapComponent, MapRide } from '../../shared/components/carpooling-map/carpooling-map.component';

@Component({
  selector: 'app-carpooling',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, RouterModule, CarpoolingMapComponent],
  templateUrl: './carpooling.html',
  styleUrl: './carpooling.scss',
})
export class Carpooling implements OnInit {
  readonly carpoolingService = inject(CarpoolingService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

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
  passengerTab = signal<'rides' | 'co-requests'>('rides');

  filteredRides = computed(() => {
    const sort = this.searchSortBy();
    const list = [...this.rides()].filter(r => r.status === 'CONFIRMED' || r.status === 'ACCEPTED');
    if (sort === 'cheapest') return list.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    if (sort === 'fastest') return list.sort((a, b) => (a.estimatedDurationMinutes ?? 999) - (b.estimatedDurationMinutes ?? 999));
    return list;
  });

  // Driver
  driverProfile = signal<DriverProfileDTO | null>(null);
  driverStats = signal<DriverStatsDTO | null>(null);
  myRides = signal<RideResponseDTO[]>([]);
  myVehicles = signal<VehicleDTO[]>([]);
  myBookings = signal<Map<string, BookingResponseDTO[]>>(new Map());
  showMyRidesBookings = signal<string | null>(null);
  showCreateRideModal = signal(false);
  showDriverOnboarding = signal(false);
  showAddVehicleModal = signal(false);
  showAcceptRequestModal = signal(false);
  showRequestsDrawer = signal(false);
  selectedRequestId = signal<string | null>(null);
  showCounterModal = signal(false);
  selectedRequest = signal<RideRequestResponseDTO | null>(null);

  hasDriverProfile = computed(() => !!this.driverProfile());
  isDriverUser = computed(() => this.auth.userRole() === UserRole.DRIVER);

  // Forms
  searchForm!: FormGroup;
  createRideForm!: FormGroup;
  driverOnboardingForm!: FormGroup;
  addVehicleForm!: FormGroup;
  bookingForm!: FormGroup;
  acceptRequestForm!: FormGroup;
  createRideRequestForm!: FormGroup;
  counterForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadPassengerView();
    if (this.isDriverUser()) this.loadDriverView();
    this.carpoolingService.getAvailableRideRequests().subscribe();
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'driver') this.activeView.set('driver');
      if (params['action'] === 'request') {
        this.activeView.set('passenger');
        this.passengerTab.set('rides');
        setTimeout(() => this.openCreateRideRequestModal(), 300);
      }
    });
  }

  private initForms(): void {
    this.searchForm = this.fb.group({ from: [''], to: [''], date: [''], seats: [1] });
    this.createRideForm = this.fb.group({
      departureLocation: ['', Validators.required],
      destinationLocation: ['', Validators.required],
      departureTime: ['', Validators.required],
      estimatedDurationMinutes: [60, [Validators.required, Validators.min(1)]],
      vehicleId: ['', Validators.required],
      availableSeats: [3, [Validators.required, Validators.min(1), Validators.max(7)]],
      pricePerSeat: [2.5, [Validators.required, Validators.min(0)]],
    });
    this.driverOnboardingForm = this.fb.group({
      licenseNumber: ['', [Validators.required, Validators.minLength(5)]],
      licenseDocument: ['', Validators.required],
    });
    this.addVehicleForm = this.fb.group({
      make: ['', Validators.required], model: ['', Validators.required],
      licensePlate: ['', Validators.required],
      numberOfSeats: [5, [Validators.required, Validators.min(1), Validators.max(7)]],
    });
    this.bookingForm = this.fb.group({
      pickupLocation: ['', Validators.required], dropoffLocation: ['', Validators.required],
    });
    this.acceptRequestForm = this.fb.group({ vehicleId: ['', Validators.required] });
    this.createRideRequestForm = this.fb.group({
      departureLocation: ['', Validators.required],
      destinationLocation: ['', Validators.required],
      departureTime: ['', Validators.required],
      requestedSeats: [1, [Validators.required, Validators.min(1)]],
      proposedPrice: [null],
    });
    this.counterForm = this.fb.group({
      price: [0, [Validators.required, Validators.min(0.5)]], note: [''],
    });
  }

  setView(v: 'passenger' | 'driver'): void { this.activeView.set(v); }
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
    this.carpoolingService.getAllRides().subscribe({ next: rides => this.rides.set(rides), error: () => {} });
    this.carpoolingService.getPassengerProfile().subscribe({
      next: () => this.hasPassengerProfile.set(true),
      error: () => this.hasPassengerProfile.set(false)
    });
  }

  onSearch(): void {
    const { from, to, date, seats } = this.searchForm.value;
    this.isLoading.set(true);
    this.carpoolingService.searchRides(from, to, date, seats).subscribe({
      next: (res: any) => { this.rides.set(res.content || res); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openBookingPanel(rideId: string): void {
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
      next: () => { this.error.set(null); this.closeCreateRideRequestModal(); this.createRideRequestForm.reset(); },
      error: e => this.error.set(e.error?.message || 'Request failed')
    });
  }

  private loadDriverView(): void {
    this.carpoolingService.getDriverProfile().subscribe({
      next: p => { this.driverProfile.set(p); this.loadDriverStats(); this.loadMyRidesAndVehicles(); },
      error: (err) => {
        this.driverProfile.set(null);
        const userId = this.auth.userId();
        if (userId) {
          this.carpoolingService.getDriverProfileByUserId(userId).subscribe({
            next: p => { if (p) { this.driverProfile.set(p); this.loadDriverStats(); this.loadMyRidesAndVehicles(); } },
            error: () => {}
          });
        }
      }
    });
  }

  private loadDriverStats(): void {
    this.carpoolingService.getMyDriverStats().subscribe({ next: s => this.driverStats.set(s), error: () => {} });
  }

  private loadMyRidesAndVehicles(): void {
    this.carpoolingService.getMyVehicles().subscribe({ next: v => this.myVehicles.set(v), error: () => {} });
    this.carpoolingService.getMyRides().subscribe({
      next: rides => {
        this.myRides.set(rides);
        rides.forEach(r => {
          this.carpoolingService.getBookingsForRide(r.rideId).subscribe({
            next: bookings => this.myBookings.update(m => { m.set(r.rideId, bookings); return new Map(m); }),
            error: () => {}
          });
        });
      },
      error: () => {}
    });
  }

  getBookingsForRide(rideId: string): BookingResponseDTO[] { return this.myBookings().get(rideId) ?? []; }
  showRideBookings(rideId: string): void { this.showMyRidesBookings.set(rideId); }
  hideRideBookings(): void { this.showMyRidesBookings.set(null); }

  acceptBooking(id: string): void {
    this.carpoolingService.acceptBooking(id).subscribe({ next: () => this.loadMyRidesAndVehicles(), error: e => this.error.set(e.error?.message || 'Error') });
  }
  rejectBooking(id: string): void {
    this.carpoolingService.rejectBooking(id).subscribe({ next: () => this.loadMyRidesAndVehicles(), error: e => this.error.set(e.error?.message || 'Error') });
  }

  openDriverOnboarding(): void { this.showDriverOnboarding.set(true); }
  closeDriverOnboarding(): void { this.showDriverOnboarding.set(false); }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.driverOnboardingForm.patchValue({ licenseDocument: file.name });
  }

  registerAsDriver(): void {
    if (this.driverOnboardingForm.invalid) { this.driverOnboardingForm.markAllAsTouched(); return; }
    const { licenseNumber, licenseDocument } = this.driverOnboardingForm.value;
    this.carpoolingService.registerAsDriver({ licenseNumber, licenseDocument }).subscribe({
      next: p => {
        this.success.set('✓ Driver profile created!');
        setTimeout(() => this.success.set(null), 4000);
        this.driverProfile.set(p);
        this.closeDriverOnboarding();
        this.loadMyRidesAndVehicles();
      },
      error: e => this.error.set(e?.error?.message ?? e?.message ?? 'Registration failed')
    });
  }

  openAddVehicleModal(): void { this.addVehicleForm.reset(); this.showAddVehicleModal.set(true); }
  closeAddVehicleModal(): void { this.showAddVehicleModal.set(false); }

  submitVehicle(): void {
    if (this.addVehicleForm.invalid) { this.addVehicleForm.markAllAsTouched(); return; }
    this.carpoolingService.addVehicle(this.addVehicleForm.value).subscribe({
      next: v => {
        this.success.set('✓ Vehicle added!');
        setTimeout(() => this.success.set(null), 4000);
        this.myVehicles.update(arr => [...arr, v]);
        this.closeAddVehicleModal();
      },
      error: e => this.error.set(e.error?.message || 'Vehicle creation failed')
    });
  }

  openCreateRideModal(): void {
    this.createRideForm.reset({ availableSeats: 3, pricePerSeat: 2.5, estimatedDurationMinutes: 60 });
    this.showCreateRideModal.set(true);
  }
  closeCreateRideModal(): void { this.showCreateRideModal.set(false); }

  createRide(): void {
    if (this.createRideForm.invalid) { this.createRideForm.markAllAsTouched(); return; }
    const v = this.createRideForm.value;
    this.carpoolingService.createRide({
      ...v,
      departureTime: new Date(v.departureTime).toISOString(),
      availableSeats: parseInt(v.availableSeats, 10),
      pricePerSeat: parseFloat(v.pricePerSeat),
      estimatedDurationMinutes: parseInt(v.estimatedDurationMinutes, 10),
    }).subscribe({
      next: () => {
        this.success.set('✓ Ride published!');
        setTimeout(() => this.success.set(null), 4000);
        this.closeCreateRideModal();
        this.loadMyRidesAndVehicles();
      },
      error: e => this.error.set(e.error?.message || 'Ride creation failed')
    });
  }

  openAcceptRequestModal(requestId: string): void {
    this.selectedRequestId.set(requestId);
    this.acceptRequestForm.reset();
    this.showAcceptRequestModal.set(true);
  }
  closeAcceptRequestModal(): void { this.showAcceptRequestModal.set(false); this.selectedRequestId.set(null); }

  submitAcceptRequest(): void {
    if (this.acceptRequestForm.invalid || !this.selectedRequestId()) return;
    const { vehicleId } = this.acceptRequestForm.value;
    this.carpoolingService.acceptRideRequest(this.selectedRequestId()!, vehicleId).subscribe({
      next: () => {
        this.success.set('✓ Request accepted!');
        setTimeout(() => this.success.set(null), 4000);
        this.closeAcceptRequestModal();
        this.carpoolingService.getAvailableRideRequests().subscribe();
        this.loadMyRidesAndVehicles();
      },
      error: e => this.error.set(e.error?.message || 'Could not accept request')
    });
  }

  quickAcceptRequest(req: RideRequestResponseDTO): void {
    const vehicleId = this.myVehicles()?.[0]?.id;
    if (!vehicleId) { this.error.set('Add a vehicle first.'); this.openAddVehicleModal(); return; }
    this.carpoolingService.acceptRideRequest(req.id, vehicleId).subscribe({
      next: () => {
        this.success.set('✓ Quick accepted!');
        setTimeout(() => this.success.set(null), 4000);
        this.carpoolingService.getAvailableRideRequests().subscribe();
        this.loadMyRidesAndVehicles();
      },
      error: e => this.error.set(e?.error?.message || 'Could not quick-accept')
    });
  }

  joinCoRequest(req: RideRequestResponseDTO): void {
    if (req.status === 'PENDING') { this.error.set('No driver has accepted this request yet.'); return; }
    if (req.status === 'CANCELLED') { this.error.set('This request has been cancelled.'); return; }
    if (req.status === 'ACCEPTED' && req.rideId) { this.openBookingPanel(req.rideId); }
    else { this.error.set('Ride details are not available yet.'); }
  }

  toggleRequestsDrawer(): void { this.showRequestsDrawer.update(v => !v); }
  refreshFeed(): void { this.carpoolingService.getAvailableRideRequests().subscribe(); }

  openCounterModal(req: RideRequestResponseDTO): void {
    this.selectedRequest.set(req);
    this.counterForm.patchValue({ price: (req.proposedPrice || 5) + 1.5, note: '' });
    this.showCounterModal.set(true);
  }
  closeCounterModal(): void { this.showCounterModal.set(false); this.selectedRequest.set(null); }

  submitCounterPrice(): void {
    if (this.counterForm.invalid || !this.selectedRequest()) return;
    const { price, note } = this.counterForm.value;
    this.carpoolingService.counterPrice(this.selectedRequest()!.id, price, note).subscribe({
      next: () => {
        this.success.set('✓ Counter offer sent!');
        setTimeout(() => this.success.set(null), 4000);
        this.closeCounterModal();
        this.carpoolingService.getAvailableRideRequests().subscribe();
      },
      error: e => this.error.set(e.error?.message || 'Counter failed')
    });
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
}
