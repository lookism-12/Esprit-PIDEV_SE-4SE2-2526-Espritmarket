import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';

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
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth'; // TODO: Configure environment

  // Reactive state
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {
    // TODO: Check localStorage for existing token on init
  }

  /**
   * Authenticate user with email and password
   * @param credentials - Login credentials
   * @returns Observable with auth response
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials);
    console.log('AuthService.login() called with:', credentials);
    return of({} as AuthResponse);
  }

  /**
   * Log out current user and clear tokens
   */
  logout(): void {
    // TODO: Implement logout logic
    // - Clear localStorage tokens
    // - Reset signals
    // - Optionally call backend to invalidate token
    console.log('AuthService.logout() called');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  /**
   * Register a new user account
   * @param data - Registration data
   * @returns Observable with auth response
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
    console.log('AuthService.register() called with:', data);
    return of({} as AuthResponse);
  }

  /**
   * Refresh the access token using refresh token
   * @returns Observable with new tokens
   */
  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    // TODO: Implement token refresh logic
    // const refreshToken = localStorage.getItem('refreshToken');
    // return this.http.post<{accessToken: string; refreshToken: string}>(`${this.apiUrl}/refresh`, { refreshToken });
    console.log('AuthService.refreshToken() called');
    return of({ accessToken: '', refreshToken: '' });
  }

  /**
   * Check if user has a valid token stored
   * @returns boolean indicating if user appears to be logged in
   */
  hasStoredToken(): boolean {
    // TODO: Check localStorage for valid token
    return false;
  }

  /**
   * Get the current access token
   * @returns The stored access token or null
   */
  getAccessToken(): string | null {
    // TODO: Return token from localStorage
    return null;
  }
}
