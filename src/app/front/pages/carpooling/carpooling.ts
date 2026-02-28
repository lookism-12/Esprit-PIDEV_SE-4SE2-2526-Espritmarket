import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';

interface Ride {
  id: string;
  driver: string;
  driverRating: number;
  from: string;
  to: string;
  date: Date;
  time: string;
  price: number;
  seats: number;
  availableSeats: number;
  vehicleType: string;
  recurring: boolean;
  status: 'active' | 'full' | 'completed' | 'cancelled';
}

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

  // State
  searchQuery = signal('');
  activeView = signal<'passenger' | 'driver'>('passenger');
  showCreateRideModal = signal(false);
  isCreatingRide = signal(false);

  // Forms
  searchForm!: FormGroup;
  createRideForm!: FormGroup;

  // Check if user is a driver
  isDriver = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === UserRole.DRIVER;
  });

  rides = signal<Ride[]>([
    {
      id: '1',
      driver: 'Firas G.',
      driverRating: 4.8,
      from: 'Tunis (Bardo)',
      to: 'ESPRIT (Ghazela)',
      date: new Date(),
      time: '08:00 AM',
      price: 2.5,
      seats: 3,
      availableSeats: 2,
      vehicleType: 'Car',
      recurring: true,
      status: 'active'
    },
    {
      id: '2',
      driver: 'Meriam L.',
      driverRating: 4.9,
      from: 'Ariana',
      to: 'ESPRIT (Ghazela)',
      date: new Date(),
      time: '08:30 AM',
      price: 1.5,
      seats: 4,
      availableSeats: 4,
      vehicleType: 'Car',
      recurring: false,
      status: 'active'
    },
    {
      id: '3',
      driver: 'Ahmed K.',
      driverRating: 4.7,
      from: 'La Marsa',
      to: 'ESPRIT (Ghazela)',
      date: new Date(),
      time: '07:45 AM',
      price: 3.0,
      seats: 4,
      availableSeats: 1,
      vehicleType: 'Car',
      recurring: true,
      status: 'active'
    },
    {
      id: '4',
      driver: 'Sarra M.',
      driverRating: 5.0,
      from: 'Manouba',
      to: 'ESPRIT (Ghazela)',
      date: new Date(),
      time: '09:00 AM',
      price: 2.0,
      seats: 3,
      availableSeats: 0,
      vehicleType: 'Car',
      recurring: false,
      status: 'full'
    }
  ]);

  // My rides (for drivers)
  myRides = signal<Ride[]>([
    {
      id: '5',
      driver: 'Me',
      driverRating: 4.8,
      from: 'Tunis Center',
      to: 'ESPRIT (Ghazela)',
      date: new Date(),
      time: '08:15 AM',
      price: 2.5,
      seats: 4,
      availableSeats: 2,
      vehicleType: 'Car',
      recurring: true,
      status: 'active'
    }
  ]);

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

    // Mock creation
    setTimeout(() => {
      const newRide: Ride = {
        id: 'new-' + Date.now(),
        driver: 'Me',
        driverRating: 4.8,
        from: formValue.from,
        to: formValue.to,
        date: new Date(formValue.date),
        time: formValue.time,
        price: formValue.price,
        seats: formValue.seats,
        availableSeats: formValue.seats,
        vehicleType: formValue.vehicleType,
        recurring: formValue.recurring,
        status: 'active'
      };

      this.myRides.update(rides => [...rides, newRide]);
      this.isCreatingRide.set(false);
      this.closeCreateRideModal();
    }, 1000);
  }

  cancelRide(rideId: string): void {
    if (confirm('Are you sure you want to cancel this ride?')) {
      this.myRides.update(rides => 
        rides.map(r => r.id === rideId ? { ...r, status: 'cancelled' as const } : r)
      );
    }
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
