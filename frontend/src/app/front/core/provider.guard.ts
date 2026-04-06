import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

export const providerGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  console.log('🔐 Provider Guard Check - User:', user?.role);
  
  const hasProviderRole = user?.role === UserRole.PROVIDER || user?.role === UserRole.ADMIN;

  if (hasProviderRole) {
    console.log('✅ Provider access granted');
    return true;
  }

  // Not authorized - redirect to home
  console.log('❌ Provider access denied - redirecting to home');
  router.navigate(['/']);
  return false;
};
