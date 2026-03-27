import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';
import { RideService, Ride, RideFilter } from '../../core/ride.service';

@Component({
  selector: 'app-carpooling',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './carpooling.html',
  styleUrl: './carpooling.scss',
})
export class Carpooling implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private rideService = inject(RideService);

  // State
  searchQuery = signal('');
  activeView = signal<'passenger' | 'driver'>('passenger');
  showCreateRideModal = signal(false);
  isCreatingRide = signal(false);
  isLoading = signal(false);

  // Forms
  searchForm!: FormGroup;
  createRideForm!: FormGroup;

  // Check if user is a driver
  isDriver = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === UserRole.DRIVER;
  });

  rides = signal<Ride[]>([]);

  // My rides (for drivers)
  myRides = signal<Ride[]>([]);

  // Filtered rides
  filteredRides = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.rides().filter(ride => 
      ride.from.toLowerCase().includes(query) || 
      ride.to.toLowerCase().includes(query) ||
      ride.driver.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.initForms();
    this.fetchRides();
    this.fetchMyRides();
  }
 
  fetchRides(): void {
    const filter: RideFilter = {};
    if (this.searchQuery()) filter.departureLocation = this.searchQuery();
    
    this.isLoading.set(true);
    this.rideService.getAll(filter).subscribe({
      next: (rides) => {
        this.rides.set(rides);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching rides:', err);
        this.isLoading.set(false);
      }
    });
  }
 
  fetchMyRides(): void {
    this.rideService.getMyRides().subscribe({
      next: (rides) => this.myRides.set(rides),
      error: (err) => console.error('Error fetching my rides:', err)
    });
  }

  private initForms(): void {
    this.searchForm = this.fb.group({
      from: [''],
      date: [''],
      time: ['']
    });

    this.createRideForm = this.fb.group({
      from: ['', Validators.required],
      to: ['ESPRIT (Ghazela)', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      seats: [3, [Validators.required, Validators.min(1), Validators.max(7)]],
      price: [2.5, [Validators.required, Validators.min(0)]],
      vehicleType: ['Car', Validators.required],
      recurring: [false],
      notes: ['']
    });
  }

  setView(view: 'passenger' | 'driver'): void {
    this.activeView.set(view);
  }

  onSearch(): void {
    const { from } = this.searchForm.value;
    this.searchQuery.set(from || '');
  }

  bookRide(ride: Ride): void {
    if (ride.availableSeats === 0) return;
    
    // Mock booking
    console.log('Booking ride:', ride);
    alert(`Ride booked successfully! Contact ${ride.driver} for pickup details.`);
    
    // Update available seats
    this.rides.update(rides => 
      rides.map(r => r.id === ride.id 
        ? { ...r, availableSeats: r.availableSeats - 1, status: r.availableSeats - 1 === 0 ? 'full' : 'active' as const }
        : r
      )
    );
  }

  openCreateRideModal(): void {
    this.showCreateRideModal.set(true);
  }

  closeCreateRideModal(): void {
    this.showCreateRideModal.set(false);
    this.createRideForm.reset({
      to: 'ESPRIT (Ghazela)',
      seats: 3,
      price: 2.5,
      vehicleType: 'Car',
      recurring: false
    });
  }

  createRide(): void {
    if (this.createRideForm.invalid) {
      this.createRideForm.markAllAsTouched();
      return;
    }

    this.isCreatingRide.set(true);
    const formValue = this.createRideForm.value;
    
    // Combine date and time
    const [hours, minutes] = formValue.time.split(':');
    const departureTime = new Date(formValue.date);
    departureTime.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
 
    const rideData = {
      departureLocation: formValue.from,
      destinationLocation: formValue.to,
      departureTime: departureTime.toISOString(),
      availableSeats: formValue.seats,
      pricePerSeat: formValue.price,
      vehicleId: null
    };
 
    this.rideService.create(rideData).subscribe({
      next: () => {
        this.isCreatingRide.set(false);
        this.closeCreateRideModal();
        this.fetchMyRides();
        this.fetchRides();
      },
      error: (err) => {
        console.error('Error creating ride:', err);
        this.isCreatingRide.set(false);
      }
    });
  }

  cancelRide(rideId: string): void {
    if (confirm('Are you sure you want to cancel this ride?')) {
      this.rideService.cancel(rideId).subscribe({
        next: () => {
          this.fetchMyRides();
          this.fetchRides();
        },
        error: (err) => console.error('Error cancelling ride:', err)
      });
    }
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
