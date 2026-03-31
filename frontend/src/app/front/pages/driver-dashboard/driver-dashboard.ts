import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/dashboard.service';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';
import { DashboardData, PerformanceStats, QuickAction } from '../../models/dashboard.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './driver-dashboard.html',
  styleUrls: ['./driver-dashboard.scss']
})
export class DriverDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  // Signals
  readonly dashboardData = this.dashboardService.dashboardData;
  readonly isLoading = this.dashboardService.isLoadingDashboard;
  readonly error = this.dashboardService.dashboardError;
  readonly pendingBookings = this.dashboardService.pendingBookings;
  readonly recentActivities = this.dashboardService.recentActivities;
  readonly earningsHistory = this.dashboardService.earningsHistory;

  // Component-specific signals
  readonly selectedQuickAction = signal<QuickAction | null>(null);
  readonly showBookingDetails = signal<string | null>(null);

  // Computed signals
  readonly performanceStats = computed(() => {
    const data = this.dashboardData();
    return data ? {
      completedRides: data.completedRides,
      averageRating: data.averageRating,
      totalEarnings: data.totalEarnings,
      activeRides: data.activeRides
    } : null;
  });

  readonly quickActions = computed(() => {
    const data = this.dashboardData();
    return [
      { title: 'Total Rides', value: data?.completedRides?.toString() || '0', icon: '🚗', color: 'crimson', path: '/driver/rides' },
      { title: 'Rating', value: (data?.averageRating || 0).toFixed(1), icon: '⭐', color: 'yellow', path: '/driver/ratings' },
      { title: 'Balance', value: (data?.totalBalance || 0).toFixed(0) + ' TND', icon: '💰', color: 'green', path: '/driver/earnings' },
      { title: 'Performance', value: data?.isVerified ? 'Elite' : 'Basic', icon: '📊', color: 'blue', path: '/driver/performance' }
    ] as QuickAction[];
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        this.error.set('Not logged in');
        return;
      }

      // Check for driver role or just use the ID if we're on the driver route
      const driverId = currentUser.id;

      this.dashboardService.getDashboard(driverId).subscribe({
        next: (data) => {
          console.log('Dashboard loaded:', data);
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set('Failed to connect to backend service');
        }
      });
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to load dashboard');
    }
  }

  /**
   * Accept a booking request
   */
  acceptBooking(bookingId: string): void {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) return;

      this.dashboardService.acceptBooking(currentUser.id, bookingId).subscribe({
        next: () => {
          // Refresh dashboard to update pending bookings
          this.loadDashboard();
        },
        error: (err) => {
          this.error.set('Failed to accept booking: ' + (err.error?.message || 'Check server status'));
        }
      });
    } catch (err: any) {
      this.error.set('Error accepting booking');
    }
  }

  /**
   * Decline a booking request
   */
  declineBooking(bookingId: string): void {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) return;

      this.dashboardService.declineBooking(currentUser.id, bookingId).subscribe({
        next: () => {
          this.loadDashboard();
        },
        error: (err) => {
          this.error.set('Failed to decline booking');
        }
      });
    } catch (err: any) {
      this.error.set('Error declining booking');
    }
  }

  /**
   * Toggle booking details view
   */
  toggleBookingDetails(rideId: string): void {
    this.showBookingDetails.set(
      this.showBookingDetails() === rideId ? null : rideId
    );
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboard();
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(value);
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      const now = new Date();

      // If it's today
      if (date.toDateString() === now.toDateString()) {
        return 'Today, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
