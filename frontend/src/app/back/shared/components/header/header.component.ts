import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { NotificationService } from '../../../../front/core/notification.service';
import { AppNotification } from '../../../../front/models/notification.model';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
    private adminAuthService = inject(AdminAuthService);
    private notificationService = inject(NotificationService);

    showProfileMenu = signal(false);
    showNotifPanel = signal(false);
    notifications = signal<AppNotification[]>([]);
    isLoadingNotifs = signal(false);

    readonly currentUser = this.adminAuthService.currentUser;

    readonly userName = computed(() => {
        const user = this.currentUser();
        return user ? `${user.firstName} ${user.lastName}` : 'Admin User';
    });

    readonly userEmail = computed(() => {
        const user = this.currentUser();
        return user?.email || 'admin@esprit.tn';
    });

    readonly userInitials = computed(() => {
        const user = this.currentUser();
        if (!user) return 'AU';
        return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    });

    readonly userAvatar = computed(() => {
        const user = this.currentUser();
        return user?.avatarUrl || 'assets/logo.png';
    });

    readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

    ngOnInit(): void {
        this.loadNotifications();
    }

    loadNotifications(): void {
        this.isLoadingNotifs.set(true);
        this.notificationService.getMy().subscribe({
            next: (items) => {
                const mapped = items.map((i: any) => ({
                    ...i,
                    message: i.description || i.message || '',
                    description: i.description || i.message || '',
                    active: i.notification_status ?? i.active ?? true
                })) as AppNotification[];
                this.notifications.set(mapped.slice(0, 20));
                this.isLoadingNotifs.set(false);
            },
            error: () => this.isLoadingNotifs.set(false)
        });
    }

    toggleNotifPanel(): void {
        this.showNotifPanel.update(v => !v);
        if (this.showNotifPanel()) {
            this.showProfileMenu.set(false);
            this.loadNotifications();
        }
    }

    markAsRead(notif: AppNotification, event: Event): void {
        event.stopPropagation();
        if (notif.read) return;
        this.notificationService.markAsRead(notif.id).subscribe({
            next: () => {
                this.notifications.update(list =>
                    list.map(n => n.id === notif.id ? { ...n, read: true } : n)
                );
            }
        });
    }

    markAllAsRead(): void {
        const unread = this.notifications().filter(n => !n.read);
        unread.forEach(n => this.notificationService.markAsRead(n.id).subscribe({
            next: () => this.notifications.update(list =>
                list.map(item => item.id === n.id ? { ...item, read: true } : item)
            )
        }));
    }

    toggleProfileMenu(): void {
        this.showProfileMenu.update(v => !v);
        if (this.showProfileMenu()) this.showNotifPanel.set(false);
    }

    logout(): void {
        this.adminAuthService.logout();
    }
}
