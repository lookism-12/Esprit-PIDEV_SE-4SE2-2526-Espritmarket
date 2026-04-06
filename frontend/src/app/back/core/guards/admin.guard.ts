import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../../front/core/auth.service';
import { UserRole } from '../../../front/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isAuthenticated = this.authService.isAuthenticated();
    const userRole = this.authService.userRole();
    
    console.log('🛡️ AdminGuard: Checking access', { 
      isAuthenticated, 
      userRole, 
      url: state.url 
    });

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('❌ AdminGuard: User not authenticated, redirecting to login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // ✅ CRITICAL FIX: Check if user has ADMIN role ONLY
    // Providers should NOT access admin back office
    const hasAdminAccess = userRole === UserRole.ADMIN;
    
    if (!hasAdminAccess) {
      console.log(`❌ AdminGuard: User lacks admin access (role: ${userRole}), redirecting to appropriate interface`);
      
      // Redirect based on role
      if (userRole === UserRole.PROVIDER) {
        console.log('   🏪 PROVIDER redirected to front-end profile (NOT admin)');
        this.router.navigate(['/profile']);
      } else {
        console.log('   👤 Other role redirected to profile');
        this.router.navigate(['/profile']);
      }
      return false;
    }

    console.log('✅ AdminGuard: Access granted');
    return true;
  }
}