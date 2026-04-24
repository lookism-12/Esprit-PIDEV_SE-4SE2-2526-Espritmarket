import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserNotificationSettings } from '../models/notification.model';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class NotificationSettingsService {
  private readonly apiUrl = `${environment.apiUrl}/notifications/settings`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<UserNotificationSettings> {
    return this.http.get<UserNotificationSettings>(this.apiUrl);
  }

  updateSettings(settings: UserNotificationSettings): Observable<UserNotificationSettings> {
    return this.http.put<UserNotificationSettings>(this.apiUrl, settings);
  }
}
