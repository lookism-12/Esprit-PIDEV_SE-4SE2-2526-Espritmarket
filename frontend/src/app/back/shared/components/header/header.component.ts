import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
    showProfileMenu = signal(false);
    userInitials = signal('AU');
    userName = signal('Admin User');
    userEmail = signal('admin@esprit.tn');

    constructor(private adminAuthService: AdminAuthService) {}

    ngOnInit(): void {
        // Get user info from admin auth service
        this.userInitials.set(this.adminAuthService.getUserInitials());
        this.userName.set(this.adminAuthService.getFullName());
        this.userEmail.set(this.adminAuthService.getEmail());

        // Subscribe to user changes
        const user = this.adminAuthService.currentUser();
        if (user) {
            this.userName.set(`${user.firstName} ${user.lastName}`);
            this.userInitials.set(`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase());
            this.userEmail.set(user.email);
        }
    }

    toggleProfileMenu(): void {
        this.showProfileMenu.update(v => !v);
    }

    logout(): void {
        this.adminAuthService.logout();
    }
}
