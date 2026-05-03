import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, map, throwError, switchMap } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environment';
import { JwtUtil } from './jwt.util';
import { ThemeService } from './theme.service';

/**
 * Backend UserDTO - matches Spring Boot UserDTO
 */
export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  deliveryZone?: string;
  vehicleType?: string;
  drivingLicenseNumber?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdatedAt?: string;
  roles: string[];
  enabled: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Base registration fields (common to all roles)
export interface BaseRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string; // Backend role: CLIENT, PROVIDER, DRIVER, PASSENGER, DELIVERY
}

// Client-specific fields
export interface ClientRegisterRequest extends BaseRegisterRequest {
  address?: string;
}

// Provider-specific fields
export interface ProviderRegisterRequest extends BaseRegisterRequest {
  businessName: string;
  businessType: string;
  taxId: string;
  description?: string;
}

// Driver-specific fields
export interface DriverRegisterRequest extends BaseRegisterRequest {
  drivingLicenseNumber: string;
  vehicleType: string;
}

// Delivery-specific fields
export interface DeliveryRegisterRequest extends BaseRegisterRequest {
  vehicleType: string;
  deliveryZone: string;
}

// Union type for all register request types
export type RegisterRequest = 
  | ClientRegisterRequest 
  | ProviderRegisterRequest 
  | DriverRegisterRequest 
  | DeliveryRegisterRequest;

export interface AuthResponse {
  token: string;
  userId: string;
}

/**
 * Backend Register Response - returns UserDTO
 */
