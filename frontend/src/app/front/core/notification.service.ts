import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, Subject } from 'rxjs';
import { AppNotification, NotificationResponse, NotificationType } from '../models/notification.model';
import { environment } from '../../../environment';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

export interface NotificationListResponse {
  notifications: AppNotification[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/legacy/notifications`;
  private readonly wsUrl = environment.apiUrl.replace('/api', '') + '/ws';

  private stompClient: Client | null = null;
  private liveSubject = new Subject<NotificationResponse>();

  constructor(private http: HttpClient) {}

  /** Connect to real-time notification stream for the given userId */
  connectToNotifications(userId: string): Observable<NotificationResponse> {
    this.disconnectWs();

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl) as any,
      reconnectDelay: 5000,
      onConnect: () => {
        this.stompClient!.subscribe(
          `/topic/notifications/${userId}`,
          (msg) => {
            const raw = JSON.parse(msg.body);
            const notification: NotificationResponse = {
              id:                  raw.id,
              type:                raw.type,
              title:               raw.title,
              message:             raw.description || raw.message || '',
              description:         raw.description || raw.message || '',
              read:                raw.read ?? false,
              isStarred:           raw.isStarred ?? false,
              isFollowed:          raw.isFollowed ?? false,
              active:              raw.notification_status ?? true,
              notification_status: raw.notification_status ?? true,
              linkedObjectId:      raw.linkedObjectId,
              createdAt:           raw.createdAt
            };
            this.liveSubject.next(notification);
          }
        );
      }
    });

    this.stompClient.activate();
    return this.liveSubject.asObservable();
  }

  disconnectWs(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }
    this.stompClient = null;
  }

  ngOnDestroy(): void {
    this.disconnectWs();
  }

  getNotifications(): Observable<{ notifications: AppNotification[] }> {
    return this.getMy().pipe(
      map((items) => ({ notifications: this.toAppNotifications(items) }))
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
    return this.http.get<NotificationResponse[]>(this.apiUrl).pipe(
      map((items) => items.filter((n) => (n as any).userId === userId))
    );
  }

  getMy(): Observable<NotificationResponse[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`).pipe(
      map(items => this.normalize(items))
    );
  }

  private normalize(items: any[]): NotificationResponse[] {
    return (items || []).map(i => ({
      id:                  i.id,
      type:                i.type,
      title:               i.title,
      message:             i.description || i.message || '',
      description:         i.description || i.message || '',
      read:                i.read ?? false,
      isStarred:           i.isStarred ?? false,
      isFollowed:          i.isFollowed ?? false,
      active:              i.notification_status ?? i.active ?? true,
      notification_status: i.notification_status ?? true,
      linkedObjectId:      i.linkedObjectId,
      createdAt:           i.createdAt
    }));
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
    // Use the already-loaded unread list — no extra GET request
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
      message: (i as any).description || i.message || '',
      description: (i as any).description || i.message || '',
      active: (i as any).notification_status ?? i.active ?? true
    }));
  }

  toggleStar(id: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.apiUrl}/${id}/star`, {});
  }

  toggleFollow(id: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.apiUrl}/${id}/follow`, {});
  }

  bulkRead(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-read`, ids);
  }

  bulkDelete(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-delete`, ids);
  }

  bulkStar(ids: string[], star: boolean): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-star`, { ids, star });
  }
}
