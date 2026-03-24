import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * AuthGuard - Functional guard for protecting routes that require authentication
 * Properly checks authenticated signal
 * 
 * Usage in routes:
 * { path: 'profile', component: ProfileComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  // ✅ Using signal invocation correctly
  if (authService.isAuthenticated()) {
    console.log('✅ AuthGuard: User authenticated, allowing access');
    return true;
  }

  console.log('⚠️ AuthGuard: User not authenticated, redirecting to login');
  
  // Redirect to login page with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guest guard - Only allow access to non-authenticated users
 * Useful for login/register pages
 * ✅ Properly checks if user is already authenticated
 * ✅ Respects role-based redirection (admin → /admin, others → /home)
 * 
 * Usage in routes:
 * { path: 'login', component: LoginComponent, canActivate: [guestGuard] }
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // ✅ Get current auth state from signal
  const isAuthenticated = authService.isAuthenticated();
  
  console.log(`📊 GuestGuard: isAuthenticated = ${isAuthenticated}`);

  // If user is already authenticated, redirect based on role
  if (isAuthenticated) {
    const currentUser = authService.currentUser();
    
    if (currentUser?.role === 'ADMIN') {
      console.log('🔐 GuestGuard: Admin user detected, redirecting to /admin');
      return router.createUrlTree(['/admin']);
    }
    
    console.log('⚠️ GuestGuard: User already authenticated, redirecting to home');
    return router.createUrlTree(['/']);
  }

  console.log('✅ GuestGuard: User not authenticated, allowing access to login/register');
  return true;
};
