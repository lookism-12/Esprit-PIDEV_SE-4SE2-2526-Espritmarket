import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User, UserRole, UserPreferences } from '../models/user.model';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
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
  private readonly apiUrl = '/api/users'; // TODO: Configure environment

  // Reactive state
  readonly currentProfile = signal<User | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get current user's profile
   * @returns Observable with user profile
   */
  getProfile(): Observable<User> {
    // TODO: Implement actual HTTP call
    // return this.http.get<User>(`${this.apiUrl}/me`);
    console.log('UserService.getProfile() called');
    return of({} as User);
  }

  /**
   * Update current user's profile
   * @param data - Profile update data
   * @returns Observable with updated user
   */
  updateProfile(data: UpdateProfileRequest): Observable<User> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<User>(`${this.apiUrl}/me`, data);
    console.log('UserService.updateProfile() called with:', data);
    return of({} as User);
  }

  /**
   * Get all users (admin only)
   * @param filter - Optional filter parameters
   * @returns Observable with paginated user list
   */
  getAllUsers(filter?: UserFilter): Observable<UserListResponse> {
    // TODO: Implement actual HTTP call
    // let params = new HttpParams();
    // if (filter?.role) params = params.set('role', filter.role);
    // if (filter?.search) params = params.set('search', filter.search);
    // return this.http.get<UserListResponse>(this.apiUrl, { params });
    console.log('UserService.getAllUsers() called with filter:', filter);
    return of({ users: [], total: 0, page: 1, totalPages: 0 });
  }

  /**
   * Get a user by ID (admin or public profile)
   * @param userId - User ID
   * @returns Observable with user data
   */
  getUserById(userId: string): Observable<User> {
    // TODO: Implement actual HTTP call
    // return this.http.get<User>(`${this.apiUrl}/${userId}`);
    console.log('UserService.getUserById() called with:', userId);
    return of({} as User);
  }

  /**
   * Upload user avatar
   * @param file - Image file to upload
   * @returns Observable with uploaded image URL
   */
  uploadAvatar(file: File): Observable<{ url: string }> {
    // TODO: Implement actual HTTP call with FormData
    // const formData = new FormData();
    // formData.append('avatar', file);
    // return this.http.post<{ url: string }>(`${this.apiUrl}/me/avatar`, formData);
    console.log('UserService.uploadAvatar() called');
    return of({ url: '' });
  }

  /**
   * Change user password
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Observable with success status
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean }> {
    // TODO: Implement actual HTTP call
    // return this.http.post<{ success: boolean }>(`${this.apiUrl}/me/password`, {
    //   currentPassword,
    //   newPassword
    // });
    console.log('UserService.changePassword() called');
    return of({ success: false });
  }

  /**
   * Delete user account (self or admin)
   * @param userId - User ID to delete (optional, defaults to current user)
   * @returns Observable with void on success
   */
  deleteAccount(userId?: string): Observable<void> {
    // TODO: Implement actual HTTP call
    // const endpoint = userId ? `${this.apiUrl}/${userId}` : `${this.apiUrl}/me`;
    // return this.http.delete<void>(endpoint);
    console.log('UserService.deleteAccount() called with:', userId);
    return of(void 0);
  }

  /**
   * Update user role (admin only)
   * @param userId - User ID
   * @param role - New role to assign
   * @returns Observable with updated user
   */
  updateUserRole(userId: string, role: UserRole): Observable<User> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<User>(`${this.apiUrl}/${userId}/role`, { role });
    console.log('UserService.updateUserRole() called with:', userId, role);
    return of({} as User);
  }
}
