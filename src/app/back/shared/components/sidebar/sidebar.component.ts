import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item.model';

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
    `]
})
export class SidebarComponent {
    menuItems: MenuItem[] = [
        { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
        { label: 'User Management', icon: '👥', route: '/admin/users' },
        { label: 'Content Moderation', icon: '🛡️', route: '/admin/moderation' },
        { label: 'Marketplace', icon: '🛒', route: '/admin/marketplace' },
        { label: 'Smart Mobility', icon: '🚗', route: '/admin/mobility' },
        { label: 'Orders & Transactions', icon: '💳', route: '/admin/orders' },
        { label: 'Support Center', icon: '🎧', route: '/admin/support' },
        { label: 'Community Oversight', icon: '👁️', route: '/admin/community' },
        { label: 'Notification Center', icon: '🔔', route: '/admin/notifications', badge: 5 },
        { label: 'Analytics & Reports', icon: '📊', route: '/admin/analytics' },
        { label: 'System Settings', icon: '⚙️', route: '/admin/settings' }
    ];
}
