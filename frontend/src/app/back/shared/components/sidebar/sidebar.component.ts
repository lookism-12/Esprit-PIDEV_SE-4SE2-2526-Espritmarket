import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item.model';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { NotificationService } from '../../../../front/core/notification.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styles: [`
        :host {
            display: block;
            height: 100%;
        }
        /* Hide scrollbar but keep scroll functionality */
        nav {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
        }
        nav::-webkit-scrollbar {
            display: none; /* Chrome/Safari/Opera */
        }

        /* ===== PREMIUM SIDEBAR STYLING ===== */

        /* Navigation Item Base */
        .nav-item {
            position: relative;
            color: rgb(229, 231, 235);
            border-left: 3px solid transparent;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Navigation Item Hover */
        .nav-item:hover {
            background: linear-gradient(90deg, rgba(139, 0, 0, 0.3) 0%, rgba(224, 184, 74, 0.1) 100%);
            border-left-color: rgba(250, 204, 21, 0.6);
            transform: translateX(4px);
            box-shadow: inset 0 0 12px rgba(224, 184, 74, 0.08);
        }

        /* Navigation Item Active */
        .nav-item-active {
            background: linear-gradient(90deg, rgba(139, 0, 0, 0.5) 0%, rgba(224, 184, 74, 0.15) 100%);
            color: #fef3c7;
            border-left-color: #fbbf24;
            border-radius: 0.75rem;
            box-shadow: inset 0 0 16px rgba(224, 184, 74, 0.12),
                        0 0 20px rgba(224, 184, 74, 0.15);
            font-weight: 600;
        }

        /* Active Badge Animation */
        .nav-item-active span[class*="badge"] {
            animation: pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-gold {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7);
            }
            50% {
                box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.3);
            }
        }

        /* Focus styles for accessibility */
        .nav-item:focus-visible {
            outline: 2px solid #fbbf24;
            outline-offset: 2px;
        }

        a {
            position: relative;
        }
    `]
})

export class SidebarComponent implements OnInit {
    private adminAuthService = inject(AdminAuthService);
    private notificationService = inject(NotificationService);

    readonly currentUser = this.adminAuthService.currentUser;
    unreadCount = signal(0);

    menuItems: MenuItem[] = [
        { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
        { label: 'User Management', icon: '👥', route: '/admin/users' },
        { label: 'Content Moderation', icon: '🛡️', route: '/admin/moderation' },
        { label: 'Marketplace', icon: '🛒', route: '/admin/marketplace' },
        { label: 'Negotiations', icon: '🤝', route: '/admin/negotiations' },
        { label: 'Smart Mobility', icon: '🚗', route: '/admin/mobility' },
        { label: 'Orders & Transactions', icon: '💳', route: '/admin/orders' },
        { label: 'Support Center', icon: '🎧', route: '/admin/support' },
        { label: 'Community Oversight', icon: '👁️', route: '/admin/community' },
        { label: 'Notification Center', icon: '🔔', route: '/admin/notifications' },
        { label: 'Analytics & Reports', icon: '📊', route: '/admin/analytics' },
        { label: 'System Settings', icon: '⚙️', route: '/admin/settings' }
    ];

    ngOnInit(): void {
        this.notificationService.getMy().subscribe({
            next: (items) => {
                const unread = items.filter((n: any) => !n.read).length;
                this.unreadCount.set(unread);
            },
            error: () => {}
        });
    }
}
