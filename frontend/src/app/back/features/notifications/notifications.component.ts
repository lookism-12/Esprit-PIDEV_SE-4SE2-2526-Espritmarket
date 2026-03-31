import { Component, OnInit, signal } from '@angular/core';
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
export class NotificationsComponent implements OnInit {
  notifications = signal<AppNotification[]>([]);
  allNotificationsRaw = signal<AppNotification[]>([]);
  isLoading = signal<boolean>(true);
  isSending = signal<boolean>(false);
  
  // Broadcast Form State
  showBroadcastModal = signal<boolean>(false);
  broadcastTitle = signal<string>('');
  broadcastMessage = signal<string>('');

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadGlobalNotifications();
  }

  loadGlobalNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getAllAdmin().subscribe({
      next: (res) => {
        this.allNotificationsRaw.set(res);
        // Deduplicate: one row per broadcast (same title+description = same broadcast)
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
      error: (err) => {
        console.error('Failed to load global notifications', err);
        this.isLoading.set(false);
      }
    });
  }

  openBroadcast(): void {
    this.showBroadcastModal.set(true);
  }

  closeBroadcast(): void {
    this.showBroadcastModal.set(false);
    this.broadcastTitle.set('');
    this.broadcastMessage.set('');
  }

  sendBroadcast(): void {
    if (!this.broadcastTitle() || !this.broadcastMessage() || this.isSending()) return;
    
    this.isSending.set(true);
    const payload: Partial<AppNotification> = {
      title: this.broadcastTitle(),
      description: this.broadcastMessage(),
      type: NotificationType.EXTERNAL_NOTIFICATION
    };

    this.notificationService.broadcast(payload).subscribe({
      next: () => {
        this.isSending.set(false);
        this.closeBroadcast();
        this.loadGlobalNotifications();
      },
      error: (err) => {
        console.error('Broadcast failed', err);
        this.isSending.set(false);
      }
    });
  }

  getRecipientCount(notification: AppNotification): number {
    return this.allNotificationsRaw().filter(
      n => n.title === notification.title &&
           (n.description || n.message) === (notification.description || notification.message) &&
           n.type === notification.type
    ).length;
  }
}
