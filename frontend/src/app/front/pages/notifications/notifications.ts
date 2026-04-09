import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../core/notification.service';
import { NotificationResponse } from '../../models/notification.model';

type FilterTab = 'all' | 'unread' | 'orders' | 'negotiations' | 'promotions' | 'system';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications implements OnInit {
  notifications = signal<NotificationResponse[]>([]);
  isLoading = signal(true);
  activeFilter = signal<FilterTab>('all');
  selected = signal<NotificationResponse | null>(null);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  filtered = computed(() => {
    const f = this.activeFilter();
    const all = this.notifications();
    if (f === 'unread') return all.filter(n => !n.read);
    if (f === 'orders') return all.filter(n => n.type?.includes('ORDER'));
    if (f === 'negotiations') return all.filter(n => n.type?.includes('NEGOTI'));
    if (f === 'promotions') return all.filter(n => n.type?.includes('PROMO'));
    if (f === 'system') return all.filter(n => n.type?.includes('SYSTEM') || n.type?.includes('INTERNAL'));
    return all;
  });

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getMy().subscribe({
      next: res => { this.notifications.set(res || []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
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
    this.notificationService.markAllAsRead().subscribe(() => {
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

  getIcon(type: string): string {
    if (type?.includes('ORDER')) return '🧾';
    if (type?.includes('NEGOTI')) return '🤝';
    if (type?.includes('PROMO')) return '📣';
    if (type?.includes('RIDE')) return '🚗';
    if (type?.includes('SYSTEM') || type?.includes('INTERNAL')) return '⚙️';
    return '🔔';
  }

  getIconBg(type: string): string {
    if (type?.includes('ORDER')) return '#dcfce7';
    if (type?.includes('NEGOTI')) return '#fef3c7';
    if (type?.includes('PROMO')) return '#fce7f3';
    if (type?.includes('RIDE')) return '#dbeafe';
    if (type?.includes('SYSTEM') || type?.includes('INTERNAL')) return '#f3f4f6';
    return '#fee2e2';
  }

  getLabel(type: string): string {
    if (type?.includes('ORDER')) return 'Order';
    if (type?.includes('NEGOTI')) return 'Negotiation';
    if (type?.includes('PROMO')) return 'Promotion';
    if (type?.includes('RIDE')) return 'Ride';
    if (type?.includes('SYSTEM') || type?.includes('INTERNAL')) return 'System';
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
}
