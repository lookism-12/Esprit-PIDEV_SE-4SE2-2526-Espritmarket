import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AdminRide {
  rideId: string;
  driverName: string;
  departureLocation: string;
  destinationLocation: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  status: string;
  bookedSeats?: number;
  createdAt?: string;
}

interface AdminDriver {
  id: string;
  fullName: string;
  email: string;
  licenseNumber: string;
  isVerified: boolean;
  averageRating: number;
  totalRidesCompleted: number;
  totalEarnings: number;
}

interface AdminRequest {
  id: string;
  passengerName: string;
  departureLocation: string;
  destinationLocation: string;
  departureTime: string;
  requestedSeats: number;
  proposedPrice: number;
  status: string;
}

interface AdminPassenger {
  id: string;
  fullName: string;
  email: string;
  averageRating: number;
  totalRidesCompleted: number;
  createdAt: string;
}

interface AdminPayment {
  id: string;
  bookingId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface RouteStat {
  route: string;
  count: number;
}

interface AdminStats {
  activeRidesCount: number;
  pendingRequestsCount: number;
  unverifiedDriversCount: number;
  totalRevenue: number;
  activeRidesGrowth: number;
  pendingRequestsGrowth: number;
  unverifiedDriversGrowth: number;
  totalRevenueGrowth: number;
  
  ridesTrend?: Record<string, number>;
  earningsTrend?: Record<string, number>;
  userGrowth?: Record<string, number>;
  statusDistribution?: Record<string, number>;
  topRoutes?: RouteStat[];
  reservationsDemand?: Record<string, number>;
}

type Tab = 'overview' | 'rides' | 'drivers' | 'requests' | 'payments' | 'passengers';

@Component({
  selector: 'app-carpooling-admin',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './carpooling-admin.component.html',
  styleUrl: './carpooling-admin.scss'
})
export class CarpoolingAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  rides = signal<AdminRide[]>([]);
  drivers = signal<AdminDriver[]>([]);
  requests = signal<AdminRequest[]>([]);
  payments = signal<AdminPayment[]>([]);
  passengers = signal<AdminPassenger[]>([]);
  stats = signal<AdminStats | null>(null);
  isLoading = signal(true);
  search = signal('');
  filterStatus = signal('ALL');
  activeTab = signal<Tab>('overview');

  readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  readonly rideStatuses = ['ALL', 'CONFIRMED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  readonly tabs = [
    { key: 'overview' as Tab, label: '📈 Overview', count: () => 0 },
    { key: 'rides' as Tab,    label: '🚗 Rides',    count: computed(() => this.rides().length) },
    { key: 'drivers' as Tab,  label: '👨‍✈️ Drivers',  count: computed(() => this.drivers().length) },
    { key: 'passengers' as Tab, label: '👤 Passengers', count: computed(() => this.passengers().length) },
    { key: 'requests' as Tab, label: '📋 Requests', count: computed(() => this.requests().length) },
    { key: 'payments' as Tab, label: '💰 Payments', count: computed(() => this.payments().length) },
  ];

  protected readonly Math = Math;

  // ── Derived KPIs from loaded data (fallback when stats endpoint is unavailable) ──

  readonly derivedActiveRides = computed(() =>
    this.rides().filter(r => ['CONFIRMED', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status)).length
  );

  readonly derivedPendingRequests = computed(() =>
    this.requests().filter(r => r.status === 'PENDING').length
  );

  readonly derivedUnverifiedDrivers = computed(() =>
    this.drivers().filter(d => !d.isVerified).length
  );

  readonly derivedRevenue = computed(() =>
    this.payments().reduce((sum, p) => sum + (p.amount ?? 0), 0)
  );

  // ── Chart data: prefer backend stats, fall back to client-side aggregation ──

  readonly ridesTrend = computed(() => {
    const serverData = this.stats()?.ridesTrend;
    if (serverData && Object.keys(serverData).length > 0) {
      return this.months.map((_, i) => serverData[(i + 1).toString().padStart(2, '0')] ?? 0);
    }
    // Derive from loaded rides by createdAt month
    const counts = new Array(12).fill(0);
    this.rides().forEach(r => {
      if (r.createdAt) {
        const m = new Date(r.createdAt).getMonth();
        counts[m]++;
      }
    });
    return counts;
  });

