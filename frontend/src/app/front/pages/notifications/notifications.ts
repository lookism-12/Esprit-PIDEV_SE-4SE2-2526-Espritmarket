import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../core/notification.service';
import { NotificationResponse } from '../../models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications implements OnInit {
  notifications = signal<NotificationResponse[]>([]);
  isLoading = signal<boolean>(true);
  userId = signal<string>('');

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.load('me');
  }

  load(userId: string): void {
    if (!userId) return;
    this.userId.set(userId);
    this.isLoading.set(true);
    const request$ = userId === 'me'
      ? this.notificationService.getMy()
      : this.notificationService.getByUser(userId);
    request$.subscribe({
      next: (res) => {
        this.notifications.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.isLoading.set(false);
      }
    });
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe(() => {
      this.notifications.update(current => 
        current.map(n => n.id === id ? { ...n, read: true } : n)
      );
    });
  }

  deleteNotification(id: string): void {
    this.notificationService.deactivate(id).subscribe(() => {
      this.notifications.update(current => 
        current.filter(n => n.id !== id)
      );
    });
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'NEGOTIATION_UPDATE': return '🤝';
      case 'ORDER_CONFIRMATION': return '🧾';
      case 'PROMOTION': return '📣';
      case 'SYSTEM': return '⚙️';
      default: return '🔔';
    }
  }

}
