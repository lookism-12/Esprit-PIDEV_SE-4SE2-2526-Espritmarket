import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item.model';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { UserRole } from '../../../../front/models/user.model';

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
        
        /* Enhanced scrollbar styling for red theme */
        .hide-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        
        .hide-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .hide-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            transition: background 0.3s ease;
        }
        
        .hide-scrollbar:hover::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.5);
        }

        /* Enhanced navigation item styling for red theme */
        .nav-item {
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-item:hover {
            transform: translateX(3px);
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }

        .nav-item-active {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
            color: white;
            border-left: 3px solid white;
            font-weight: 600;
            transform: translateX(3px);
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
            box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .nav-item-active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(to bottom, white, rgba(255, 255, 255, 0.8));
            border-radius: 0 2px 2px 0;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        /* Smooth animations for collapsible sections */
        .collapsible-section {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced pulse animation for status indicators */
        @keyframes pulse-glow {
            0%, 100% {
                opacity: 1;
                box-shadow: 0 0 5px currentColor;
            }
            50% {
                opacity: 0.7;
                box-shadow: 0 0 15px currentColor;
            }
        }

        .animate-pulse {
            animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Hover effects for interactive elements */
        .interactive-hover {
            transition: all 0.2s ease;
        }

        .interactive-hover:hover {
            transform: scale(1.02);
            filter: brightness(1.1);
        }

        /* Focus styles for accessibility with red theme */
        .nav-item:focus-visible,
        button:focus-visible {
            outline: 2px solid white;
            outline-offset: 2px;
            border-radius: 8px;
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
        }

        /* Text shadow for better readability on red background */
        .drop-shadow-sm {
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        /* Enhanced glow effects */
        .shadow-glow {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
    `]
})

export class SidebarComponent {
    private adminAuthService = inject(AdminAuthService);
    
    readonly currentUser = this.adminAuthService.currentUser;
    
    // State for collapsible menus
    isMarketplaceOpen = signal(false);
    isProviderOpen = signal(false);
    isForumOpen = signal(false);
    isCarpoolingOpen = signal(false);
    
    menuItems: MenuItem[] = [
        { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
        { label: 'User Management', icon: '👥', route: '/admin/users' },
        { label: 'Orders & Transactions', icon: '💳', route: '/admin/orders' },
        { label: 'Support Center', icon: '🎧', route: '/admin/support' },
        { label: 'Notification Center', icon: '🔔', route: '/admin/notifications', badge: 5 },
        { label: 'Negotiations', icon: '🤝', route: '/admin/negotiations' },
        { label: 'SAV & Deliveries', icon: '📦', route: '/admin/sav' },
        { label: 'System Settings', icon: '⚙️', route: '/admin/settings' }
    ];

    carpoolingItems = [
        { label: 'Overview', icon: '📊', route: '/admin/carpooling' },
        { label: 'All Rides', icon: '🚗', route: '/admin/carpooling/rides' },
        { label: 'Ride Requests', icon: '📋', route: '/admin/carpooling/requests' },
        { label: 'Drivers', icon: '🧑‍✈️', route: '/admin/carpooling/drivers' },
        { label: 'Passengers', icon: '👤', route: '/admin/carpooling/passengers' },
        { label: 'Payments', icon: '💰', route: '/admin/carpooling/payments' },
    ];

    marketplaceItems = [
        { label: 'Overview', icon: '📊', route: '/admin/marketplace' },
        { label: 'Products', icon: '📦', route: '/admin/marketplace/products' },
        { label: 'Categories', icon: '🏷️', route: '/admin/marketplace/categories' },
        { label: 'Services', icon: '🔧', route: '/admin/marketplace/services' },
        { label: 'Favorites', icon: '❤️', route: '/admin/marketplace/favorites' },
        { label: 'Shops', icon: '🏪', route: '/admin/marketplace/shop' }
    ];

    providerItems = [
        { label: 'Dashboard', icon: '📊', route: '/admin/provider/dashboard' },
        { label: 'My Shop', icon: '🏪', route: '/admin/provider/shop' },
        { label: 'My Products', icon: '📦', route: '/admin/marketplace/products' },
        { label: 'Orders', icon: '📋', route: '/admin/orders' }
    ];

    forumItems = [
        { label: 'Overview', icon: '📊', route: '/admin/forum' },
        { label: 'Categories', icon: '📂', route: '/admin/forum/categories' },
        { label: 'Posts', icon: '📝', route: '/admin/forum/posts' },
        { label: 'Comments', icon: '💬', route: '/admin/forum/comments' },
        { label: 'Content Moderation', icon: '🛡️', route: '/admin/moderation' },
        { label: 'Reports', icon: '⚠️', route: '/admin/forum/reports' }
    ];

    // Check if user is provider/seller
    isProvider = computed(() => {
        const user = this.currentUser();
        return user?.roles?.includes(UserRole.PROVIDER) || user?.role === UserRole.PROVIDER || false;
    });

    toggleMarketplace(): void {
        this.isMarketplaceOpen.update(open => !open);
    }

    toggleProvider(): void {
        this.isProviderOpen.update(open => !open);
    }

    toggleForum(): void {
        this.isForumOpen.update(open => !open);
    }

    toggleCarpooling(): void {
        this.isCarpoolingOpen.update(open => !open);
    }
}