  readonly earningsTrend = computed(() => {
    const serverData = this.stats()?.earningsTrend;
    if (serverData && Object.keys(serverData).length > 0) {
      return this.months.map((_, i) => serverData[(i + 1).toString().padStart(2, '0')] ?? 0);
    }
    // Derive from payments by createdAt month
    const sums = new Array(12).fill(0);
    this.payments().forEach(p => {
      if (p.createdAt) {
        const m = new Date(p.createdAt).getMonth();
        sums[m] += p.amount ?? 0;
      }
    });
    return sums;
  });

  readonly userGrowth = computed(() => {
    const serverData = this.stats()?.userGrowth;
    if (serverData && Object.keys(serverData).length > 0) {
      return this.months.map((_, i) => serverData[(i + 1).toString().padStart(2, '0')] ?? 0);
    }
    // Derive from passengers by createdAt month
    const counts = new Array(12).fill(0);
    this.passengers().forEach(p => {
      if (p.createdAt) {
        const m = new Date(p.createdAt).getMonth();
        counts[m]++;
      }
    });
    return counts;
  });

  readonly demandTrend = computed(() => {
    const serverData = this.stats()?.reservationsDemand;
    if (serverData && Object.keys(serverData).length > 0) {
      return this.months.map((_, i) => serverData[(i + 1).toString().padStart(2, '0')] ?? 0);
    }
    // Derive from requests by departureTime month
    const counts = new Array(12).fill(0);
    this.requests().forEach(r => {
      if (r.departureTime) {
        const m = new Date(r.departureTime).getMonth();
        counts[m] += r.requestedSeats ?? 1;
      }
    });
    return counts;
  });

  readonly statusStats = computed(() => {
    const serverDist = this.stats()?.statusDistribution;
    if (serverDist && Object.keys(serverDist).length > 0) {
      return Object.entries(serverDist).map(([k, v]) => ({ label: k, value: v as number }));
    }
    // Derive from loaded rides
    const map: Record<string, number> = {};
    this.rides().forEach(r => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  });

  readonly topRoutes = computed(() => {
    const serverRoutes = this.stats()?.topRoutes;
    if (serverRoutes && serverRoutes.length > 0) return serverRoutes;
    // Derive from loaded rides
    const map: Record<string, number> = {};
    this.rides().forEach(r => {
      const key = `${r.departureLocation} → ${r.destinationLocation}`;
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([route, count]) => ({ route, count }));
  });

  // Acceptance rate from requests
  readonly acceptanceRate = computed(() => {
    const total = this.requests().length;
    if (!total) return 0;
    const accepted = this.requests().filter(r => r.status === 'ACCEPTED').length;
    return Math.round((accepted / total) * 100);
  });

  // Average price per seat
  readonly avgPrice = computed(() => {
    const rides = this.rides();
    if (!rides.length) return 0;
    const sum = rides.reduce((s, r) => s + (r.pricePerSeat ?? 0), 0);
    return (sum / rides.length).toFixed(1);
  });

  // Verified driver rate
  readonly verifiedDriverRate = computed(() => {
    const total = this.drivers().length;
    if (!total) return 0;
    const verified = this.drivers().filter(d => d.isVerified).length;
    return Math.round((verified / total) * 100);
  });

  readonly filteredRides = computed(() => {
    const s = this.filterStatus();
    const q = this.search().toLowerCase().trim();
    return this.rides()
      .filter(r => s === 'ALL' || r.status === s)
      .filter(r => !q || (r.driverName || '').toLowerCase().includes(q) ||
        r.departureLocation.toLowerCase().includes(q) ||
        r.destinationLocation.toLowerCase().includes(q));
  });

  readonly filteredDrivers = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.drivers().filter(d => !q ||
      d.fullName.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.licenseNumber.toLowerCase().includes(q));
  });

