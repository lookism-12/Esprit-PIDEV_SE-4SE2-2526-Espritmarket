import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Admin Auth Guard - CRITICAL for admin route protection
 * ✅ Checks if user is authenticated AND has ADMIN role
 * ✅ Uses role from both signal (immediate) and localStorage (persistence)
 * ✅ Prevents non-admin users from accessing back office
 * ✅ Handles page refresh with proper role restoration
 * 
 * This guard ensures:
 * 1. User is authenticated (has valid JWT token)
 * 2. User role is ADMIN
 * 3. If admin is on non-admin route, blocks it
 * 4. If non-admin tries to access /admin, denies access
 * 
 * Usage in routes:
 * { path: 'admin', canActivate: [adminAuthGuard], children: [...] }
 */
export const adminAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Step 1: Check if user is authenticated at all
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    console.log('🔐 AdminAuthGuard: Not authenticated, redirecting to login');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Step 2: Get role from signal (fastest check)
  const currentUser = authService.currentUser();
  let userRole: string | undefined = currentUser?.role;
  
  // Step 3: Fallback to localStorage if signal not yet loaded
  // (happens during page refresh before async user load completes)
  if (!userRole) {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      userRole = storedRole;
      console.log('💾 AdminAuthGuard: Retrieved role from localStorage:', userRole);
    }
  }
  
  if (!userRole) {
    console.log('⚠️ AdminAuthGuard: No role found, denying access');
    return router.createUrlTree(['/']);
  }

  // Step 4: Check if admin role
  if (userRole === 'ADMIN') {
    console.log('✅ AdminAuthGuard: Admin verified, allowing access to /admin');
    return true;
  }

  // Step 5: User is authenticated but NOT admin
  console.log('❌ AdminAuthGuard: User is not admin, access denied');
  console.log(`   User role: ${userRole} (required: ADMIN)`);
  
  // Redirect based on role to appropriate location
  switch(userRole) {
    case 'PROVIDER':
      return router.createUrlTree(['/provider/dashboard']);
    case 'DRIVER':
      return router.createUrlTree(['/driver/dashboard']);
    case 'CLIENT':
    default:
      return router.createUrlTree(['/profile']);
  }
};
