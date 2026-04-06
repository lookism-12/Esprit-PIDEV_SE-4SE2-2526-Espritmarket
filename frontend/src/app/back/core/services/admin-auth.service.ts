import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../front/core/auth.service';
import { UserRole } from '../../../front/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private authService = inject(AuthService);

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    const role = this.authService.userRole();
    return role === UserRole.ADMIN;
  }

  /**
   * Check if current user is seller/provider
   */
  isSeller(): boolean {
    const role = this.authService.userRole();
    return role === UserRole.PROVIDER || role === 'SELLER' as any;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.authService.userId();
  }

  /**
   * Get current user role
   */
  getUserRole(): UserRole | null {
    return this.authService.userRole();
  }

  /**
   * Get current user (proxy to AuthService)
   */
  get currentUser() {
    return this.authService.currentUser;
  }

  /**
   * Logout user (proxy to AuthService)
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Update user avatar (placeholder - implement if needed)
   */
  updateUserAvatar(url: string): void {
    // TODO: Implement avatar update logic
    console.log('Avatar update requested:', url);
  }
}