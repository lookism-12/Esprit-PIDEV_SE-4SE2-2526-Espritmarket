import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject, take, of } from 'rxjs';
import { ChatConversation, ChatMessage, ChatMessagePayload, ChatUser } from '../models/chat.models';
import { ChatUserService } from './chat-user.service';

export interface ActivePopup {
  conversationId: string;
  targetUser: ChatUser;
  flameLevel: number;
  minimized?: boolean; // New state
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private chatUserService = inject(ChatUserService);

  private stompClient: Client | null = null;

  private incomingMessageSubject = new Subject<ChatMessage>();
  public incomingMessage$ = this.incomingMessageSubject.asObservable();

  private connectionStateSubject = new BehaviorSubject<boolean>(false);
  public connectionState$ = this.connectionStateSubject.asObservable();

  // Map of conversationId → STOMP subscription object
  private subscriptions = new Map<string, any>();
  // Queued while STOMP is connecting
  private pendingSubscriptions = new Set<string>();
  private messageQueue: ChatMessagePayload[] = [];

  // ✅ Fixed: backend runs on 8090
  private backendUrl = 'http://localhost:8090';

  // --- UI State Signals ---
  public isInboxOpen = signal<boolean>(false);
  public activePopups = signal<ActivePopup[]>([]);
  public unreadTotal = signal<number>(0);

  // ─────────────────────────────────────────────────────────────────────────
  // STOMP Connection
  // ─────────────────────────────────────────────────────────────────────────

  connect(userId: string) {
    // Don't create a second client if already active
    if (this.stompClient && this.stompClient.active) return;

    (window as any).global = window; // sockjs-client polyfill

    this.stompClient = new Client({
      // Use a factory so every reconnect creates a fresh SockJS socket
      webSocketFactory: () => new SockJS(`${this.backendUrl}/ws`) as any,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.stompClient.onConnect = () => {
      this.connectionStateSubject.next(true);
      console.log('✅ STOMP connected');

      // Drain pending subscription queue
      this.pendingSubscriptions.forEach(convId => this._doSubscribe(convId));
      this.pendingSubscriptions.clear();

      // Drain pending message queue
      const msgs = [...this.messageQueue];
      this.messageQueue = [];
      msgs.forEach(p => this.sendMessage(p));

      // Re-subscribe any popup that lost its subscription on reconnect
      this.activePopups().forEach(p => {
        if (!this.subscriptions.has(p.conversationId)) {
          this._doSubscribe(p.conversationId);
        }
      });
    };

    this.stompClient.onDisconnect = () => {
      this.connectionStateSubject.next(false);
      this.subscriptions.clear(); // All STOMP subs are dead on disconnect
      console.warn('⚠️ STOMP disconnected');
    };

    this.stompClient.onWebSocketError = (event) => {
      console.error('WebSocket error', event);
    };

    this.stompClient.activate();
  }

  disconnect() {
    this.stompClient?.deactivate();
    this.connectionStateSubject.next(false);
    this.subscriptions.clear();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Subscriptions
  // ─────────────────────────────────────────────────────────────────────────

  subscribeToConversation(conversationId: string) {
    if (!conversationId) return;
    if (this.subscriptions.has(conversationId)) return; // Already live

    // ✅ Use stompClient.connected (frame-level), not just .active (socket-level)
    const isConnected = this.stompClient?.connected ?? false;
    if (!isConnected) {
      this.pendingSubscriptions.add(conversationId);
      return;
    }

    this._doSubscribe(conversationId);
  }

  private _doSubscribe(conversationId: string) {
    if (!this.stompClient?.connected) return;
    if (this.subscriptions.has(conversationId)) return;

    try {
      const sub = this.stompClient.subscribe(
        `/topic/chat/${conversationId}`,
        (message: Message) => {
          if (message.body) {
            const chatMsg: ChatMessage = JSON.parse(message.body);
            this.incomingMessageSubject.next(chatMsg);
          }
        }
      );
      this.subscriptions.set(conversationId, sub);
      console.log(`📡 Subscribed to /topic/chat/${conversationId}`);
    } catch (e) {
      console.error('Subscribe error:', e);
      // Re-queue so it retries on next connect
      this.pendingSubscriptions.add(conversationId);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Messaging
  // ─────────────────────────────────────────────────────────────────────────

  sendMessage(payload: ChatMessagePayload) {
    const isConnected = this.stompClient?.connected ?? false;
    if (!isConnected) {
      this.messageQueue.push(payload);
      return;
    }
    try {
      this.stompClient!.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('Send error:', e);
      this.messageQueue.push(payload); // Retry on reconnect
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REST
  // ─────────────────────────────────────────────────────────────────────────

  getUserConversations(userId: string): Observable<ChatConversation[]> {
    if (!userId || userId === 'null') return of([]);
    return this.http.get<ChatConversation[]>(`${this.backendUrl}/api/messenger/conversations`, {
      params: { userId }
    });
  }

  getChatHistory(conversationId: string): Observable<ChatMessage[]> {
    if (!conversationId || conversationId === 'null') return of([]);
    return this.http.get<ChatMessage[]>(`${this.backendUrl}/api/messenger/history/${conversationId}`);
  }

  generateConversationId(userId1: string, userId2: string): string {
    return userId1.localeCompare(userId2) < 0
      ? `${userId1}_${userId2}`
      : `${userId2}_${userId1}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Popup Management
  // ─────────────────────────────────────────────────────────────────────────

  toggleInbox() {
    this.isInboxOpen.update(v => !v);
  }

  openChatPopup(currentUserId: string, targetUserId: string) {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    const convId = this.generateConversationId(currentUserId, targetUserId);

    // ✅ Strict guard: prevent duplicate entry in signal array (fixes NG0955)
    const existing = this.activePopups().some(p => p.conversationId === convId);
    if (existing) return;

    this.chatUserService.getUserById(targetUserId).pipe(take(1)).subscribe(targetUser => {
      // Double-check again inside async callback
      const alreadyAdded = this.activePopups().some(p => p.conversationId === convId);
      if (alreadyAdded) return;

      this.activePopups.update(popups => {
        const list = popups.length >= 3 ? popups.slice(1) : [...popups];
        return [...list, { conversationId: convId, targetUser, flameLevel: 0, minimized: false }];
      });

      this.subscribeToConversation(convId);
    });
  }

  toggleMinimize(conversationId: string) {
    this.activePopups.update(popups => 
      popups.map(p => p.conversationId === conversationId ? { ...p, minimized: !p.minimized } : p)
    );
  }

  closeChatPopup(conversationId: string) {
    this.activePopups.update(popups => popups.filter(p => p.conversationId !== conversationId));
    const sub = this.subscriptions.get(conversationId);
    if (sub) {
      try { sub.unsubscribe(); } catch (_) {}
      this.subscriptions.delete(conversationId);
    }
    this.pendingSubscriptions.delete(conversationId);
  }
}
