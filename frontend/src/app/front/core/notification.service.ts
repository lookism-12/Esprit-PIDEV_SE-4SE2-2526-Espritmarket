import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { AppNotification, NotificationResponse, NotificationType } from '../models/notification.model';
import { environment } from '../../../environment';

export interface NotificationListResponse {
  notifications: AppNotification[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/legacy/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<{ notifications: AppNotification[] }> {
    return this.getMy().pipe(
      map((items) => ({
        notifications: this.toAppNotifications(items)
      }))
    );
  }

  getAllAdmin(): Observable<AppNotification[]> {
    return this.http.get<NotificationResponse[]>(this.apiUrl).pipe(
      map((items) => this.toAppNotifications(items))
    );
  }

  getByUser(userId: string): Observable<NotificationResponse[]> {
    if (userId === 'me') {
      return this.getMy();
    }
    return this.http.get<NotificationResponse[]>(`${this.apiUrl}`).pipe(
      map((items) => items.filter((n) => (n as any).userId === userId))
    );
  }

  getMy(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.apiUrl}/my`);
  }

  markAsRead(notificationId: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.apiUrl}/${notificationId}/read`, null);
  }

  deactivate(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.deactivate(notificationId);
  }

  markAllAsRead(): Observable<{ success: boolean }> {
    return this.getMy().pipe(
      switchMap((items) => {
        const unread = items.filter((n) => !n.read);
        if (unread.length === 0) {
          return of({ success: true });
        }
        return forkJoin(unread.map((n) => this.markAsRead(n.id))).pipe(
          map(() => ({ success: true }))
        );
      })
    );
  }

  broadcast(payload: Partial<AppNotification>): Observable<AppNotification> {
    return this.http.post<AppNotification>(`${this.apiUrl}/broadcast`, payload);
  }

  private toAppNotifications(items: NotificationResponse[]): AppNotification[] {
    return items.map((i) => ({
      ...i,
      // Backend sends 'description', frontend template uses both 'message' and 'description'
      message: (i as any).description || i.message || '',
      description: (i as any).description || i.message || '',
      active: (i as any).notification_status ?? i.active ?? true
    }));
  }
}
