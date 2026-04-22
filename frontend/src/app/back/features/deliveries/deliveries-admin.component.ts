import { Component, OnInit, OnDestroy, signal, computed, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavService } from '../../core/services/sav.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../../front/core/user.service';
import { NotificationService } from '../../../front/core/notification.service';
import { Delivery, DeliveryStatus, DeliveryRequest } from '../../core/models/sav.models';
import { User } from '../../../front/models/user.model';
import { AppNotification } from '../../../front/models/notification.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-deliveries-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './deliveries-admin.component.html',
  styles: [`
    .leaflet-container {
      border-radius: 1rem;
      z-index: 10;
    }
    .custom-leaflet-marker {
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    @keyframes blink-red {
      0%, 100% { background-color: #fef2f2; border-color: #ef4444; }
      50% { background-color: #fee2e2; border-color: #dc2626; }
    }
    .animate-blink-refused {
      animation: blink-red 1.5s ease-in-out infinite;
    }
  `]
})
export class DeliveriesAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  private savService = inject(SavService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  // Data signals
  readonly deliveries = signal<Delivery[]>([]);
  readonly deliveryDrivers = signal<User[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly adminNotifications = signal<AppNotification[]>([]);
  readonly isNotifPanelOpen = signal<boolean>(false);

  // Filters
  readonly searchTerm = signal<string>('');
  readonly filterStatus = signal<string>('ALL');
  readonly viewMode = signal<'LIST' | 'MAP'>('LIST');

  // Modal / Selected states
  readonly selectedDelivery = signal<Delivery | null>(null);
  readonly isViewModalOpen = signal<boolean>(false);
  readonly isAssignModalOpen = signal<boolean>(false);
  readonly isCancelModalOpen = signal<boolean>(false);
  readonly isDropdownOpen = signal<boolean>(false);
  
  // Action states
  readonly selectedDriverId = signal<string>('');
  readonly selectedStatus = signal<DeliveryStatus>('PREPARING');
  readonly cancelReason = signal<string>('');
  
  // Map logic
  @ViewChild('map', { static: false }) mapContainer!: ElementRef;
  private map: L.Map | undefined;
  private pollingInterval: any;

  // Computed KPIs
  readonly kpiTotal = computed(() => this.deliveries().length);
  readonly kpiPending = computed(() => this.deliveries().filter(d => d.status === 'PREPARING' || d.status === 'DRIVER_REFUSED').length);
  readonly kpiInProgress = computed(() => this.deliveries().filter(d => d.status === 'IN_TRANSIT').length);
  readonly kpiDelivered = computed(() => this.deliveries().filter(d => d.status === 'DELIVERED').length);
  readonly kpiCancelled = computed(() => this.deliveries().filter(d => d.status === 'RETURNED').length);

  // Unread admin notifications count
  readonly unreadCount = computed(() => this.adminNotifications().filter(n => !n.read).length);

  // Computed Leaderboard
  readonly driverLeaderboard = computed(() => {
    const list = this.deliveries();
    const map = new Map<string, number>();
    list.forEach(d => {
      if(d.userId && d.userId.length > 0 && d.userId !== 'pending') {
        map.set(d.userId, (map.get(d.userId) || 0) + 1);
      }
    });
    const ranking: { id: string; name: string; count: number; avatar: string }[] = [];
    for (const [uid, count] of map.entries()) {
      const driver = this.deliveryDrivers().find(d => d.id === uid);
      const name = driver ? `${driver.firstName} ${driver.lastName}` : 'Unregistered Agent';
      const avatar = driver?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=fca5a5&color=fff';
      ranking.push({ id: uid, name, count, avatar });
    }
    return ranking.sort((a,b) => b.count - a.count).slice(0, 3);
  });

  readonly filteredDeliveries = computed(() => {
    return this.deliveries().filter(d => {
      const matchesSearch = d.address?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
                            d.cartId?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
                            d.id?.toLowerCase().includes(this.searchTerm().toLowerCase());
      const matchesStatus = this.filterStatus() === 'ALL' || d.status === this.filterStatus();
      return matchesSearch && matchesStatus;
    });
  });

  ngOnInit(): void {
    this.fetchDeliveries();
    this.fetchDrivers();
    this.fetchAdminNotifications();
    // Poll every 15 seconds for new data
    this.pollingInterval = setInterval(() => {
      this.fetchDeliveries();
      this.fetchAdminNotifications();
    }, 15000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  toggleViewMode(mode: 'LIST' | 'MAP') {
    this.viewMode.set(mode);
    if(mode === 'MAP') setTimeout(() => this.initMap(), 100);
  }

  fetchDeliveries() {
    this.isLoading.set(true);
    this.savService.getAllDeliveries().subscribe({
      next: (data) => { this.deliveries.set(data); this.isLoading.set(false); },
      error: () => { this.toastService.error('Failed to load deliveries'); this.isLoading.set(false); }
    });
  }

  fetchDrivers() {
    this.userService.getAllUsers({ role: 'DELIVERY' as any }).subscribe({
      next: (res: any) => {
        let loadedUsers: User[] = [];
        if (res.content) loadedUsers = res.content;
        else if (res.users) loadedUsers = res.users;
        else if (Array.isArray(res)) loadedUsers = res;
        const deliveryAgents = loadedUsers.filter((u: any) => {
          if (Array.isArray(u.roles)) return u.roles.includes('DELIVERY');
          if (u.role) return u.role === 'DELIVERY';
          return false;
        });
        this.deliveryDrivers.set(deliveryAgents);
      },
      error: () => console.warn('Could not load drivers')
    });
  }

  fetchAdminNotifications() {
    this.notificationService.getMy().subscribe({
      next: (items) => {
        // Sort by createdAt descending, show latest 20
        const sorted = [...items].sort((a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ).slice(0, 20);
        this.adminNotifications.set(sorted as any);
      },
      error: () => {}
    });
  }

  toggleNotifPanel() {
    this.isNotifPanelOpen.set(!this.isNotifPanelOpen());
  }

  markNotifAsRead(notifId: string) {
    this.notificationService.markAsRead(notifId).subscribe({
      next: () => this.fetchAdminNotifications(),
      error: () => {}
    });
  }

  getDriverName(userId: string): string {
    if (!userId || userId === 'pending') return 'Unassigned';
    const driver = this.deliveryDrivers().find(u => u.id === userId);
    return driver ? `${driver.firstName} ${driver.lastName}` : 'Unregistered Agent';
  }

  getDriverAvatar(userId: string): string {
    if (!userId || userId === 'pending') return '';
    const driver = this.deliveryDrivers().find(u => u.id === userId);
    const name = driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown';
    return driver?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=fca5a5&color=fff';
  }

  openDeliveryDetails(delivery: Delivery) {
    this.selectedDelivery.set(delivery);
    this.selectedStatus.set(delivery.status);
    this.selectedDriverId.set(delivery.userId || '');
    this.isViewModalOpen.set(true);
  }

  closeDeliveryDetails() {
    this.isViewModalOpen.set(false);
    this.selectedDelivery.set(null);
  }

  openAssignModal(delivery: Delivery, event: Event) {
    event.stopPropagation();
    this.selectedDelivery.set(delivery);
    this.selectedDriverId.set('');
    this.isDropdownOpen.set(false);
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal() {
    this.isAssignModalOpen.set(false);
    this.selectedDelivery.set(null);
    this.isDropdownOpen.set(false);
  }

  toggleDropdown() { this.isDropdownOpen.set(!this.isDropdownOpen()); }
  selectDriver(driverId: string) { this.selectedDriverId.set(driverId); this.isDropdownOpen.set(false); }

  openCancelModal(delivery: Delivery, event: Event) {
    event.stopPropagation();
    this.selectedDelivery.set(delivery);
    this.cancelReason.set('');
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal() {
    this.isCancelModalOpen.set(false);
    this.selectedDelivery.set(null);
  }

  updateStatus(status: DeliveryStatus) {
    const delivery = this.selectedDelivery();
    if(!delivery) return;
    if (delivery.status === 'DELIVERED') return;
    this.savService.updateDeliveryStatus(delivery.id, status).subscribe({
      next: () => { this.toastService.success(`Status updated to ${status}`); this.fetchDeliveries(); this.selectedStatus.set(status); this.closeDeliveryDetails(); },
      error: () => this.toastService.error('Failed to update status')
    });
  }

  /**
   * Admin assigns a driver via the new /assign endpoint.
   * Triggers automatic notification to the driver.
   */
  assignDriver() {
    const delivery = this.selectedDelivery();
    const driverId = this.selectedDriverId();
    if (!delivery || !driverId) return;

    this.savService.assignDriver(delivery.id, driverId).subscribe({
      next: () => {
        const driverName = this.getDriverName(driverId);
        this.toastService.success(`🔔 ${driverName} has been notified of the assignment!`);
        this.fetchDeliveries();
        this.closeAssignModal();
      },
      error: (err) => {
        let msg = 'Failed to assign driver';
        if (err.error) msg = typeof err.error === 'string' ? err.error : (err.error.message || err.error.error || msg);
        this.toastService.error(`Error: ${msg}`);
      }
    });
  }

  /** Quick reassign from refused row — opens modal pre-cleared */
  reassignDelivery(delivery: Delivery, event: Event) {
    event.stopPropagation();
    this.openAssignModal(delivery, event);
  }

  cancelOrArchiveDelivery() {
    const delivery = this.selectedDelivery();
    if(!delivery) return;
    if (delivery.status === 'DELIVERED') {
      this.savService.deleteDelivery(delivery.id).subscribe({
        next: () => { this.toastService.success('Delivery archived successfully'); this.fetchDeliveries(); this.closeCancelModal(); },
        error: () => this.toastService.error('Archive failed')
      });
    } else {
      if (!this.cancelReason()) { this.toastService.warning('Please select a cancellation reason'); return; }
      this.savService.updateDeliveryStatus(delivery.id, 'RETURNED').subscribe({
        next: () => { this.toastService.success('Delivery Cancelled'); this.fetchDeliveries(); this.closeCancelModal(); },
        error: () => this.toastService.error('Cancellation failed')
      });
    }
  }

  exportData() {
    let csv = "ID,Order Number,Driver,Status,Address\n";
    this.filteredDeliveries().forEach(d => {
      csv += `${d.id},${this.formatOrderNumber(d.cartId, d.deliveryDate)},${this.getDriverName(d.userId)},${d.status},"${d.address}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'deliveries_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.toastService.success('Export finished successfully');
  }

  formatOrderNumber(cartId: string, deliveryDate?: string): string {
    if (!cartId) return 'ORD-UNKNOWN';
    const year = deliveryDate ? new Date(deliveryDate).getFullYear() : new Date().getFullYear();
    const shortHex = cartId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
    const padded = shortHex.padStart(5, '0');
    return `ORD-${year}-${padded}`;
  }

  isRefused(d: Delivery): boolean {
    return d.status === 'DRIVER_REFUSED';
  }

  getNotifIcon(notif: AppNotification): string {
    const title = notif.title || '';
    if (title.includes('Accepted') || title.includes('Delivered')) return '🟢';
    if (title.includes('DECLINED') || title.includes('declined')) return '🔴';
    if (title.includes('Assignment')) return '📦';
    return '🔔';
  }

  private initMap() {
    if (this.map) this.map.remove();
    if(!this.mapContainer) return;
    this.map = L.map(this.mapContainer.nativeElement).setView([33.8869, 9.5375], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(this.map);
    this.filteredDeliveries().forEach(d => {
      const coords = this.mockGeocode(d.address);
      const color = this.getStatusColor(d.status);
      const markerHtml = `<div class="custom-leaflet-marker" style="background-color: ${color}; width: 24px; height: 24px;"></div>`;
      const icon = L.divIcon({ html: markerHtml, className: 'dummy', iconSize: [24,24] });
      L.marker(coords as L.LatLngExpression, { icon }).addTo(this.map!)
        .bindPopup(`<div class="p-2"><h4 class="font-bold">Order: ${this.formatOrderNumber(d.cartId, d.deliveryDate)}</h4><p class="text-sm">Driver: ${this.getDriverName(d.userId)}</p><p class="text-sm">Status: ${d.status}</p></div>`);
    });
  }

  private mockGeocode(address: string): [number, number] {
    const defaultVal: [number, number] = [36.8, 10.18];
    if (!address) return defaultVal;
    const lower = address.toLowerCase();
    if (lower.includes('sfax')) return [34.74, 10.76];
    if (lower.includes('sousse')) return [35.82, 10.63];
    if (lower.includes('ariana')) return [36.86, 10.19];
    if (lower.includes('bizerte')) return [37.27, 9.87];
    if (lower.includes('nabeul')) return [36.45, 10.73];
    if (lower.includes('gabes')) return [33.88, 10.11];
    return [36.8 + (Math.random() - 0.5)*0.2, 10.18 + (Math.random() - 0.5)*0.2];
  }

  getStatusColorHex(status: string): string {
    switch (status) {
      case 'PREPARING': return '#f59e0b';
      case 'IN_TRANSIT': return '#3b82f6';
      case 'DELIVERED': return '#10b981';
      case 'RETURNED': return '#ef4444';
      case 'DRIVER_REFUSED': return '#dc2626';
      default: return '#6b7280';
    }
  }

  getStatusColor(status: string): string { return this.getStatusColorHex(status); }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PREPARING': return 'bg-amber-100 text-amber-800';
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'RETURNED': return 'bg-red-100 text-red-800';
      case 'DRIVER_REFUSED': return 'bg-red-200 text-red-900 font-extrabold';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
