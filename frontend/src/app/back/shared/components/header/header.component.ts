import { Component, computed, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { NotificationService } from '../../../../front/core/notification.service';
import { AppNotification } from '../../../../front/models/notification.model';
import { ThemeService } from '../../../../front/core/theme.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './header.component.html',
    styles: [`
        /* Ensure notification badges are always visible */
        .notification-badge {
            position: absolute !important;
            top: -8px !important;
            right: -8px !important;
            width: 24px !important;
            height: 24px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            z-index: 10 !important;
            border: 2px solid white !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }
        
        .message-badge {
            background-color: #3B82F6 !important;
            color: white !important;
        }
        
        .notification-badge-red {
            background-color: #EF4444 !important;
            color: white !important;
        }
        
        /* Icon container */
        .icon-container {
            position: relative;
            display: inline-block;
        }
        
        /* Hover effects */
        .icon-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
            transform: scale(1.05);
        }
    `]
})
export class HeaderComponent {
    private adminAuthService = inject(AdminAuthService);
    private notificationService = inject(NotificationService);
    private router = inject(Router);
    readonly themeService = inject(ThemeService);

    showProfileMenu = signal(false);
    showNotificationsPanel = signal(false);
    showSettingsPanel = signal(false);
    notifications = signal<AppNotification[]>([]);
    isLoadingNotifications = signal(false);

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
        return user?.avatar || 'assets/logo.png';
    });

    readonly unreadCount = computed(() =>
        this.notifications().filter(n => !n.read).length
    );

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.notifications-panel-wrapper')) this.showNotificationsPanel.set(false);
        if (!target.closest('.settings-panel-wrapper')) this.showSettingsPanel.set(false);
        if (!target.closest('.profile-menu-wrapper')) this.showProfileMenu.set(false);
    }

    toggleProfileMenu(): void {
        this.showProfileMenu.update(v => !v);
        this.showNotificationsPanel.set(false);
        this.showSettingsPanel.set(false);
    }

    toggleNotificationsPanel(): void {
        const opening = !this.showNotificationsPanel();
        this.showNotificationsPanel.set(opening);
        this.showProfileMenu.set(false);
        this.showSettingsPanel.set(false);
        if (opening) this.loadNotifications();
    }

    toggleSettingsPanel(): void {
        this.showSettingsPanel.update(v => !v);
        this.showProfileMenu.set(false);
        this.showNotificationsPanel.set(false);
    }

    loadNotifications(): void {
        this.isLoadingNotifications.set(true);
        this.notificationService.getAllAdmin().subscribe({
            next: (items) => { this.notifications.set(items.slice(0, 10)); this.isLoadingNotifications.set(false); },
            error: () => this.isLoadingNotifications.set(false)
        });
    }

    markAsRead(id: string): void {
        this.notificationService.markAsRead(id).subscribe(() => {
            this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
        });
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        });
    }

    navigateTo(path: string): void {
        this.router.navigate([path]);
        this.showNotificationsPanel.set(false);
        this.showSettingsPanel.set(false);
        this.showProfileMenu.set(false);
    }

    logout(): void {
        this.adminAuthService.logout();
    }
}
