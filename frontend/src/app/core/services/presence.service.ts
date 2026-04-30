import { Injectable, inject, signal, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatService } from './chat.service';
import { Subscription, fromEvent, merge, interval } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { environment } from '../../../environment';

export type UserStatus = 'online' | 'away' | 'offline';

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
  private http = inject(HttpClient);
  private chatService = inject(ChatService);
  private zone = inject(NgZone);

  private get backendUrl(): string { return environment.apiUrl.replace('/api', ''); }
  /** AWAY threshold in ms — matches backend */
  private readonly AWAY_MS = 60_000;
  /** Heartbeat interval in ms */
  private readonly HEARTBEAT_MS = 30_000;

  /** userId → status map, updated in real-time */
  readonly statusMap = signal<Record<string, UserStatus>>({});

  private currentUserId = '';
  private subs = new Subscription();
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // ── Initialise (call once after STOMP connects) ───────────────────────

  init(userId: string) {
    if (!userId || this.currentUserId === userId) return;
    this.currentUserId = userId;

    // Subscribe to global presence broadcast
    this.subs.add(
      this.chatService.presence$.subscribe(update => {
        this.statusMap.update(m => ({ ...m, [update.userId]: update.status as UserStatus }));
      })
    );

    // Inactivity detection — runs outside Angular to avoid change-detection overhead
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll')
      ).pipe(throttleTime(5000)); // at most one event per 5 s

      this.subs.add(
        activity$.subscribe(() => this.zone.run(() => this.onActivity()))
      );
    });

    // Heartbeat — keeps the backend inactivity timer alive
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_MS);

    // Announce online immediately
    this.chatService.sendPresence(userId, 'online');
    this.resetInactivityTimer();

    // Announce offline on tab/window close
    window.addEventListener('beforeunload', () => {
      this.chatService.sendPresence(userId, 'offline');
    });
  }

  // ── Bulk fetch for inbox ──────────────────────────────────────────────

  fetchBulkStatus(userIds: string[]): void {
    if (!userIds.length) return;
    this.http.post<Record<string, string>>(
      `${this.backendUrl}/api/chat/presence/bulk`, userIds
    ).subscribe({
      next: (map) => {
        this.statusMap.update(current => ({ ...current, ...map as Record<string, UserStatus> }));
      },
      error: () => { /* non-critical */ }
    });
  }

  getStatus(userId: string): UserStatus {
    return this.statusMap()[userId] ?? 'offline';
  }

  // ── Internal ──────────────────────────────────────────────────────────

  private onActivity() {
    if (!this.currentUserId) return;
    this.resetInactivityTimer();
    // If we were away, come back online
    if (this.statusMap()[this.currentUserId] === 'away') {
      this.chatService.sendPresence(this.currentUserId, 'online');
    }
  }

  private resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      if (this.currentUserId) {
        this.chatService.sendPresence(this.currentUserId, 'away');
        this.statusMap.update(m => ({ ...m, [this.currentUserId]: 'away' }));
      }
    }, this.AWAY_MS);
  }

  private sendHeartbeat() {
    if (!this.chatService['stompClient']?.connected) return;
    try {
      this.chatService['stompClient'].publish({
        destination: '/app/chat.heartbeat',
        body: JSON.stringify({ userId: this.currentUserId })
      });
    } catch (_) { /* ignore */ }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }
}
