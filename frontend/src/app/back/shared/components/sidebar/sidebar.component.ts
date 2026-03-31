import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item.model';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { filter } from 'rxjs/operators';

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
        nav {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        nav::-webkit-scrollbar {
            display: none;
        }
        .nav-item {
            position: relative;
            color: rgb(229, 231, 235);
            border-left: 3px solid transparent;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-item:hover {
            background: linear-gradient(90deg, rgba(139, 0, 0, 0.3) 0%, rgba(224, 184, 74, 0.1) 100%);
            border-left-color: rgba(250, 204, 21, 0.6);
            transform: translateX(4px);
            box-shadow: inset 0 0 12px rgba(224, 184, 74, 0.08);
        }
        .nav-item-active {
            background: linear-gradient(90deg, rgba(139, 0, 0, 0.5) 0%, rgba(224, 184, 74, 0.15) 100%);
            color: #fef3c7;
            border-left-color: #fbbf24;
            border-radius: 0.75rem;
            box-shadow: inset 0 0 16px rgba(224, 184, 74, 0.12),
                        0 0 20px rgba(224, 184, 74, 0.15);
            font-weight: 600;
        }
        .nav-item-active span[class*="badge"] {
            animation: pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-gold {
            0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
            50% { box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.3); }
        }
        .nav-item:focus-visible {
            outline: 2px solid #fbbf24;
            outline-offset: 2px;
        }
        a { position: relative; }
    `]
})
export class SidebarComponent {
    private adminAuthService = inject(AdminAuthService);
    private router = inject(Router);

    readonly currentUser = this.adminAuthService.currentUser;

    expandedMenus = signal<Set<string>>(new Set(['marketplace']));

    menuItems: MenuItem[] = [
        { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
        { label: 'User Management', icon: '👥', route: '/admin/users' },
        { label: 'Content Moderation', icon: '🛡️', route: '/admin/moderation' },
        {
            label: 'Marketplace', icon: '🛒', route: '/admin/marketplace',
            children: [
                { label: 'Overview', icon: '📊', route: '/admin/marketplace' },
                { label: 'Products', icon: '📦', route: '/admin/marketplace/products' },
                { label: 'Categories', icon: '🏷️', route: '/admin/marketplace/categories' },
                { label: 'Services', icon: '🔧', route: '/admin/marketplace/services' },
                { label: 'Favorites', icon: '❤️', route: '/admin/marketplace/favorites' },
                { label: 'Shops', icon: '🏪', route: '/admin/marketplace/shop' },
            ]
        },
        { label: 'Smart Mobility', icon: '🚗', route: '/admin/mobility' },
        { label: 'Orders & Transactions', icon: '💳', route: '/admin/orders' },
        { label: 'Support Center', icon: '🎧', route: '/admin/support' },
        { label: 'Community Oversight', icon: '👁️', route: '/admin/community' },
        { label: 'Notification Center', icon: '🔔', route: '/admin/notifications', badge: 5 },
        { label: 'Analytics & Reports', icon: '📊', route: '/admin/analytics' },
        { label: 'System Settings', icon: '⚙️', route: '/admin/settings' }
    ];

    isExpanded(label: string): boolean {
        return this.expandedMenus().has(label);
    }

    toggleMenu(label: string): void {
        const current = new Set(this.expandedMenus());
        if (current.has(label)) {
            current.delete(label);
        } else {
            current.add(label);
        }
        this.expandedMenus.set(current);
    }

    isChildActive(item: MenuItem): boolean {
        if (!item.children) return false;
        return item.children.some(child => this.router.url.startsWith(child.route));
    }
}