  readonly filteredRequests = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.requests().filter(r => !q ||
      r.passengerName.toLowerCase().includes(q) ||
      r.departureLocation.toLowerCase().includes(q) ||
      r.destinationLocation.toLowerCase().includes(q));
  });

  readonly filteredPayments = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.payments().filter(p => !q || p.status.toLowerCase().includes(q));
  });

  readonly filteredPassengers = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.passengers().filter(p => !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q));
  });

  ngOnInit(): void { 
    this.load(); 
    this.syncTabWithRoute();
  }

  syncTabWithRoute(): void {
    const url = this.router.url;
    if (url.includes('/rides')) this.activeTab.set('rides');
    else if (url.includes('/drivers')) this.activeTab.set('drivers');
    else if (url.includes('/requests')) this.activeTab.set('requests');
    else if (url.includes('/payments')) this.activeTab.set('payments');
    else if (url.includes('/passengers')) this.activeTab.set('passengers');
    else this.activeTab.set('overview');
  }

  load(): void {
    this.isLoading.set(true);

    forkJoin({
      rides:    this.http.get<AdminRide[]>('/api/rides').pipe(catchError(() => of([]))),
      drivers:  this.http.get<AdminDriver[]>('/api/driver-profiles/all').pipe(catchError(() => of([]))),
      requests: this.http.get<AdminRequest[]>('/api/ride-requests').pipe(catchError(() => of([]))),
      payments: this.http.get<AdminPayment[]>('/api/ride-payments').pipe(catchError(() => of([]))),
      passengers: this.http.get<AdminPassenger[]>('/api/passenger-profiles/all').pipe(catchError(() => of([]))),
      stats:    this.http.get<AdminStats>('/api/admin/carpooling/stats').pipe(catchError(() => of(null))),
    }).subscribe(({ rides, drivers, requests, payments, passengers, stats }) => {
      this.rides.set(rides);
      this.drivers.set(drivers);
      this.requests.set(requests);
      this.payments.set(payments);
      this.passengers.set(passengers);
      if (stats) this.stats.set(stats);
      this.isLoading.set(false);
    });
  }

  getPath(data: number[], height: number, width: number): string {
    if (!data.length) return '';
    const max = Math.max(...data, 10);
    const stepX = width / (data.length - 1);
    return data.map((v, i) => `${i * stepX},${height - (v / max * height)}`).join(' L ');
  }

  getPoints(data: number[], height: number, width: number): {x: number, y: number}[] {
    const max = Math.max(...data, 10);
    const stepX = width / (data.length - 1);
    return data.map((v, i) => ({ x: i * stepX, y: height - (v / max * height) }));
  }

  verifyDriver(driver: AdminDriver): void {
    if (!confirm(`Are you sure you want to verify ${driver.fullName}?`)) return;
    this.http.patch(`/api/driver-profiles/${driver.id}/verify`, {}).subscribe({
      next: () => {
        alert('Driver verified successfully');
        this.load();
      },
      error: () => alert('Failed to verify driver')
    });
  }

  rejectDriver(driver: AdminDriver): void {
    if (!confirm(`Reject ${driver.fullName}? This will delete their driver profile.`)) return;
    this.http.delete(`/api/driver-profiles/${driver.id}`).subscribe({
      next: () => {
        alert('Driver application rejected/deleted');
        this.load();
      },
      error: () => alert('Failed to reject driver')
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED:   'bg-blue-500/20 text-blue-400',
      ACCEPTED:    'bg-indigo-500/20 text-indigo-400',
      IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
      COMPLETED:   'bg-green-500/20 text-green-400',
      CANCELLED:   'bg-red-500/20 text-red-400',
      PENDING:     'bg-yellow-500/20 text-yellow-400',
      REFUNDED:    'bg-purple-500/20 text-purple-400',
    };
    return map[status] || 'bg-slate-500/20 text-slate-400';
  }

  isExpired(time: string): boolean {
    return new Date(time) < new Date();
  }
}
