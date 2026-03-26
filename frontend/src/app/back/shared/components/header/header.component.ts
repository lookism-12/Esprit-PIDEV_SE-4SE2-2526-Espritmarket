import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './header.component.html'
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
        return user?.avatarUrl || 'assets/logo.png';
    });

    toggleProfileMenu(): void {
        this.showProfileMenu.update(v => !v);
    }

    logout(): void {
        this.adminAuthService.logout();
    }
}
