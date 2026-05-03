import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../front/core/notification.service';
import { AppNotification, NotificationType } from '../../../front/models/notification.model';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class AdminNotificationsComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  readonly notifications       = signal<AppNotification[]>([]);
  readonly allNotificationsRaw = signal<AppNotification[]>([]);
  readonly isLoading           = signal(true);
  readonly isSending           = signal(false);

  // ── Broadcast modal ───────────────────────────────────────────────────────
  readonly showBroadcastModal = signal(false);
  readonly broadcastTitle     = signal('');
  readonly broadcastMessage   = signal('');
  readonly broadcastType      = signal<NotificationType>(NotificationType.EXTERNAL_NOTIFICATION);

  readonly broadcastTypes: { value: NotificationType; label: string; icon: string }[] = [
    { value: NotificationType.EXTERNAL_NOTIFICATION, label: 'External',  icon: '📢' },
    { value: NotificationType.INTERNAL_NOTIFICATION, label: 'Internal',  icon: '🔔' },
    { value: NotificationType.SYSTEM,                label: 'System',    icon: '⚙️' },
    { value: NotificationType.PROMOTION,             label: 'Promotion', icon: '🎁' },
    { value: NotificationType.RIDE_UPDATE,           label: 'Ride',      icon: '🚗' },
  ];

  // ── Filters ───────────────────────────────────────────────────────────────
  readonly searchTerm   = signal('');
  readonly typeFilter   = signal('');       // '' = all
  readonly statusFilter = signal('');       // '' | 'read' | 'unread'
  readonly dateFilter   = signal('');       // '' | 'today' | 'week' | 'month'
  readonly sortDir      = signal<'desc' | 'asc'>('desc');

  // ── Stats (computed from raw list) ────────────────────────────────────────
  readonly totalCount  = computed(() => this.notifications().length);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  readonly readCount   = computed(() => this.notifications().filter(n =>  n.read).length);
  readonly todayCount  = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.notifications().filter(n => n.createdAt && new Date(n.createdAt) >= today).length;
  });

  // Types that actually exist in the data (for the chip bar)
  readonly availableTypes = computed(() =>
    [...new Set(this.notifications().map(n => n.type).filter(Boolean))].sort()
  );

  // Count per type (for badges on chips)
  readonly countByType = computed(() => {
    const map: Record<string, number> = {};
    this.notifications().forEach(n => { map[n.type] = (map[n.type] ?? 0) + 1; });
    return map;
  });

  // ── Filtered + sorted list ────────────────────────────────────────────────
  readonly visibleNotifications = computed(() => {
    const q    = this.searchTerm().toLowerCase().trim();
    const type = this.typeFilter();
    const st   = this.statusFilter();
    const df   = this.dateFilter();

    const now   = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const week  = new Date(now); week.setDate(now.getDate() - 7);
    const month = new Date(now); month.setDate(now.getDate() - 30);

    const filtered = this.notifications().filter(n => {
      const text = `${n.title ?? ''} ${n.description ?? n.message ?? ''}`.toLowerCase();
      if (q    && !text.includes(q))                                    return false;
      if (type && n.type !== type)                                       return false;
      if (st === 'read'   &&  n.read === false)                          return false;
      if (st === 'unread' && (n.read === true || n.read === undefined))  return false;
      if (df && n.createdAt) {
        const d = new Date(n.createdAt);
        if (df === 'today' && d < today)  return false;
        if (df === 'week'  && d < week)   return false;
        if (df === 'month' && d < month)  return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return this.sortDir() === 'desc' ? tb - ta : ta - tb;
    });
  });

  readonly hasActiveFilters = computed(() =>
    !!(this.searchTerm() || this.typeFilter() || this.statusFilter() || this.dateFilter() || this.sortDir() !== 'desc')
  );

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void { this.loadGlobalNotifications(); }

  loadGlobalNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getAllAdmin().subscribe({
      next: (res) => {
        this.allNotificationsRaw.set(res);
        // Deduplicate by title+message+type for the display list
        const seen = new Set<string>();
        const deduped = res.filter(n => {
          const key = `${n.title}__${n.description || n.message}__${n.type}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        this.notifications.set(deduped);
        this.isLoading.set(false);
      },
      error: (err) => { console.error('Failed to load notifications', err); this.isLoading.set(false); }
    });
  }

  // ── Filter helpers ────────────────────────────────────────────────────────
  setTypeFilter(type: string): void {
    this.typeFilter.set(this.typeFilter() === type ? '' : type);
  }

  setStatusFilter(s: string): void {
    this.statusFilter.set(this.statusFilter() === s ? '' : s);
  }

  setDateFilter(d: string): void {
    this.dateFilter.set(this.dateFilter() === d ? '' : d);
  }

  toggleSort(): void {
    this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.typeFilter.set('');
    this.statusFilter.set('');
    this.dateFilter.set('');
    this.sortDir.set('desc');
  }

  // ── Broadcast ─────────────────────────────────────────────────────────────
  openBroadcast(): void { this.showBroadcastModal.set(true); }

  closeBroadcast(): void {
    this.showBroadcastModal.set(false);
    this.broadcastTitle.set('');
    this.broadcastMessage.set('');
    this.broadcastType.set(NotificationType.EXTERNAL_NOTIFICATION);
  }

  sendBroadcast(): void {
    if (!this.broadcastTitle() || !this.broadcastMessage() || this.isSending()) return;
    this.isSending.set(true);
    const payload: Partial<AppNotification> = {
      title:       this.broadcastTitle(),
      description: this.broadcastMessage(),
      type:        this.broadcastType()
    };
    this.notificationService.broadcast(payload).subscribe({
      next:  () => { this.isSending.set(false); this.closeBroadcast(); this.loadGlobalNotifications(); },
      error: (err) => { console.error('Broadcast failed', err); this.isSending.set(false); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getRecipientCount(n: AppNotification): number {
    return this.allNotificationsRaw().filter(r =>
      r.title === n.title &&
      (r.description || r.message) === (n.description || n.message) &&
      r.type === n.type
    ).length;
  }

  getTypeMeta(type: string): { icon: string; cls: string; label: string } {
    const map: Record<string, { icon: string; cls: string; label: string }> = {
      EXTERNAL_NOTIFICATION: { icon: '📢', cls: 'bg-blue-50 text-blue-700 border-blue-100',     label: 'External'  },
      INTERNAL_NOTIFICATION: { icon: '🔔', cls: 'bg-purple-50 text-purple-700 border-purple-100', label: 'Internal'  },
      PROMOTION:             { icon: '🎁', cls: 'bg-amber-50 text-amber-700 border-amber-100',   label: 'Promotion' },
      ORDER_CONFIRMATION:    { icon: '📦', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Order'  },
      SYSTEM:                { icon: '⚙️', cls: 'bg-gray-100 text-gray-600 border-gray-200',     label: 'System'    },
      RIDE_UPDATE:           { icon: '🚗', cls: 'bg-sky-50 text-sky-700 border-sky-100',         label: 'Ride'      },
      NEGOTIATION_UPDATE:    { icon: '🤝', cls: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Negotiation' },
      COUPON_ALERT:          { icon: '🎫', cls: 'bg-pink-50 text-pink-700 border-pink-100',      label: 'Coupon'    },
    };
    return map[type] ?? { icon: '🔔', cls: 'bg-gray-100 text-gray-600 border-gray-200', label: type };
  }
}
