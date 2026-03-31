import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarpoolingService, PassengerDashboardDTO, BookingResponseDTO, RideRequestResponseDTO } from '../../core/carpooling.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './passenger-dashboard.html',
  styleUrl: './passenger-dashboard.scss'
})
export class PassengerDashboardComponent implements OnInit {
  private readonly carpoolingService = inject(CarpoolingService);
  private readonly authService = inject(AuthService);

  dashboard = signal<PassengerDashboardDTO | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  activeTab = signal<'bookings' | 'requests'>('bookings');

  bookings = computed(() => this.dashboard()?.recentBookings ?? []);
  requests = computed(() => this.dashboard()?.myRideRequests ?? []);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.carpoolingService.getPassengerDashboard().subscribe({
      next: data => { this.dashboard.set(data); this.isLoading.set(false); },
      error: e => {
        const msg = e?.error?.message || e?.message || 'Could not load dashboard.';
        this.error.set(msg);
        this.isLoading.set(false);
      }
    });
  }

  cancelBooking(bookingId: string): void {
    this.carpoolingService.cancelBooking(bookingId).subscribe({
      next: () => this.load(),
      error: e => this.error.set(e.error?.message || 'Could not cancel booking')
    });
  }

  cancelRequest(requestId: string): void {
    this.carpoolingService.cancelRideRequest(requestId).subscribe({
      next: () => this.load(),
      error: e => this.error.set(e.error?.message || 'Could not cancel request')
    });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 2 }).format(v);
  }

  statusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'PENDING':   return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-600';
      case 'ACCEPTED':  return 'bg-blue-100 text-blue-700';
      default:          return 'bg-gray-100 text-gray-500';
    }
  }
}
