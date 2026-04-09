import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

interface AdminPayment {
  id: string;
  bookingId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AdminStats {
  activeRidesCount: number;
  pendingRequestsCount: number;
  unverifiedDriversCount: number;
  totalRevenue: number;
}

type Tab = 'rides' | 'drivers' | 'requests' | 'payments';

@Component({
  selector: 'app-carpooling-admin',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
<div class="p-6 min-h-screen" style="background-color: var(--bg-color)">

  <!-- Header -->
  <header class="flex justify-between items-start mb-6">
    <div>
      <h1 class="text-2xl font-extrabold text-gray-900">Carpooling Management</h1>
      <p class="text-gray-500 text-sm mt-1">Monitor all rides, drivers, requests and payments.</p>
    </div>
    <button (click)="load()" class="px-4 py-2 bg-[#7D0408] text-white rounded-lg font-bold text-sm hover:bg-[#5a0306] transition-colors">↻ Refresh</button>
  </header>

  <!-- Stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
      <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Rides</p>
      <p class="text-3xl font-black text-blue-600 mt-1">{{ stats()?.activeRidesCount ?? '—' }}</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-amber-500">
      <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Requests</p>
      <p class="text-3xl font-black text-amber-600 mt-1">{{ stats()?.pendingRequestsCount ?? '—' }}</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
      <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Unverified Drivers</p>
      <p class="text-3xl font-black text-red-600 mt-1">{{ stats()?.unverifiedDriversCount ?? '—' }}</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
      <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Revenue</p>
      <p class="text-3xl font-black text-green-600 mt-1">{{ (stats()?.totalRevenue ?? 0) | number:'1.0-0' }} TND</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm w-fit">
    @for (tab of tabs; track tab.key) {
      <button (click)="activeTab.set(tab.key)"
        class="px-5 py-2 rounded-lg font-bold text-sm transition-all"
        [class.bg-[#7D0408]]="activeTab() === tab.key"
        [class.text-white]="activeTab() === tab.key"
        [class.text-gray-500]="activeTab() !== tab.key">
        {{ tab.label }}
        @if (tab.count() > 0) {
          <span class="ml-1.5 text-xs font-black opacity-70">({{ tab.count() }})</span>
        }
      </button>
    }
  </div>

  <!-- Search + Status filter -->
  <div class="flex gap-3 mb-4 flex-wrap">
    <input type="text" placeholder="Search..."
      [ngModel]="search()" (ngModelChange)="search.set($event)"
      class="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7D0408]">
    @if (activeTab() === 'rides') {
      <div class="flex gap-2 flex-wrap">
        @for (s of rideStatuses; track s) {
          <button class="px-3 py-2 rounded-full text-xs font-bold border transition-all"
            [class.bg-[#7D0408]]="filterStatus() === s" [class.text-white]="filterStatus() === s"
            [class.border-[#7D0408]]="filterStatus() === s"
            [class.bg-white]="filterStatus() !== s" [class.text-gray-600]="filterStatus() !== s"
            [class.border-gray-200]="filterStatus() !== s"
            (click)="filterStatus.set(s)">{{ s === 'ALL' ? 'All' : s }}</button>
        }
      </div>
    }
  </div>

  @if (isLoading()) {
    <div class="text-center py-16 text-gray-400 font-bold">Loading data...</div>
  } @else {

    <!-- RIDES TAB -->
    @if (activeTab() === 'rides') {
      @if (filteredRides().length === 0) {
        <div class="text-center py-16 text-gray-400 font-bold">No rides found.</div>
      } @else {
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-gray-50 text-left">
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Driver</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Route</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Departure</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Seats</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Price</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (ride of filteredRides(); track ride.rideId) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-semibold text-gray-800">{{ ride.driverName || '—' }}</td>
                <td class="px-4 py-3 text-gray-700">
                  <span class="font-bold">{{ ride.departureLocation }}</span>
                  <span class="text-gray-400 mx-1">→</span>
                  <span>{{ ride.destinationLocation }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ ride.departureTime | date:'MMM d, HH:mm' }}</td>
                <td class="px-4 py-3 text-center font-bold text-gray-700">{{ ride.availableSeats }}</td>
                <td class="px-4 py-3 font-bold text-gray-800 font-mono">{{ ride.pricePerSeat }} TND</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded-full text-xs font-bold" [ngClass]="statusClass(ride.status)">{{ ride.status }}</span>
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="text-xs text-gray-400 text-right mt-2">{{ filteredRides().length }} of {{ rides().length }} rides</p>
      }
    }

    <!-- DRIVERS TAB -->
    @if (activeTab() === 'drivers') {
      @if (filteredDrivers().length === 0) {
        <div class="text-center py-16 text-gray-400 font-bold">No drivers found.</div>
      } @else {
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-gray-50 text-left">
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Driver</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Email</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">License</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Verified</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Rating</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Rides</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Earnings</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (d of filteredDrivers(); track d.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-semibold text-gray-800">{{ d.fullName }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ d.email }}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-600">{{ d.licenseNumber }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded-full text-xs font-bold" [ngClass]="d.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                    {{ d.isVerified ? '✓ Verified' : '✗ Pending' }}
                  </span>
                </td>
                <td class="px-4 py-3 font-bold text-amber-600">{{ d.averageRating | number:'1.1-1' }} ⭐</td>
                <td class="px-4 py-3 text-center font-bold text-gray-700">{{ d.totalRidesCompleted }}</td>
                <td class="px-4 py-3 font-bold text-green-700 font-mono">{{ d.totalEarnings | number:'1.0-0' }} TND</td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="text-xs text-gray-400 text-right mt-2">{{ filteredDrivers().length }} drivers</p>
      }
    }

    <!-- REQUESTS TAB -->
    @if (activeTab() === 'requests') {
      @if (filteredRequests().length === 0) {
        <div class="text-center py-16 text-gray-400 font-bold">No ride requests found.</div>
      } @else {
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-gray-50 text-left">
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Passenger</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Route</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Date</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Seats</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Proposed Price</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (r of filteredRequests(); track r.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-semibold text-gray-800">{{ r.passengerName }}</td>
                <td class="px-4 py-3 text-gray-700">
                  <span class="font-bold">{{ r.departureLocation }}</span>
                  <span class="text-gray-400 mx-1">→</span>
                  <span>{{ r.destinationLocation }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ r.departureTime | date:'MMM d, HH:mm' }}</td>
                <td class="px-4 py-3 text-center font-bold text-gray-700">{{ r.requestedSeats }}</td>
                <td class="px-4 py-3 font-bold text-gray-800 font-mono">{{ r.proposedPrice || '—' }} TND</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded-full text-xs font-bold" [ngClass]="statusClass(r.status)">{{ r.status }}</span>
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="text-xs text-gray-400 text-right mt-2">{{ filteredRequests().length }} requests</p>
      }
    }

    <!-- PAYMENTS TAB -->
    @if (activeTab() === 'payments') {
      @if (filteredPayments().length === 0) {
        <div class="text-center py-16 text-gray-400 font-bold">No payments found.</div>
      } @else {
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-gray-50 text-left">
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Payment ID</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Booking ID</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Amount</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Status</th>
                <th class="px-4 py-3 font-bold text-gray-500 uppercase text-xs">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (p of filteredPayments(); track p.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ p.id.substring(0, 8) }}...</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ p.bookingId.substring(0, 8) }}...</td>
                <td class="px-4 py-3 font-bold text-green-700 font-mono">{{ p.amount | number:'1.2-2' }} TND</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded-full text-xs font-bold" [ngClass]="statusClass(p.status)">{{ p.status }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ p.createdAt | date:'MMM d, HH:mm' }}</td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="text-xs text-gray-400 text-right mt-2">{{ filteredPayments().length }} payments</p>
      }
    }

  }
</div>
  `
})
export class CarpoolingAdminComponent implements OnInit {
  private http = inject(HttpClient);

  rides = signal<AdminRide[]>([]);
  drivers = signal<AdminDriver[]>([]);
  requests = signal<AdminRequest[]>([]);
  payments = signal<AdminPayment[]>([]);
  stats = signal<AdminStats | null>(null);
  isLoading = signal(true);
  search = signal('');
  filterStatus = signal('ALL');
  activeTab = signal<Tab>('rides');

  readonly rideStatuses = ['ALL', 'CONFIRMED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  readonly tabs = [
    { key: 'rides' as Tab,    label: '🚗 Rides',    count: computed(() => this.rides().length) },
    { key: 'drivers' as Tab,  label: '🧑‍✈️ Drivers',  count: computed(() => this.drivers().length) },
    { key: 'requests' as Tab, label: '📋 Requests', count: computed(() => this.requests().length) },
    { key: 'payments' as Tab, label: '💰 Payments', count: computed(() => this.payments().length) },
  ];

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

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);

    forkJoin({
      rides:    this.http.get<AdminRide[]>('/api/rides').pipe(catchError(() => of([]))),
      drivers:  this.http.get<AdminDriver[]>('/api/driver-profiles/all').pipe(catchError(() => of([]))),
      requests: this.http.get<AdminRequest[]>('/api/ride-requests').pipe(catchError(() => of([]))),
      payments: this.http.get<AdminPayment[]>('/api/ride-payments').pipe(catchError(() => of([]))),
      stats:    this.http.get<AdminStats>('/api/admin/carpooling/stats').pipe(catchError(() => of(null))),
    }).subscribe(({ rides, drivers, requests, payments, stats }) => {
      this.rides.set(rides);
      this.drivers.set(drivers);
      this.requests.set(requests);
      this.payments.set(payments);
      if (stats) this.stats.set(stats);
      this.isLoading.set(false);
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED:   'bg-blue-100 text-blue-700',
      ACCEPTED:    'bg-indigo-100 text-indigo-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      COMPLETED:   'bg-green-100 text-green-700',
      CANCELLED:   'bg-red-100 text-red-700',
      PENDING:     'bg-yellow-100 text-yellow-700',
      REFUNDED:    'bg-purple-100 text-purple-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }
}
