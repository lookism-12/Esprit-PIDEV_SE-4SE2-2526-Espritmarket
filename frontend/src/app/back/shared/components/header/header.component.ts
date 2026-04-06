import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

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
    
    showProfileMenu = signal(false);
    
    // Direct reference to the reactive user signal
    readonly currentUser = this.adminAuthService.currentUser;

    // Computed signals that instantly update when currentUser changes
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

    toggleProfileMenu(): void {
        this.showProfileMenu.update(v => !v);
    }

    logout(): void {
        this.adminAuthService.logout();
    }
}
