import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

/**
 * RoleGuard - Functional guard for protecting routes based on user roles
 * 
 * Usage in routes:
 * { 
 *   path: 'admin', 
 *   component: AdminDashboardComponent, 
 *   canActivate: [roleGuard],
 *   data: { roles: [UserRole.ADMIN] }
 * }
 * 
 * { 
 *   path: 'seller/dashboard', 
 *   component: SellerDashboardComponent, 
 *   canActivate: [roleGuard],
 *   data: { roles: [UserRole.SELLER, UserRole.ADMIN] }
 * }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!authService.isAuthenticated()) {
    console.log('RoleGuard: User not authenticated, redirecting to login');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;

  // If no roles specified, allow access (just authentication check)
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // TODO: Get current user's role from AuthService
  const currentUser = authService.currentUser();
  
  if (!currentUser) {
    console.log('RoleGuard: No user found, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  // Check if user has any of the required roles
  const hasRole = requiredRoles.includes(currentUser.role);

  if (hasRole) {
    return true;
  }

  // User doesn't have required role - redirect to unauthorized page or home
  console.log('RoleGuard: User lacks required role, access denied');
  console.log('Required roles:', requiredRoles, 'User role:', currentUser.role);
  
  // TODO: You can redirect to a 403 forbidden page instead
  return router.createUrlTree(['/']);
};

/**
 * Admin only guard - Shortcut for admin-only routes
 * 
 * Usage in routes:
 * { path: 'admin', component: AdminComponent, canActivate: [adminGuard] }
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentUser = authService.currentUser();
  
  if (currentUser?.role === UserRole.ADMIN) {
    return true;
  }

  console.log('AdminGuard: User is not admin, access denied');
  return router.createUrlTree(['/']);
};

/**
 * Seller guard - Allow only sellers and admins
 * 
 * Usage in routes:
 * { path: 'seller/products', component: SellerProductsComponent, canActivate: [sellerGuard] }
 */
export const sellerGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentUser = authService.currentUser();
  const allowedRoles: UserRole[] = [UserRole.PROVIDER, UserRole.ADMIN];
  
  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return true;
  }

  console.log('SellerGuard: User is not a seller, access denied');
  return router.createUrlTree(['/']);
};

/**
 * Buyer guard - Allow only buyers (and admins)
 * 
 * Usage in routes:
 * { path: 'checkout', component: CheckoutComponent, canActivate: [buyerGuard] }
 */
export const buyerGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentUser = authService.currentUser();
  const allowedRoles: UserRole[] = [UserRole.CLIENT, UserRole.ADMIN];
  
  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return true;
  }

  console.log('BuyerGuard: User is not a buyer, access denied');
  return router.createUrlTree(['/']);
};

/**
 * Provider guard - Allow only providers (and admins)
 */
export const providerGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('========================================');
  console.log('🔐 PROVIDER GUARD CHECK');
  console.log('========================================');

  if (!authService.isAuthenticated()) {
    console.log('❌ User not authenticated');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentUser = authService.currentUser();
  console.log('👤 Current User:', currentUser);
  console.log('🎭 User Role (singular):', currentUser?.role);
  console.log('🎭 User Roles (array):', currentUser?.roles);
  
  const allowedRoles: UserRole[] = [UserRole.PROVIDER, UserRole.ADMIN];
  console.log('✅ Allowed Roles:', allowedRoles);
  
  // Check both role (singular) and roles (array)
  const hasRoleInSingular = currentUser && allowedRoles.includes(currentUser.role);
  const hasRoleInArray = currentUser && currentUser.roles && currentUser.roles.some(r => allowedRoles.includes(r));
  const storedRole = localStorage.getItem('userRole') as UserRole | null;
  const hasStoredRole = storedRole ? allowedRoles.includes(storedRole) : false;
  
  console.log('🔍 Has role in singular field:', hasRoleInSingular);
  console.log('🔍 Has role in array field:', hasRoleInArray);
  
  if (hasRoleInSingular || hasRoleInArray || hasStoredRole) {
    console.log('✅ PROVIDER ACCESS GRANTED');
    console.log('========================================');
    return true;
  }

  console.log('❌ PROVIDER ACCESS DENIED');
  console.log('========================================');
  return router.createUrlTree(['/']);
};

/**
 * Driver guard - Allow only drivers (and admins)
 */
export const driverGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentUser = authService.currentUser();
  const allowedRoles: UserRole[] = [UserRole.DRIVER, UserRole.ADMIN];
  
  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return true;
  }

  console.log('DriverGuard: User is not a driver, access denied');
  return router.createUrlTree(['/']);
};

/**
 * Client guard - Allow only clients/passengers (and admins)
 */
export const clientGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentUser = authService.currentUser();
  const allowedRoles: UserRole[] = [UserRole.CLIENT, UserRole.PASSENGER, UserRole.ADMIN];
  
  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return true;
  }

  console.log('ClientGuard: User is not a client, access denied');
  return router.createUrlTree(['/']);
};
