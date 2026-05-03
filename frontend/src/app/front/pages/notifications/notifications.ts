import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin, Subscription, catchError, of } from 'rxjs';
import { NotificationService } from '../../core/notification.service';
import { NegotiationService } from '../../core/negotiation.service';
import { CartService } from '../../core/cart.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationResponse, NotificationType } from '../../models/notification.model';
import { NotificationSettingsComponent } from './notification-settings.component';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

type FilterTab = 'all' | 'starred' | 'unread' | 'followed' | 'important' | 'settings';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NotificationSettingsComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications implements OnInit, OnDestroy {
  public readonly authService = inject(AuthService);
  notifications = signal<NotificationResponse[]>([]);
  isLoading = signal(true);
  activeFilter = signal<FilterTab>('all');
  selected = signal<NotificationResponse | null>(null);
  searchQuery = signal('');
  selectedIds = signal<string[]>([]);
  sortOrder = signal<'newest' | 'oldest'>('newest');

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  isSettingsTab = computed(() => this.activeFilter() === 'settings');

  filtered = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQuery().toLowerCase();
    let list = this.notifications();

    if (f === 'starred') {
      list = list.filter(n => n.isStarred);
    } else if (f === 'unread') {
      list = list.filter(n => !n.read);
    } else if (f === 'followed') {
      list = list.filter(n => n.isFollowed);
    } else if (f === 'important') {
      list = list.filter(n => n.type === 'INTERNAL_NOTIFICATION' || n.type?.includes('SYSTEM'));
    }

    if (q) {
      list = list.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        (n.message || n.description || '').toLowerCase().includes(q) ||
        this.getSenderName(n).toLowerCase().includes(q)
      );
    }

    // Sorting
    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return this.sortOrder() === 'newest' ? db - da : da - db;
    });
  });

  private wsSub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private negotiationService: NegotiationService,
    private cartService: CartService,
    public router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchNotifications();

    // Listen for query params to auto-open notifications (works even if already on page)
    this.route.queryParamMap.subscribe(params => {
      const targetId = params.get('id');
      if (targetId) {
        // Wait for notifications to load if they haven't yet
        if (!this.isLoading()) {
          const target = this.notifications().find(n => n.id === targetId);
          if (target) {
            this.open(target);
            // Clean the URL
            this.router.navigate([], { queryParams: {}, replaceUrl: true });
          }
        }
      }
    });
  }

  fetchNotifications(): void {
    this.notificationService.getMy().subscribe({
      next: res => {
        this.notifications.set(res || []);
        this.isLoading.set(false);
        this.connectWs();

        // Check if there's a pending ID in the URL to open
        const targetId = this.route.snapshot.queryParamMap.get('id');
        if (targetId) {
          const target = (res || []).find(n => n.id === targetId);
          if (target) {
            this.open(target);
            this.router.navigate([], { queryParams: {}, replaceUrl: true });
          }
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  private connectWs(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;
    this.wsSub = this.notificationService.connectToNotifications(userId).subscribe(incoming => {
      // Prepend only if not already present
      this.notifications.update(list =>
        list.some(n => n.id === incoming.id) ? list : [incoming, ...list]
      );
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.notificationService.disconnectWs();
  }

  open(n: NotificationResponse): void {
    this.selected.set(n);
    if (!n.read) this.markAsRead(n.id);
  }

  close(): void { this.selected.set(null); }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe(() => {
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
      if (this.selected()?.id === id) this.selected.update(n => n ? { ...n, read: true } : n);
    });
  }

  markAllRead(): void {
    const unreadIds = this.notifications().filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    // Fire all PATCH requests in parallel — no extra GET
    forkJoin(unreadIds.map(id => this.notificationService.markAsRead(id))).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    });
  }

  deleteNotification(id: string, event?: Event): void {
    event?.stopPropagation();
    this.notificationService.deactivate(id).subscribe(() => {
      this.notifications.update(list => list.filter(n => n.id !== id));
      if (this.selected()?.id === id) this.selected.set(null);
    });
  }

  switchTab(tab: FilterTab): void {
    this.activeFilter.set(tab);
    if (tab === 'settings') this.selected.set(null);
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  toggleSelection(id: string, event: Event): void {
    event.stopPropagation();
    this.selectedIds.update(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }

  isSelectionMode(): boolean { return this.selectedIds().length > 0; }
  
  clearSelection(): void { this.selectedIds.set([]); }

  selectAll(): void {
    const currentIds = this.filtered().map(n => n.id);
    this.selectedIds.set(currentIds);
  }

  bulkMarkRead(): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    this.notificationService.bulkRead(ids).subscribe(() => {
      this.notifications.update(list => list.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
      this.clearSelection();
    });
  }

  bulkDelete(): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    this.notificationService.bulkDelete(ids).subscribe(() => {
      this.notifications.update(list => list.filter(n => !ids.includes(n.id)));
      this.clearSelection();
    });
  }

  bulkStar(star: boolean): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    this.notificationService.bulkStar(ids, star).subscribe(() => {
      this.notifications.update(list => list.map(n => ids.includes(n.id) ? { ...n, isStarred: star } : n));
      this.clearSelection();
    });
  }

  toggleFavorite(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.toggleStar(id).subscribe(res => {
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, isStarred: res.isStarred } : n));
    });
  }

  toggleFollow(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.toggleFollow(id).subscribe(res => {
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, isFollowed: res.isFollowed } : n));
    });
  }

  isFavorite(id: string): boolean {
    return this.notifications().find(n => n.id === id)?.isStarred || false;
  }

  isFollowed(id: string): boolean {
    return this.notifications().find(n => n.id === id)?.isFollowed || false;
  }

  getSenderName(n: NotificationResponse): string {
    // Try to extract a name from title if it's in "Name: Subject" format
    if (n.title?.includes(':')) return n.title.split(':')[0];
    
    // Fallback to type-based labels
    return this.getLabel(n.type);
  }

  getInitials(n: NotificationResponse): string {
    const name = this.getSenderName(n);
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  getIcon(type: string): string {
    if (!type) return '🔔';
    if (type === 'INTERNAL_NOTIFICATION') return '💬';
    if (type === 'EXTERNAL_NOTIFICATION') return '📣';
    if (type === 'RIDE_UPDATE')           return '🚗';
    if (type.includes('ORDER'))           return '🧾';
    if (type.includes('NEGOTI'))          return '🤝';
    if (type.includes('PROMO'))           return '📣';
    if (type.includes('SYSTEM'))          return '⚙️';
    return '🔔';
  }

  getIconBg(type: string): string {
    if (!type) return '#fee2e2';
    if (type === 'INTERNAL_NOTIFICATION') return '#dbeafe';
    if (type === 'EXTERNAL_NOTIFICATION') return '#fce7f3';
    if (type === 'RIDE_UPDATE')           return '#dcfce7';
    if (type.includes('ORDER'))           return '#dcfce7';
    if (type.includes('NEGOTI'))          return '#fef3c7';
    if (type.includes('PROMO'))           return '#fce7f3';
    if (type.includes('SYSTEM'))          return '#f3f4f6';
    return '#fee2e2';
  }

  getLabel(type: string): string {
    if (!type) return 'Notification';
    if (type === 'INTERNAL_NOTIFICATION') return 'System';
    if (type === 'EXTERNAL_NOTIFICATION') return 'Promotion';
    if (type === 'RIDE_UPDATE')           return 'Ride';
    if (type.includes('ORDER'))           return 'Order';
    if (type.includes('NEGOTI'))          return 'Negotiation';
    if (type.includes('PROMO'))           return 'Promotion';
    if (type.includes('SYSTEM'))          return 'System';
    return 'Notification';
  }

  isToday(dateStr: string): boolean {
    const d = new Date(dateStr);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    if (this.isToday(dateStr)) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // --- Negotiation Actions ---

  isNegotiationExpired(n: NotificationResponse): boolean {
    const created = new Date(n.createdAt).getTime();
    const now = new Date().getTime();
    const hours24 = 24 * 60 * 60 * 1000;
    return (now - created) > hours24;
  }

  addToCartFromNegotiation(n: NotificationResponse, redirect = true): void {
    if (!n.linkedObjectId) return;
    
    this.toastService.info('Fetching offer details...');
    this.negotiationService.getNegotiationById(n.linkedObjectId).subscribe({
      next: (neg) => {
        const latest = neg.proposals[neg.proposals.length - 1];
        const productId = neg.productId || neg.serviceId;
        
        if (!productId) {
          this.toastService.error('Product information missing');
          return;
        }

        this.cartService.addItem({
          productId,
          quantity: 1,
          negotiatedPrice: latest.amount
        }).subscribe({
          next: () => {
            this.toastService.success('Added to cart at negotiated price!');
            if (redirect) this.router.navigate(['/cart']);
          },
          error: () => this.toastService.error('Failed to add to cart')
        });
      },
      error: () => this.toastService.error('Could not load negotiation details')
    });
  }

  buyNowFromNegotiation(n: NotificationResponse): void {
    if (!n.linkedObjectId) return;
    
    this.negotiationService.getNegotiationById(n.linkedObjectId).subscribe({
      next: (neg) => {
        const latest = neg.proposals[neg.proposals.length - 1];
        const productId = neg.productId || neg.serviceId;
        
        if (!productId) return;

        this.cartService.addItem({
          productId,
          quantity: 1,
          negotiatedPrice: latest.amount
        }).subscribe({
          next: () => {
            this.router.navigate(['/cart'], { queryParams: { step: 'PLACE_ORDER' } });
          }
        });
      }
    });
  }

  consultNegotiation(n: NotificationResponse): void {
    if (!n.linkedObjectId) return;
    this.router.navigate(['/profile/negotiations'], { 
      queryParams: { id: n.linkedObjectId } 
    });
  }

  downloadNegotiationPdf(negotiationId: string): void {
    this.negotiationService.downloadPdf(negotiationId);
  }
}
