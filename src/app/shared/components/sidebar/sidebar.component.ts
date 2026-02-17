import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
    menuItems: MenuItem[] = [
        { label: 'Dashboard', icon: 'home', route: '/admin/dashboard' },
        { label: 'User Management', icon: 'users', route: '/admin/users' },
        { label: 'Content Moderation', icon: 'shield', route: '/admin/moderation' },
        { label: 'Marketplace', icon: 'shopping-cart', route: '/admin/marketplace' },
        { label: 'Smart Mobility', icon: 'car', route: '/admin/mobility' },
        { label: 'Orders & Transactions', icon: 'credit-card', route: '/admin/orders' },
        { label: 'Support Center', icon: 'headphones', route: '/admin/support' },
        { label: 'Community Oversight', icon: 'eye', route: '/admin/community' },
        { label: 'Notification Center', icon: 'bell', route: '/admin/notifications', badge: 5 },
        { label: 'Analytics & Reports', icon: 'bar-chart-2', route: '/admin/analytics' },
        { label: 'System Settings', icon: 'settings', route: '/admin/settings' }
    ];
}
