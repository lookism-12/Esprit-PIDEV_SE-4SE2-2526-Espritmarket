import { Component, OnInit, OnDestroy, signal, computed, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavService } from '../../core/services/sav.service';
import { DeliveryEtaService } from '../../core/services/delivery-eta.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../../front/core/user.service';
import { NotificationService } from '../../../front/core/notification.service';
import { Delivery, DeliveryStatus, DeliveryRequest } from '../../core/models/sav.models';
import { DeliveryEtaPrediction } from '../../core/models/delivery-eta.models';
import { User } from '../../../front/models/user.model';
import { AppNotification } from '../../../front/models/notification.model';
import * as L from 'leaflet';

interface SmartDriverCandidate {
  driver: User;
  coords: [number, number];
  distanceKm: number;
  activeCount: number;
  deliveredCount: number;
  refusedCount: number;
  sameZone: boolean;
  score: number;
  rank: number;
  reason: string;
}

interface DeliveryZoneDefinition {
  key: string;
  coords: [number, number];
  aliases: string[];
}

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
  private deliveryEtaService = inject(DeliveryEtaService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  // Data signals
  readonly deliveries = signal<Delivery[]>([]);
  readonly deliveryDrivers = signal<User[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly etaLoadingId = signal<string>('');
  readonly etaPredictions = signal<Map<string, DeliveryEtaPrediction>>(new Map());
  readonly adminNotifications = signal<AppNotification[]>([]);
  readonly isNotifPanelOpen = signal<boolean>(false);

  // Filters
  readonly searchTerm = signal<string>('');
  readonly filterStatus = signal<string>('ALL');
  readonly viewMode = signal<'LIST' | 'MAP'>('LIST');
  readonly showHiddenDeliveries = signal<boolean>(false);
  readonly hiddenDeliveryIds = signal<Set<string>>(new Set());
  private readonly hiddenDeliveriesStorageKey = 'admin.deliveries.hiddenIds';
  private readonly greaterTunisZoneKeys = ['grand tunis', 'tunis', 'ariana', 'ben arous', 'manouba'];
  private readonly deliveryZoneDefinitions: DeliveryZoneDefinition[] = [
    { key: 'grand tunis', coords: [36.8065, 10.1815], aliases: ['grand tunis', 'greater tunis', 'grand tunisie', 'tunis capitale'] },
    { key: 'la marsa', coords: [36.8782, 10.3247], aliases: ['la marsa', 'marsa'] },
    { key: 'carthage', coords: [36.8528, 10.3233], aliases: ['carthage', 'kartaj'] },
    { key: 'sidi bou said', coords: [36.8702, 10.3417], aliases: ['sidi bou said', 'sidi bousaid', 'sidi bou saïd'] },
    { key: 'tunis', coords: [36.8065, 10.1815], aliases: ['tunis', 'centre ville tunis', 'lac 1', 'lac1', 'lac 2', 'lac2', 'charguia'] },
    { key: 'ariana', coords: [36.8665, 10.1647], aliases: ['ariana', 'raoued', 'soukra', 'la soukra', 'mnihla'] },
    { key: 'ben arous', coords: [36.7435, 10.2319], aliases: ['ben arous', 'rades', 'radès', 'megrine', 'mourouj', 'ezzahra'] },
    { key: 'manouba', coords: [36.808, 10.0972], aliases: ['manouba', 'mannouba', 'den den', 'douar hicher'] },
    { key: 'nabeul', coords: [36.4513, 10.7353], aliases: ['nabeul', 'nabel'] },
    { key: 'korba', coords: [36.5786, 10.8583], aliases: ['korba'] },
    { key: 'hammamet', coords: [36.4001, 10.6167], aliases: ['hammamet', 'yasmine hammamet'] },
    { key: 'bizerte', coords: [37.2744, 9.8739], aliases: ['bizerte', 'bizert', 'benzart', 'banzart', 'bizerte nord', 'bizerte sud', 'menzel bourguiba', 'ras jebel'] },
    { key: 'sousse', coords: [35.8245, 10.6346], aliases: ['sousse', 'susa', 'sahloul', 'khezama', 'akouda'] },
    { key: 'monastir', coords: [35.7643, 10.8113], aliases: ['monastir', 'mestir', 'ksar hellal'] },
    { key: 'mahdia', coords: [35.5047, 11.0622], aliases: ['mahdia', 'chebba'] },
    { key: 'sfax', coords: [34.7406, 10.7603], aliases: ['sfax', 'safax', 'sfax ville', 'sfax nord', 'sfax sud', 'sakiet ezzit', 'sakiet eddaier', 'chihia', 'agareb', 'mahares', 'jebeniana', 'thyna', 'route gremda', 'route tunis sfax', 'route mahdia sfax'] },
    { key: 'kairouan', coords: [35.6781, 10.0963], aliases: ['kairouan', 'kairwan'] },
    { key: 'sidi bouzid', coords: [35.0382, 9.4858], aliases: ['sidi bouzid', 'sidi bou zid'] },
    { key: 'kasserine', coords: [35.1676, 8.8365], aliases: ['kasserine', 'gasrine'] },
    { key: 'gafsa', coords: [34.425, 8.7842], aliases: ['gafsa', 'gafsa ville'] },
    { key: 'gabes', coords: [33.8881, 10.0975], aliases: ['gabes', 'gabès', 'matmata'] },
    { key: 'medenine', coords: [33.3549, 10.5055], aliases: ['medenine', 'médenine', 'mednine', 'djerba', 'houmt souk'] },
    { key: 'tataouine', coords: [32.9297, 10.4518], aliases: ['tataouine', 'tatawin'] },
    { key: 'kebili', coords: [33.7044, 8.969], aliases: ['kebili', 'kébili', 'douz'] },
    { key: 'tozeur', coords: [33.9197, 8.1335], aliases: ['tozeur', 'touzeur', 'nefta'] },
    { key: 'beja', coords: [36.7256, 9.1817], aliases: ['beja', 'béja'] },
    { key: 'jendouba', coords: [36.5011, 8.7802], aliases: ['jendouba', 'tabarka'] },
    { key: 'kef', coords: [36.1822, 8.7148], aliases: ['kef', 'le kef'] },
    { key: 'siliana', coords: [36.0833, 9.3667], aliases: ['siliana'] },
    { key: 'zaghouan', coords: [36.4029, 10.1429], aliases: ['zaghouan', 'zaghwen'] }
  ];
  private readonly zoneCoordinates: Record<string, [number, number]> = this.deliveryZoneDefinitions.reduce((acc, zone) => {
    acc[zone.key] = zone.coords;
    return acc;
  }, {} as Record<string, [number, number]>);

  // Modal / Selected states
  readonly selectedDelivery = signal<Delivery | null>(null);
  readonly isViewModalOpen = signal<boolean>(false);
  readonly isAssignModalOpen = signal<boolean>(false);
  readonly isCancelModalOpen = signal<boolean>(false);
  readonly isAiInsightsModalOpen = signal<boolean>(false);
  readonly isDropdownOpen = signal<boolean>(false);
  
  // Action states
  readonly selectedDriverId = signal<string>('');
  readonly selectedStatus = signal<DeliveryStatus>('PREPARING');
  readonly cancelReason = signal<string>('');
  
  // Map logic
  @ViewChild('map', { static: false }) mapContainer!: ElementRef;
  @ViewChild('assignMap', { static: false }) assignMapContainer!: ElementRef;
  private map: L.Map | undefined;
  private assignMap: L.Map | undefined;
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
      const isHidden = this.hiddenDeliveryIds().has(d.id);
      if (isHidden && !this.showHiddenDeliveries()) return false;

      const matchesSearch = d.address?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
                            d.cartId?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
                            d.id?.toLowerCase().includes(this.searchTerm().toLowerCase());
      const matchesStatus = this.filterStatus() === 'ALL' || d.status === this.filterStatus();
      return matchesSearch && matchesStatus;
    });
  });

  readonly hiddenCount = computed(() => this.hiddenDeliveryIds().size);
  readonly visibleCount = computed(() => this.filteredDeliveries().length);
  readonly smartDriverCandidates = computed<SmartDriverCandidate[]>(() => {
    const delivery = this.selectedDelivery();
    if (!delivery) return [];

    const orderCoords = this.getDeliveryCoordinates(delivery);
    return this.deliveryDrivers()
      .map(driver => {
        const coords = this.getDriverCoordinates(driver);
        const distanceKm = this.calculateDistanceKm(orderCoords, coords);
        const activeCount = this.getAgentActiveDeliveries(driver.id);
        const deliveredCount = this.getAgentDeliveredCount(driver.id);
        const refusedCount = this.getAgentRefusedCount(driver.id);
        const sameZone = this.isDriverInDeliveryZone(delivery.address, driver);
        const score = Math.max(1, Math.min(99, Math.round(
          100
          - distanceKm * 1.7
          - activeCount * 8
          - refusedCount * 10
          + Math.min(deliveredCount, 20) * 0.7
          + (sameZone ? 12 : 0)
        )));

        const candidate: SmartDriverCandidate = {
          driver,
          coords,
          distanceKm,
          activeCount,
          deliveredCount,
          refusedCount,
          sameZone,
          score,
          rank: 0,
          reason: ''
        };
        candidate.reason = this.buildCandidateReason(candidate);
        return candidate;
      })
      .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm || a.activeCount - b.activeCount)
      .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  });
  readonly bestCandidate = computed(() => this.smartDriverCandidates()[0] || null);
  readonly selectedCandidate = computed(() => {
    const selectedId = this.selectedDriverId();
    return this.smartDriverCandidates().find(candidate => candidate.driver.id === selectedId) || null;
  });

  ngOnInit(): void {
    this.loadHiddenDeliveries();
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
    this.destroyAssignMap();
  }

  toggleViewMode(mode: 'LIST' | 'MAP') {
    this.viewMode.set(mode);
    if(mode === 'MAP') setTimeout(() => this.initMap(), 100);
  }

  private loadHiddenDeliveries() {
    try {
      const stored = localStorage.getItem(this.hiddenDeliveriesStorageKey);
      const ids = stored ? JSON.parse(stored) : [];
      this.hiddenDeliveryIds.set(new Set(Array.isArray(ids) ? ids : []));
    } catch {
      this.hiddenDeliveryIds.set(new Set());
    }
  }

  private persistHiddenDeliveries(ids: Set<string>) {
    localStorage.setItem(this.hiddenDeliveriesStorageKey, JSON.stringify([...ids]));
  }

  hideDelivery(delivery: Delivery, event: Event) {
    event.stopPropagation();
    const next = new Set(this.hiddenDeliveryIds());
    next.add(delivery.id);
    this.hiddenDeliveryIds.set(next);
    this.persistHiddenDeliveries(next);
    this.toastService.success('Order hidden from this view');
  }

  restoreDelivery(delivery: Delivery, event: Event) {
    event.stopPropagation();
    const next = new Set(this.hiddenDeliveryIds());
    next.delete(delivery.id);
    this.hiddenDeliveryIds.set(next);
    this.persistHiddenDeliveries(next);
  }

  toggleHiddenDeliveries() {
    this.showHiddenDeliveries.set(!this.showHiddenDeliveries());
  }

  restoreAllHiddenDeliveries() {
    this.hiddenDeliveryIds.set(new Set());
    this.persistHiddenDeliveries(new Set());
    this.toastService.success('Hidden orders restored');
  }

  fetchDeliveries() {
    this.isLoading.set(true);
    this.savService.getAllDeliveries().subscribe({
      next: (data) => { 
        this.deliveries.set(data); 
        this.isLoading.set(false); 
      },
      error: (err) => { 
        console.error('❌ Failed to load deliveries:', err);
        this.isLoading.set(false);
        // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.toastService.error('Failed to load deliveries');
        }, 0);
      }
    });
  }

  fetchDrivers() {
    this.userService.getAllUsers({ role: 'DELIVERY' as any, limit: 500 }).subscribe({
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
        if (this.isAssignModalOpen()) {
          setTimeout(() => {
            if (!this.selectedDriverId()) this.selectBestDriver(false, false);
            this.initAssignMap();
          }, 80);
        }
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
    this.loadLatestEta(delivery.id);
  }

  closeDeliveryDetails() {
    this.isViewModalOpen.set(false);
    this.selectedDelivery.set(null);
  }

  openAiInsightsModal(event?: Event) {
    if (event) event.stopPropagation();
    this.isAiInsightsModalOpen.set(true);
  }

  closeAiInsightsModal() {
    this.isAiInsightsModalOpen.set(false);
  }

  openAssignModal(delivery: Delivery, event: Event) {
    event.stopPropagation();
    this.selectedDelivery.set(delivery);
    this.selectedDriverId.set('');
    this.isDropdownOpen.set(false);
    this.isAssignModalOpen.set(true);
    setTimeout(() => {
      this.selectBestDriver(false, false);
      this.initAssignMap();
    }, 120);
  }

  predictEta(delivery: Delivery, event?: Event) {
    event?.stopPropagation();
    this.etaLoadingId.set(delivery.id);
    this.deliveryEtaService.predict(delivery.id).subscribe({
      next: (prediction) => {
        this.upsertEtaPrediction(prediction);
        this.etaLoadingId.set('');
        this.toastService.success(`AI ETA ready: ${prediction.estimatedMinutes} min - ${prediction.riskLevel}`);
      },
      error: (err) => {
        this.etaLoadingId.set('');
        const msg = err.error?.message || 'AI ETA prediction failed';
        this.toastService.error(msg);
      }
    });
  }

  loadLatestEta(deliveryId: string) {
    this.deliveryEtaService.latest(deliveryId).subscribe({
      next: (prediction) => this.upsertEtaPrediction(prediction),
      error: () => {}
    });
  }

  getEta(deliveryId: string): DeliveryEtaPrediction | undefined {
    return this.etaPredictions().get(deliveryId);
  }

  getRiskBadgeClass(risk?: string): string {
    switch (risk) {
      case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'HIGH': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  }

  private upsertEtaPrediction(prediction: DeliveryEtaPrediction) {
    if (!prediction?.deliveryId) return;
    const next = new Map(this.etaPredictions());
    next.set(prediction.deliveryId, prediction);
    this.etaPredictions.set(next);
  }

  closeAssignModal() {
    this.isAssignModalOpen.set(false);
    this.selectedDelivery.set(null);
    this.isDropdownOpen.set(false);
    this.destroyAssignMap();
  }

  toggleDropdown() { this.isDropdownOpen.set(!this.isDropdownOpen()); }
  selectDriver(driverId: string) {
    this.selectedDriverId.set(driverId);
    this.isDropdownOpen.set(false);
    this.refreshAssignMap();
  }

  selectBestDriver(showToast = true, refreshMap = true) {
    const best = this.bestCandidate();
    if (!best) return;
    this.selectedDriverId.set(best.driver.id);
    if (showToast) {
      this.toastService.info(`${this.getDriverName(best.driver.id)} selected as the closest smart match`);
    }
    if (refreshMap) this.refreshAssignMap();
  }

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
    if (delivery.status === 'DELIVERED' || delivery.status === 'RETURNED') return;
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
    if (delivery.status === 'DELIVERED' || delivery.status === 'RETURNED') {
      this.toastService.warning('This delivery is locked and cannot be reassigned.');
      return;
    }

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
    if (delivery.status === 'DELIVERED' || delivery.status === 'RETURNED') {
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

  getDriverZone(driver: User): string {
    return driver.deliveryZone || 'Zone not configured';
  }

  getDriverVehicle(driver: User): string {
    return driver.vehicleType || 'Vehicle not set';
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
    return `${distanceKm.toFixed(1)} km`;
  }

  getCandidateBadgeClass(candidate: SmartDriverCandidate): string {
    if (candidate.driver.id === this.selectedDriverId()) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (candidate.rank === 1) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (candidate.sameZone) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  private getDeliveryCoordinates(delivery: Delivery): [number, number] {
    return this.getCoordinatesFromObject(delivery) || this.mockGeocode(delivery.address);
  }

  private getDriverCoordinates(driver: User): [number, number] {
    const zoneCoords = this.findZoneCoordinates(driver.deliveryZone || '');
    const explicitCoords = this.getCoordinatesFromObject(driver);

    // The admin assignment map is zone-first: stale or browser-based live coordinates
    // should not move a Sfax/Bizerte courier into another governorate.
    const baseCoords = zoneCoords || (explicitCoords && this.hasFreshDriverLocation(driver) ? explicitCoords : null) || this.zoneCoordinates['grand tunis'];
    return this.withDeterministicJitter(baseCoords, driver.id || driver.email || `${driver.firstName}-${driver.lastName}`, zoneCoords ? 0.012 : 0.055);
  }

  private hasFreshDriverLocation(driver: User): boolean {
    if (!driver.lastLocationUpdatedAt) return false;
    const updatedAt = new Date(driver.lastLocationUpdatedAt).getTime();
    if (!Number.isFinite(updatedAt)) return false;
    const sixHoursMs = 6 * 60 * 60 * 1000;
    return Date.now() - updatedAt <= sixHoursMs;
  }

  private getCoordinatesFromObject(source: any): [number, number] | null {
    if (!source) return null;
    const coordinatePairs = [
      ['latitude', 'longitude'],
      ['lat', 'lng'],
      ['currentLatitude', 'currentLongitude'],
      ['currentLat', 'currentLng'],
      ['deliveryLatitude', 'deliveryLongitude']
    ];

    for (const [latKey, lngKey] of coordinatePairs) {
      const lat = this.toFiniteNumber(source[latKey]);
      const lng = this.toFiniteNumber(source[lngKey]);
      if (lat !== null && lng !== null && this.isUsableTunisiaCoordinate(lat, lng)) return [lat, lng];
    }
    return null;
  }

  private toFiniteNumber(value: unknown): number | null {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private isUsableTunisiaCoordinate(lat: number, lng: number): boolean {
    if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
    return lat >= 30 && lat <= 38.5 && lng >= 7 && lng <= 12.5;
  }

  private calculateDistanceKm(from: [number, number], to: [number, number]): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(to[0] - from[0]);
    const dLng = this.toRadians(to[1] - from[1]);
    const fromLat = this.toRadians(from[0]);
    const toLat = this.toRadians(to[0]);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(fromLat) * Math.cos(toLat) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(value: number): number {
    return value * Math.PI / 180;
  }

  private getAgentActiveDeliveries(driverId: string): number {
    return this.deliveries().filter(delivery =>
      (delivery.userId === driverId || delivery.pendingDriverId === driverId) &&
      (delivery.status === 'PREPARING' || delivery.status === 'IN_TRANSIT')
    ).length;
  }

  private getAgentDeliveredCount(driverId: string): number {
    return this.deliveries().filter(delivery => delivery.userId === driverId && delivery.status === 'DELIVERED').length;
  }

  private getAgentRefusedCount(driverId: string): number {
    return this.deliveries().filter(delivery =>
      delivery.declinedByDriverId === driverId ||
      (delivery.status === 'DRIVER_REFUSED' && delivery.userId === driverId)
    ).length;
  }

  private isDriverInDeliveryZone(address: string, driver: User): boolean {
    const addressZone = this.resolveZoneKey(address);
    const driverZone = this.resolveZoneKey(driver.deliveryZone || '');
    if (!addressZone || !driverZone) return false;
    if (addressZone === driverZone) return true;
    return this.greaterTunisZoneKeys.includes(addressZone) && this.greaterTunisZoneKeys.includes(driverZone);
  }

  private buildCandidateReason(candidate: SmartDriverCandidate): string {
    const workload = candidate.activeCount === 0 ? 'free now' : `${candidate.activeCount} active`;
    const zone = candidate.sameZone ? 'same zone' : this.getDriverZone(candidate.driver);
    return `${this.formatDistance(candidate.distanceKm)} away - ${workload} - ${zone}`;
  }

  private refreshAssignMap() {
    if (!this.isAssignModalOpen()) return;
    setTimeout(() => this.initAssignMap(), 60);
  }

  private initAssignMap() {
    this.destroyAssignMap();
    const delivery = this.selectedDelivery();
    if (!delivery || !this.assignMapContainer) return;

    const orderCoords = this.getDeliveryCoordinates(delivery);
    this.assignMap = L.map(this.assignMapContainer.nativeElement, { zoomControl: true }).setView(orderCoords, 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(this.assignMap);

    const bounds = L.latLngBounds([orderCoords]);
    L.circle(orderCoords, {
      radius: 12000,
      color: '#2563eb',
      weight: 1,
      fillColor: '#3b82f6',
      fillOpacity: 0.08
    }).addTo(this.assignMap);

    L.marker(orderCoords, { icon: this.createAssignmentMarkerIcon('O', '#dc2626', 38) })
      .addTo(this.assignMap)
      .bindPopup(`<strong>Order</strong><br>${this.escapeHtml(this.formatOrderNumber(delivery.cartId, delivery.deliveryDate))}<br>${this.escapeHtml(delivery.address)}`);

    this.smartDriverCandidates().forEach(candidate => {
      const isSelected = candidate.driver.id === this.selectedDriverId();
      const color = isSelected ? '#059669' : candidate.rank === 1 ? '#f59e0b' : '#2563eb';
      bounds.extend(candidate.coords);
      L.marker(candidate.coords, { icon: this.createAssignmentMarkerIcon(String(candidate.rank), color, isSelected ? 38 : 32) })
        .addTo(this.assignMap!)
        .bindPopup(`
          <strong>${this.escapeHtml(this.getDriverName(candidate.driver.id))}</strong><br>
          Score: ${candidate.score}/100<br>
          Distance: ${this.escapeHtml(this.formatDistance(candidate.distanceKm))}<br>
          Zone: ${this.escapeHtml(this.getDriverZone(candidate.driver))}
        `);
    });

    if (bounds.isValid()) {
      this.assignMap.fitBounds(bounds.pad(0.2), { maxZoom: 12 });
    }
    setTimeout(() => this.assignMap?.invalidateSize(), 100);
  }

  private destroyAssignMap() {
    if (!this.assignMap) return;
    this.assignMap.remove();
    this.assignMap = undefined;
  }

  private createAssignmentMarkerIcon(label: string, color: string, size: number): L.DivIcon {
    const html = `
      <div style="
        width:${size}px;height:${size}px;border-radius:999px;background:${color};
        border:3px solid #fff;box-shadow:0 12px 22px rgba(15,23,42,.25);
        display:flex;align-items:center;justify-content:center;color:#fff;
        font-weight:800;font-size:12px;">
        ${this.escapeHtml(label)}
      </div>
    `;
    return L.divIcon({
      html,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
    const defaultVal: [number, number] = this.zoneCoordinates['grand tunis'];
    if (!address) return defaultVal;
    const zoneCoords = this.findZoneCoordinates(address);
    if (zoneCoords) return zoneCoords;
    return this.withDeterministicJitter(defaultVal, address, 0.11);
  }

  private findZoneCoordinates(value: string): [number, number] | null {
    const zoneKey = this.resolveZoneKey(value);
    return zoneKey ? this.zoneCoordinates[zoneKey] : null;
  }

  private resolveZoneKey(value: string): string | null {
    const normalized = this.normalizeLocationText(value);
    if (!normalized) return null;
    const candidates = this.deliveryZoneDefinitions
      .flatMap((zone, zoneIndex) => [zone.key, ...zone.aliases].map(alias => ({
        key: zone.key,
        zoneIndex,
        alias: this.normalizeLocationText(alias)
      })))
      .filter(item => item.alias && this.containsLocationAlias(normalized, item.alias))
      .sort((a, b) => b.alias.length - a.alias.length || a.zoneIndex - b.zoneIndex);

    return candidates[0]?.key || null;
  }

  private containsLocationAlias(text: string, alias: string): boolean {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s)${escapedAlias}($|\\s)`).test(text);
  }

  private normalizeLocationText(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private withDeterministicJitter(base: [number, number], seed: string, amount: number): [number, number] {
    return [
      Number((base[0] + this.deterministicOffset(seed, 17, amount)).toFixed(5)),
      Number((base[1] + this.deterministicOffset(seed, 53, amount)).toFixed(5))
    ];
  }

  private deterministicOffset(seed: string, salt: number, amount: number): number {
    let hash = salt;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 1000003;
    }
    return ((hash % 2000) / 1000 - 1) * amount;
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
