import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environment';

/** Matches backend UserDTO exactly */
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];          // e.g. ["CLIENT"], ["ADMIN"], ["PROVIDER"]
  enabled: boolean;
  address?: string;
  businessName?: string;
  businessType?: string;
  taxId?: string;
  description?: string;
  drivingLicenseNumber?: string;
  vehicleType?: string;
  deliveryZone?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Spring Page wrapper */
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  /**
   * Fetch all users from the backend (paginated, up to 500 per call).
   * Returns a flat array for the admin table.
   */
  getAllUsers(params?: { role?: string; limit?: number }): Observable<{ users: AdminUser[]; total: number }> {
    let httpParams = new HttpParams()
      .set('page', '0')
      .set('size', String(params?.limit ?? 500));
    if (params?.role) {
      httpParams = httpParams.set('role', params.role);
    }
    return this.http.get<PageResponse<AdminUser>>(this.apiUrl, { params: httpParams }).pipe(
      map(page => ({ users: page.content, total: page.totalElements }))
    );
  }

  /** Delete a user by ID */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Toggle enabled/disabled — uses PATCH /api/users/me workaround via admin endpoint */
  toggleEnabled(id: string, enabled: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/enabled`, { enabled });
  }
}