export interface BackendRegisterResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private router = inject(Router);
  private themeService = inject(ThemeService);

  // Reactive state - Main signals
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  // User detail signals
  readonly userId = signal<string | null>(null);
  readonly userFirstName = signal<string | null>(null);
  readonly userLastName = signal<string | null>(null);
  readonly userEmail = signal<string | null>(null);
  readonly userAvatar = signal<string | null>(null);
  readonly userRole = signal<UserRole | null>(null);
  readonly userDeliveryZone = signal<string | null>(null);

  private http = inject(HttpClient);

  constructor() {
    // Check for existing token on service initialization
    this.initializeAuthState();
  }

  /**
   * Initialize auth state from localStorage
   * If token exists, automatically restore user profile
   */
  private initializeAuthState(): void {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      this.isAuthenticated.set(true);
      // Restore user profile from backend
      this.loadCurrentUser().subscribe({
        next: () => console.log('✅ User restored from token on app init'),
        error: (err) => {
          console.warn('⚠️ Failed to restore user from token:', err);
          // Token might be invalid, clear it
          this.logout();
        }
      });
    } else {
      this.isAuthenticated.set(false);
    }
  }

  /**
   * Authenticate user with email and password
   * Proper async flow: login → store token → decode role → redirect by role
   * @param credentials - Login credentials
   * @returns Observable with User data (after loading profile)
   */
  login(credentials: LoginRequest): Observable<User> {
    console.log('🔐 Login attempt started with email:', credentials.email);
    console.log('🌐 API URL:', `${this.apiUrl}/login`);
    
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      credentials
    ).pipe(
      tap((response: AuthResponse) => {
        console.log('✅ Backend response received:', response);
        
        // Step 1: Store token and user ID
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userId', response.userId);
        console.log('💾 Token and userId stored in localStorage');
        
        // Step 2: Update auth state
        this.isAuthenticated.set(true);
        console.log('✅ Login: Token stored, isAuthenticated set to true');
        
        // Step 3: Attempt immediate redirect based on role from JWT
        // This provides faster UX before profile loads
        const role = this.extractRoleFromToken(response.token);
        console.log('🎭 Extracted role from JWT:', role);
        
        if (role) {
          console.log(`📌 Immediate redirect based on JWT role: ${role}`);
          this.redirectByRole(role as UserRole);
        } else {
          console.warn('⚠️ Could not extract role from JWT token');
        }
      }),
      switchMap(() => {
        // Step 4: Load user profile (this updates all signals)
        console.log('📥 Loading user profile...');
        return this.loadCurrentUser();
      }),
      tap((user) => {
        // Step 5: Confirm redirect (in case JWT role differs)
        console.log('✅ Login complete, user profile loaded:', user);
        console.log('🔀 Final redirect with role:', user.role);
        this.redirectByRole(user.role);
      }),
      catchError((error) => {
        console.error('❌ Login failed with error:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error body:', error.error);
        
        this.isAuthenticated.set(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        throw error;
      })
    );
  }

  /**
   * Load current user profile from backend
   * Populates all user detail signals
   * ✅ Can be called from app init OR after login
   */
  loadCurrentUser(): Observable<User> {
    return this.http.get<UserDTO>(`${this.apiUrl}/me`).pipe(
      map((userDto: UserDTO) => {
        // Convert UserDTO to User (extract first role from array)
        const user: User = {
          id: userDto.id,
          firstName: userDto.firstName || 'User',
          lastName: userDto.lastName || '',
          email: userDto.email,
          phone: userDto.phone || '',
          roles: (userDto.roles || ['CLIENT']).map(role => role as UserRole), // ✅ Cast string array to UserRole array
          role: (userDto.roles && userDto.roles.length > 0) 
            ? (userDto.roles[0] as UserRole) 
            : UserRole.CLIENT, // ✅ Keep for backward compatibility
          isVerified: userDto.enabled,
          deliveryZone: userDto.deliveryZone || '',
          vehicleType: userDto.vehicleType || '',
          drivingLicenseNumber: userDto.drivingLicenseNumber || '',
          currentLatitude: userDto.currentLatitude,
          currentLongitude: userDto.currentLongitude,
          lastLocationUpdatedAt: userDto.lastLocationUpdatedAt,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Handle avatar URL - make it absolute if it's relative
        let avatarUrl: string | null = null;
        if (userDto.avatarUrl) {
          if (userDto.avatarUrl.startsWith('http')) {
            avatarUrl = userDto.avatarUrl;
          } else {
            // Relative URL - make it absolute
            const backendHost = environment.apiUrl.replace('/api', '');
            const cleanPath = userDto.avatarUrl.startsWith('/') ? userDto.avatarUrl : '/' + userDto.avatarUrl;
            avatarUrl = backendHost + cleanPath;
          }
          console.log('📷 Avatar URL set:', avatarUrl);
        }
        user.avatar = avatarUrl || undefined;

        // Update all signals - this is the SOURCE OF TRUTH
        this.currentUser.set(user);
        this.userId.set(user.id);
        this.userFirstName.set(user.firstName);
        this.userLastName.set(user.lastName);
        this.userEmail.set(user.email);
        this.userRole.set(user.role);
        this.userAvatar.set(avatarUrl);
        this.userDeliveryZone.set(user.deliveryZone || null);

        // PERSISTENCE: Store role in localStorage for app initialization
        localStorage.setItem('userRole', user.role);
        console.log('💾 Stored role in localStorage:', user.role);

        console.log('✅ User signals updated:', { 
          id: user.id, 
          role: user.role,
          firstName: user.firstName,
          avatar: avatarUrl
        });

        return user;
      }),
      catchError((error) => {
        console.error('Failed to load user profile:', error);
        throw error;
      })
    );
  }

  /**
   * Extract role from stored JWT token
   * Used for immediate redirection after login
   */
  private extractRoleFromToken(token: string): string | null {
    try {
      return JwtUtil.extractRole(token);
    } catch (error) {
      console.warn('Could not extract role from token:', error);
      return null;
    }
  }

  /**
   * Redirect user based on their role
   * Maps backend roles to frontend routes
   * ✅ CRITICAL FIX: Only ADMIN goes to back office, all others use front-end
   */
  private redirectByRole(role: UserRole): void {
    console.log(`🔀 Redirecting user with role: ${role}`);
    
    // Check if we're already in the correct interface
    const currentPath = this.router.url;
    
    switch (role) {
      case UserRole.ADMIN:
        // ✅ ONLY ADMIN users go to admin back office
        console.log('🏢 ADMIN detected - redirecting to admin dashboard');
        if (!currentPath.startsWith('/admin')) {
          this.router.navigate(['/admin/dashboard']);
        }
        break;
      case UserRole.PROVIDER:
      case 'SELLER' as any: // Legacy SELLER role
        // Providers use the front provider workspace, not the admin back office.
        console.log('🏪 PROVIDER detected - redirecting to provider dashboard');
        this.router.navigate(['/provider/dashboard']);
        break;
      case UserRole.DRIVER:
        console.log('🚗 DRIVER detected - redirecting to driver cockpit');
        this.router.navigate(['/driver/analytics']);
        break;
      case UserRole.DELIVERY:
        console.log('📦 DELIVERY detected - redirecting to front-end profile');
        this.router.navigate(['/profile']);
        break;
      case UserRole.PASSENGER:
        console.log('🚌 PASSENGER detected - redirecting to carpooling');
        this.router.navigate(['/carpooling']);
        break;
      case UserRole.CLIENT:
      default:
        // ✅ Clients use front-end interface
        console.log('👤 CLIENT detected - redirecting to front-end profile');
        this.router.navigate(['/profile']);
        break;
    }
  }

  /**
   * Log out current user and clear tokens
   * Properly clears localStorage, resets signals, and navigates to login
   */
  logout(): void {
    console.log('🔄 Starting logout process...');
    
    // Step 1: Clear all localStorage items
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');  // Clear role
    localStorage.removeItem('rememberMe');
    
    // Step 2: Reset all signals (must happen BEFORE navigation)
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isLoading.set(false);
    
    // Reset user detail signals
    this.userId.set(null);
    this.userFirstName.set(null);
    this.userLastName.set(null);
    this.userEmail.set(null);
    this.userAvatar.set(null);
    this.userRole.set(null);
    this.userDeliveryZone.set(null);

    console.log('✅ Logout: localStorage cleared, all signals reset');
    
    // Step 4: Navigate to login page
    // Use setTimeout to ensure signals propagate before navigation
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { 
          returnUrl: null,
          loggedOut: true
        }
      }).then(
        (success) => {
          if (success) {
            console.log('✅ Successfully navigated to /login');
          } else {
            console.warn('⚠️ Navigation to /login failed');
          }
        },
        (error) => {
          console.error('❌ Navigation error:', error);
        }
      );
    }, 0);
  }

  /**
   * Register a new user account
   * @param data - Registration data
   * @returns Observable with auth response
   */
  register(data: RegisterRequest): Observable<BackendRegisterResponse> {
    // Send all fields including role and role-specific fields to backend
    const backendPayload = {
      ...data // Include all fields from the payload
    };

    console.log('📤 Sending registration payload to backend:', backendPayload);

    return this.http.post<BackendRegisterResponse>(
      `${this.apiUrl}/register`,
      backendPayload
    ).pipe(
      tap((response: BackendRegisterResponse) => {
        console.log('✅ Registration successful:', response);
        // Don't auto-login after registration - user must login
      }),
      catchError((error) => {
        console.error('❌ Registration failed:', error);
        // Pass error to component for display
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh the access token using refresh token
   * @returns Observable with new tokens
   */
  /**
   * Refresh the access token using refresh token
   * @returns Observable with new tokens
   */
  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    // TODO: Implement token refresh logic if backend supports it
    // For now, user would need to login again
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No token available for refresh');
    }
    
    // This endpoint may not exist yet on backend
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.apiUrl}/refresh`,
      { token }
    );
  }

  /**
   * Check if user has a valid token stored
   * @returns boolean indicating if user appears to be logged in
   */
  hasStoredToken(): boolean {
    return localStorage.getItem('authToken') !== null;
  }

  /**
   * Check if user is authenticated
   * ✅ Returns signal value directly
   * @returns boolean indicating if user is authenticated
   */
  isAuthenticated$(): boolean {
    return this.isAuthenticated();  // ✅ Calling signal as function
  }

  /**
   * Get the current access token
   * @returns The stored access token or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get the current user ID
   * @returns The stored user ID or null
   */
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Get full user name
   */
  getFullName(): string {
    const firstName = this.userFirstName();
    const lastName = this.userLastName();
    return `${firstName || ''} ${lastName || ''}`.trim() || 'User';
  }

  /**
   * Get user initials for avatar fallback
   */
  getInitials(): string {
    const firstName = this.userFirstName();
    const lastName = this.userLastName();
    return `${(firstName?.charAt(0) || '').toUpperCase()}${(lastName?.charAt(0) || '').toUpperCase()}` || 'U';
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.roles?.includes(UserRole.ADMIN) || false;
  }

  /**
   * Sign in with Google using Google Identity Services popup.
   * Verifies the credential on our backend and returns a JWT.
   */
  loginWithGoogle(): void {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      console.error('Google Identity Services not loaded');
      return;
    }

    google.accounts.id.initialize({
      client_id: this.getGoogleClientId(),
      callback: (response: { credential: string }) => {
        this.handleOAuthResponse('google', { credential: response.credential });
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render a button in a temporary div and click it
        const div = document.createElement('div');
        div.style.display = 'none';
        document.body.appendChild(div);
        google.accounts.id.renderButton(div, { type: 'standard' });
        const btn = div.querySelector('div[role=button]') as HTMLElement;
        btn?.click();
      }
    });
  }

  /**
   * Sign in with GitHub — redirects to GitHub's OAuth page.
   * The callback URL must be registered in your GitHub OAuth App settings.
   */
  loginWithGithub(): void {
    const clientId = this.getGithubClientId();
    const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/github/callback`);
    const scope = encodeURIComponent('user:email');
    window.location.href =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  }

  /**
   * Sign in with Facebook using the Facebook JS SDK popup.
   */
  loginWithFacebook(): void {
    const FB = (window as any).FB;
    if (!FB) {
      console.error('Facebook SDK not loaded');
      return;
    }

    FB.login((response: any) => {
      if (response.authResponse?.accessToken) {
        this.handleOAuthResponse('facebook', { accessToken: response.authResponse.accessToken });
      } else {
        console.warn('Facebook login cancelled or failed');
      }
    }, { scope: 'email,public_profile' });
  }

  /** Shared handler — POSTs provider token to backend, stores JWT, redirects. */
  private handleOAuthResponse(provider: string, payload: Record<string, string>): void {
    this.isLoading.set(true);
    this.http.post<AuthResponse>(`${this.apiUrl}/oauth/${provider}`, payload).subscribe({
      next: (res) => {
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('userId',    res.userId);
        this.isAuthenticated.set(true);
        this.loadCurrentUser().subscribe({
          next:  (user) => { this.isLoading.set(false); this.redirectByRole(user.role); },
          error: ()     => { this.isLoading.set(false); }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(`${provider} OAuth failed:`, err.error?.error ?? err.message);
      }
    });
  }

  // ── OAuth client-id helpers (read from meta tags injected by index.html) ──

  private getGoogleClientId(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="google-client-id"]')?.content ?? '';
  }

  private getGithubClientId(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="github-client-id"]')?.content ?? '';
  }

  /**
   * Check if current user is seller/provider
   */
  isSeller(): boolean {
    const user = this.currentUser();
    return user?.roles?.includes(UserRole.PROVIDER) || false;
  }
}

