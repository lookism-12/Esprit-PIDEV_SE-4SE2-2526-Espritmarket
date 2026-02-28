import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * AuthGuard - Functional guard for protecting routes that require authentication
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

  // TODO: Implement actual authentication check
  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    return true;
  }

  // TODO: Store the attempted URL for redirecting after login
  // const redirectUrl = state.url;
  // authService.redirectUrl = redirectUrl;

  console.log('AuthGuard: User not authenticated, redirecting to login');
  
  // Redirect to login page
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guest guard - Only allow access to non-authenticated users
 * Useful for login/register pages
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

  // If user is already authenticated, redirect to home
  if (authService.isAuthenticated()) {
    console.log('GuestGuard: User already authenticated, redirecting to home');
    return router.createUrlTree(['/']);
  }

  return true;
};
