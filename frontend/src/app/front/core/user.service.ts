import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, UserRole, UserPreferences } from '../models/user.model';
import { environment } from '../../../environment';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserFilter {
  role?: UserRole;
  search?: string;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  // Reactive state
  readonly currentProfile = signal<User | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private http = inject(HttpClient);

  constructor() {}

  /**
   * Get current user's profile
   * @returns Observable with user profile
   */
  getProfile(): Observable<User> {
    this.isLoading.set(true);
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * Update current user's profile
   * @param data - Profile update data (partial update via PATCH)
   * @returns Observable with updated user
   */
  updateProfile(data: UpdateProfileRequest): Observable<User> {
    this.isLoading.set(true);
    
    const endpoint = `${this.apiUrl}/me`;
    
    return this.http.patch<User>(endpoint, data).pipe(
      tap(response => {
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('❌ Profile update failed:', error);
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * Upload user avatar
   * @param file - Image file to upload
   * @returns Observable with uploaded image URL
   */
  uploadAvatar(file: File): Observable<{ url: string }> {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Validate file type on client side
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image (JPG, PNG, etc.)');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    console.log('📤 Uploading file with details:');
    console.log('  File name:', file.name);
    console.log('  File size:', (file.size / 1024 / 1024).toFixed(2) + ' MB');
    console.log('  Content type:', file.type);

    const formData = new FormData();
    formData.append('file', file);
    
    console.log('📦 FormData prepared, sending POST to /me/avatar');

    return this.http.post<{ url: string }>(`${this.apiUrl}/me/avatar`, formData);
  }

  /**
   * Change user password
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Observable with success status
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/me/password`, {
      currentPassword,
      newPassword
    });
  }

  toggleNotifications(): Observable<{ notificationsEnabled: boolean }> {
    return this.http.patch<{ notificationsEnabled: boolean }>(`${this.apiUrl}/me/notifications/toggle`, null);
  }

  toggleInternalNotifications(): Observable<{ internalNotificationsEnabled: boolean }> {
    return this.http.patch<{ internalNotificationsEnabled: boolean }>(`${this.apiUrl}/me/notifications/internal/toggle`, null);
  }

  toggleExternalNotifications(): Observable<{ externalNotificationsEnabled: boolean }> {
    return this.http.patch<{ externalNotificationsEnabled: boolean }>(`${this.apiUrl}/me/notifications/external/toggle`, null);
  }

  /**
   * Delete user account (self or admin)
   * @param userId - User ID to delete (optional, defaults to current user)
   * @returns Observable with void on success
   */
  deleteAccount(userId?: string): Observable<void> {
    const endpoint = userId ? `${this.apiUrl}/${userId}` : `${this.apiUrl}/me`;
    return this.http.delete<void>(endpoint);
  }

  /**
   * Get all users (admin only)
   * @param filter - Optional filter parameters
   * @returns Observable with paginated user list
   */
  getAllUsers(filter?: UserFilter): Observable<UserListResponse> {
    let params = new HttpParams();
    if (filter?.role) params = params.set('role', filter.role);
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.isVerified !== undefined) params = params.set('isVerified', filter.isVerified.toString());
    if (filter?.page) params = params.set('page', filter.page.toString());
    if (filter?.limit) params = params.set('limit', filter.limit.toString());
    
    return this.http.get<UserListResponse>(this.apiUrl, { params });
  }

  /**
   * Get a user by ID (admin or public profile)
   * @param userId - User ID
   * @returns Observable with user data
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Update user role (admin only)
   * @param userId - User ID
   * @param role - New role to assign
   * @returns Observable with updated user
   */
  updateUserRole(userId: string, role: UserRole): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/role`, { role });
  }

  /**
   * Verify user email
   * @param token - Verification token
   * @returns Observable with success status
   */
  verifyEmail(token: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/me/verify`, { token });
  }

  /**
   * Request email verification
   * @returns Observable with success status
   */
  requestVerificationEmail(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/me/verify-request`, {});
  }
}
