import { Injectable, signal, OnDestroy } from '@angular/core';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';
import { 
  AppNotification, 
  NotificationType, 
  NotificationFilter,
  WebSocketMessage,
  NotificationSettings 
} from '../models/notification.model';

export interface NotificationListResponse {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private readonly apiUrl = '/api/notifications'; // TODO: Configure environment
  private readonly wsUrl = 'ws://localhost:8080/ws'; // TODO: Configure environment

  // WebSocket connection
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  // Reactive state
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly isConnected = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  // Subjects for real-time events
  private readonly notificationSubject = new Subject<AppNotification>();
  private readonly connectionSubject = new BehaviorSubject<boolean>(false);

  // Observable streams
  readonly notification$ = this.notificationSubject.asObservable();
  readonly connectionStatus$ = this.connectionSubject.asObservable();

  constructor() {
    // TODO: Auto-connect when user is authenticated
  }

  /**
   * Connect to WebSocket server
   * @param token - Authentication token
   */
  connect(token: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // TODO: Implement actual WebSocket connection
      // this.socket = new WebSocket(`${this.wsUrl}?token=${token}`);
      // this.setupSocketListeners();
      console.log('NotificationService.connect() called - WebSocket connection placeholder');
      this.isConnected.set(true);
      this.connectionSubject.next(true);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect(token);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected.set(false);
    this.connectionSubject.next(false);
    this.reconnectAttempts = 0;
    console.log('NotificationService.disconnect() called');
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected.set(true);
      this.connectionSubject.next(true);
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected.set(false);
      this.connectionSubject.next(false);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.event) {
      case 'notification':
        const notification = message.data as AppNotification;
        this.addNotification(notification);
        this.notificationSubject.next(notification);
        break;
      case 'unread_count':
        this.unreadCount.set(message.data as number);
        break;
      default:
        console.log('Unknown WebSocket event:', message.event);
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(token), this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Add notification to local state
   */
  private addNotification(notification: AppNotification): void {
    this.notifications.update(current => [notification, ...current]);
    if (!notification.isRead) {
      this.unreadCount.update(count => count + 1);
    }
  }

  /**
   * Get all notifications for current user
   * @param filter - Optional filter parameters
   * @returns Observable with paginated notification list
   */
  getNotifications(filter?: NotificationFilter): Observable<NotificationListResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.get<NotificationListResponse>(this.apiUrl, { params: ... });
    console.log('NotificationService.getNotifications() called with filter:', filter);
    return of({ notifications: [], total: 0, unreadCount: 0, page: 1, totalPages: 0 });
  }

  /**
   * Mark a notification as read
   * @param notificationId - Notification ID
   * @returns Observable with updated notification
   */
  markAsRead(notificationId: string): Observable<AppNotification> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<AppNotification>(`${this.apiUrl}/${notificationId}/read`, {});
    console.log('NotificationService.markAsRead() called with:', notificationId);
    
    // Update local state
    this.notifications.update(current => 
      current.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    this.unreadCount.update(count => Math.max(0, count - 1));
    
    return of({} as AppNotification);
  }

  /**
   * Mark all notifications as read
   * @returns Observable with success status
   */
  markAllAsRead(): Observable<{ success: boolean }> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<{ success: boolean }>(`${this.apiUrl}/read-all`, {});
    console.log('NotificationService.markAllAsRead() called');
    
    // Update local state
    this.notifications.update(current => 
      current.map(n => ({ ...n, isRead: true }))
    );
    this.unreadCount.set(0);
    
    return of({ success: true });
  }

  /**
   * Delete a notification
   * @param notificationId - Notification ID
   * @returns Observable with void on success
   */
  deleteNotification(notificationId: string): Observable<void> {
    // TODO: Implement actual HTTP call
    // return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
    console.log('NotificationService.deleteNotification() called with:', notificationId);
    
    // Update local state
    this.notifications.update(current => 
      current.filter(n => n.id !== notificationId)
    );
    
    return of(void 0);
  }

  /**
   * Get notification preferences
   * @returns Observable with notification preferences
   */
  getPreferences(): Observable<NotificationSettings> {
    // TODO: Implement actual HTTP call
    // return this.http.get<NotificationSettings>(`${this.apiUrl}/preferences`);
    console.log('NotificationService.getPreferences() called');
    return of({
      email: true,
      push: true,
      inApp: true,
      orderUpdates: true,
      promotions: true,
      messages: true,
      systemAlerts: true
    });
  }

  /**
   * Update notification preferences
   * @param preferences - New preferences
   * @returns Observable with updated preferences
   */
  updatePreferences(preferences: Partial<NotificationSettings>): Observable<NotificationSettings> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<NotificationSettings>(`${this.apiUrl}/preferences`, preferences);
    console.log('NotificationService.updatePreferences() called with:', preferences);
    return of({} as NotificationSettings);
  }

  /**
   * Show browser notification (if permission granted)
   */
  showBrowserNotification(title: string, body: string, icon?: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    }
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.notificationSubject.complete();
    this.connectionSubject.complete();
  }
}
