import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environment';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private router = inject(Router);

  // Reactive state - Signal for immediate UI updates
  readonly currentUser = signal<AdminUser | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  // BehaviorSubject for component subscriptions
  // This enables real-time synchronization across navbar, sidebar, etc.
  private userSubject = new BehaviorSubject<AdminUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.isAuthenticated.set(true);
      this.loadCurrentUser().subscribe({
        next: () => console.log('✅ Admin user restored from token'),
        error: () => this.logout()
      });
    }
  }

  /**
   * Load current user from backend and update both signal and subject
   * This ensures all components get real-time updates
   */
  loadCurrentUser(): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        // Convert relative avatar URL to absolute if needed
        if (user.avatarUrl && !user.avatarUrl.startsWith('http')) {
          const backendHost = environment.apiUrl.replace('/api', '');
          user.avatarUrl = backendHost + user.avatarUrl;
          console.log('✓ Admin avatar URL converted to absolute:', user.avatarUrl);
        }
        
        // Update BOTH signal and subject for synchronization
        this.currentUser.set(user);
        this.userSubject.next(user);  // ← KEY: Notify all subscribers
        this.isAuthenticated.set(true);
        
        console.log('✅ Admin user loaded and synchronized:', { 
          name: user.firstName + ' ' + user.lastName, 
          avatar: user.avatarUrl 
        });
      }),
      catchError((error) => {
        console.error('Failed to load admin user:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update user avatar URL immediately in both signal and subject
   * Called after successful avatar upload
   */
  updateUserAvatar(avatarUrl: string): void {
    const currentUserValue = this.currentUser();
    if (currentUserValue) {
      // Ensure URL is absolute
      let absoluteUrl = avatarUrl;
      if (!absoluteUrl.startsWith('http')) {
        const backendHost = environment.apiUrl.replace('/api', '');
        absoluteUrl = backendHost + absoluteUrl;
      }

      // Update user object
      const updatedUser = {
        ...currentUserValue,
        avatarUrl: absoluteUrl
      };

      // Update both signal and subject for instant synchronization
      this.currentUser.set(updatedUser);
      this.userSubject.next(updatedUser);  // ← KEY: Notify all subscribers instantly

      console.log('✅ Avatar updated in auth service:', absoluteUrl);
    }
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'AU';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getFullName(): string {
    const user = this.currentUser();
    if (!user) return 'Admin User';
    return `${user.firstName} ${user.lastName}`;
  }

  getEmail(): string {
    const user = this.currentUser();
    return user?.email || 'admin@esprit.tn';
  }

    logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    this.currentUser.set(null);
    this.userSubject.next(null);
    this.isAuthenticated.set(false);
    window.location.href = '/login';
  }
}
