import { Component, inject, OnInit, OnDestroy, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ActivePopup } from '../../../../core/services/chat.service';
import { AuthService } from '../../../core/auth.service';
import { ChatUserService } from '../../../../core/services/chat-user.service';
import { ChatConversation, ChatMessage } from '../../../../core/models/chat.models';
import { Subscription, of, catchError, take, interval, filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forum-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- FLOATING CHAT BUTTON (Premium Maroon/Gold Theme) -->
    <div class="fixed bottom-10 right-10 z-50">
      <button (click)="toggleInbox(); loadInbox()" 
              class="w-20 h-20 bg-gradient-to-tr from-[#800000] via-[#a52a2a] to-[#800000] text-white rounded-3xl shadow-[0_20px_50px_rgba(128,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative border-2 border-white/20 overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <svg class="w-10 h-10 group-hover:rotate-12 transition-transform relative z-10" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012-2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
        </svg>
        <div *ngIf="chatService.unreadTotal() > 0" class="absolute top-2 right-2 w-7 h-7 bg-[#E0B84A] text-[#800000] rounded-full border-4 border-white flex items-center justify-center text-[11px] font-black animate-bounce shadow-xl relative z-20">
          {{ chatService.unreadTotal() }}
        </div>
      </button>
    </div>

    <!-- INBOX PANEL (Premium Glassmorphism) -->
    @if (chatService.isInboxOpen()) {
      <div class="fixed bottom-36 right-10 w-[450px] bg-white/95 backdrop-blur-3xl rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden z-50 flex flex-col font-sans max-h-[700px] animate-in fade-in slide-in-from-bottom-12 duration-700">
        <div class="bg-gradient-to-br from-[#800000] via-[#a52a2a] to-[#500000] text-white p-10 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-[#E0B84A]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div class="relative z-10 flex justify-between items-center">
            <div>
              <h3 class="font-black text-3xl tracking-tighter flex items-center gap-4">
                <span class="bg-white/10 p-3 rounded-2xl backdrop-blur-xl border border-white/20">💬</span> Messenger
              </h3>
              <p class="text-[10px] text-[#E0B84A] uppercase tracking-[0.3em] font-black mt-3 opacity-90">Esprit Student Network</p>
            </div>
            <div class="flex gap-4">
              <button (click)="loadInbox()" class="bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all border border-white/10 group">
                <svg class="w-6 h-6 group-hover:rotate-180 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H15" stroke-width="3"></path></svg>
              </button>
              <button (click)="toggleInbox()" class="bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all border border-white/10">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="overflow-y-auto flex-1 bg-gray-50/30 custom-scrollbar p-6">
          @if (isInboxLoading()) {
            <div class="p-24 text-center">
               <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#800000] border-t-transparent mb-8"></div>
               <p class="text-gray-400 font-black uppercase tracking-widest text-xs">Authenticating connection...</p>
            </div>
          } @else if (inboxConversations().length === 0) {
            <div class="p-24 text-center opacity-40">
              <div class="text-8xl mb-8">📭</div>
              <p class="text-gray-500 font-black text-sm uppercase tracking-widest">No active conversations</p>
            </div>
          }
          
          <div class="space-y-4">
            @for (conv of inboxConversations(); track conv.conversationId) {
              <div (click)="openPopup(conv.otherUser?.id!)"
                class="flex items-center p-6 cursor-pointer bg-white rounded-[32px] hover:bg-gray-50 transition-all group border border-gray-100 hover:border-[#800000]/20 transform hover:-translate-y-1 shadow-sm hover:shadow-xl">
                <div class="relative">
                  <img [src]="getAvatarUrl(conv.otherUser?.profileImage)" class="w-20 h-20 rounded-[24px] object-cover shadow-lg border-2 border-white group-hover:rotate-3 transition-all">
                  <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
                </div>
                
                <div class="ml-6 flex-1 overflow-hidden">
                  <div class="flex justify-between items-baseline mb-2">
                    <h4 class="font-black text-dark text-lg truncate transition-colors">
                       {{ conv.otherUser?.fullName || 'Anonymous' }}
                    </h4>
                    <span class="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                       {{ conv.lastMessageDate | date:'HH:mm' }}
                    </span>
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-500 truncate mt-1 pr-4 font-semibold">{{ conv.lastMessageContent || 'Attachment sent' }}</p>
                    
                    <div *ngIf="conv.flameLevel > 0" class="flame-badge" [ngClass]="getFlameClass(conv.flameLevel)">
                       🔥 {{ conv.flameLevel }}
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- POPUPS CONTAINER -->
    <div class="fixed bottom-0 right-36 flex items-end gap-8 z-[49] pointer-events-none p-6">
      @for (popup of chatService.activePopups(); track popup.conversationId) {
        
        @if (popup.minimized) {
           <div (click)="toggleMinimize(popup.conversationId)" 
                class="w-20 h-20 bg-white rounded-[28px] shadow-2xl border-4 border-[#800000] cursor-pointer pointer-events-auto flex items-center justify-center relative hover:scale-110 hover:-translate-y-4 transition-all group overflow-visible">
                <img [src]="getAvatarUrl(popup.targetUser.profileImage)" class="w-full h-full object-cover rounded-[22px]">
                <div *ngIf="popup.flameLevel > 0" class="absolute -top-5 -right-5 bg-gradient-to-br from-[#800000] to-[#E0B84A] text-white rounded-2xl px-4 py-2 text-[12px] font-black border-4 border-white shadow-2xl animate-bounce">
                  🔥 {{ popup.flameLevel }}
                </div>
           </div>
        } @else {
          <div class="w-[400px] bg-white shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)] rounded-t-[44px] overflow-hidden flex flex-col h-[580px] pointer-events-auto border border-gray-100 transition-all animate-in slide-in-from-bottom-16 duration-700">
            <!-- Premium Header -->
            <div class="bg-gradient-to-r from-[#800000] to-[#a52a2a] text-white p-7 flex items-center justify-between shadow-2xl relative cursor-pointer" (click)="toggleMinimize(popup.conversationId)">
              <div class="flex items-center gap-5 overflow-hidden flex-1 relative z-10">
                <div class="relative">
                  <div class="absolute -inset-2 bg-[#E0B84A]/30 rounded-2xl blur-md"></div>
                  <img [src]="getAvatarUrl(popup.targetUser.profileImage)" class="relative w-14 h-14 rounded-2xl object-cover border-2 border-white/20">
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-black text-lg truncate leading-tight tracking-tight uppercase">{{ popup.targetUser.fullName }}</span>
                  <div class="flex items-center gap-3 mt-1.5">
                    <div *ngIf="popup.flameLevel > 0" class="flex items-center gap-2 bg-[#E0B84A] text-[#800000] px-3 py-1 rounded-lg">
                       <span class="text-sm">🔥</span>
                       <span class="text-[10px] font-black uppercase">Streak: {{ popup.flameLevel }}</span>
                    </div>
                    <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></span>
                    <span class="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Active Now</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 relative z-10">
                <button (click)="$event.stopPropagation(); toggleMinimize(popup.conversationId)" class="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 12H6" stroke-width="4" stroke-linecap="round"></path></svg>
                </button>
                <button (click)="$event.stopPropagation(); closePopup(popup.conversationId)" class="w-12 h-12 flex items-center justify-center hover:bg-red-600 rounded-2xl transition-all">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="4" stroke-linecap="round"></path></svg>
                </button>
              </div>
            </div>

            <!-- Messages Area (Modern Bubbles) -->
            <div class="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50 custom-scrollbar" [id]="'scroll-' + popup.conversationId">
              @for (msg of getMessages(popup.conversationId); track msg.id) {
                <div [class]="msg.senderId === currentUserId ? 'flex justify-end' : 'flex justify-start'">
                  <div [class]="msg.senderId === currentUserId 
                      ? 'message-sent-premium shadow-2xl shadow-[#800000]/10 group'
                      : 'message-received-premium shadow-xl shadow-gray-200/50 group'">
                    <p class="text-[15px] leading-relaxed font-semibold">{{ msg.content }}</p>
                    <div class="flex items-center gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span class="text-[9px] font-black tracking-widest uppercase">{{ msg.timestamp | date:'HH:mm' }}</span>
                      @if (msg.senderId === currentUserId) {
                        <svg class="w-4 h-4 text-[#E0B84A]" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Enhanced Input Area -->
            <div class="p-8 bg-white border-t border-gray-100">
              <form (ngSubmit)="sendMessage(popup.conversationId, popup.targetUser.id)" class="flex items-center gap-4 bg-gray-100/50 rounded-[28px] px-6 py-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#800000]/5 transition-all border border-gray-100">
                <input type="text" [(ngModel)]="draftMessages[popup.conversationId]" [name]="'msg-'+popup.conversationId"
                  placeholder="Express your thoughts..." class="flex-1 bg-transparent border-none text-sm outline-none font-bold text-dark h-12" autocomplete="off">
                <button type="submit" [disabled]="!draftMessages[popup.conversationId]?.trim()" 
                   class="bg-gradient-to-tr from-[#800000] to-[#a52a2a] text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-[#800000]/30 hover:scale-110 active:scale-95 disabled:opacity-20 transition-all">
                  <svg class="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                </button>
              </form>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
    
    .message-sent-premium {
      background: linear-gradient(135deg, #800000, #a52a2a);
      color: white; border-radius: 32px 32px 4px 32px;
      padding: 16px 24px; max-width: 80%;
      position: relative;
    }
    .message-received-premium {
      background: white; color: #1a1a1a; border-radius: 32px 32px 32px 4px;
      padding: 16px 24px; max-width: 80%; border: 1px solid #f1f5f9;
      position: relative;
    }
    
    .flame-badge {
      display: flex; align-items: center; gap: 6px; border: 1.5px solid #fde68a;
      background: #fef3c7; border-radius: 16px; padding: 6px 14px;
      font-size: 0.85rem; font-weight: 900; color: #b45309;
      animation: flamePulse 2s infinite ease-in-out;
    }
    
    @keyframes flamePulse {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(224,184,74,0)); }
      50%       { transform: scale(1.1); filter: drop-shadow(0 0 12px rgba(224,184,74,0.6)); }
    }
    
    .flame-hot { 
      background: #fefce8;
      border-color: #fde68a;
    }
    
    .flame-extreme {
      color: white !important;
      background: linear-gradient(135deg, #800000, #E0B84A) !important;
      border-color: transparent !important;
      animation: flamePulse 0.5s infinite !important;
    }

    .w-18 { width: 72px; }
    .h-18 { height: 72px; }
  `]
})
export class ForumChatWidget implements OnInit, OnDestroy {
  public chatService = inject(ChatService);
  private authService = inject(AuthService);
  private chatUserService = inject(ChatUserService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  currentUserId = '';
  inboxConversations = signal<ChatConversation[]>([]);
  messagesMap = signal<Record<string, ChatMessage[]>>({});
  draftMessages: Record<string, string> = {};
  isInboxLoading = signal<boolean>(false);

  private subs = new Subscription();
  private apiUrl = 'http://localhost:8090';

  constructor() {
    effect(() => {
      const popups = this.chatService.activePopups();
      popups.forEach(p => {
        if (!p.minimized && this.messagesMap()[p.conversationId] === undefined) {
          this.messagesMap.update(m => ({ ...m, [p.conversationId]: [] }));
          this.loadHistory(p.conversationId);
        }
      });
      this.persistState();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.currentUserId = this.authService.getUserId() || localStorage.getItem('userId') || '';
    
    if (this.currentUserId) {
        this.initializeChat();
    } else {
        const pollSub = interval(500).pipe(
            filter(() => !!(this.authService.getUserId() || localStorage.getItem('userId'))),
            take(1)
        ).subscribe(() => {
            this.currentUserId = this.authService.getUserId() || localStorage.getItem('userId') || '';
            this.initializeChat();
        });
        this.subs.add(pollSub);
    }

    this.subs.add(
      this.chatService.incomingMessage$.subscribe(msg => {
        this.messagesMap.update(map => {
          const currentList = map[msg.conversationId] || [];
          if (currentList.find(m => m.id === msg.id)) return map;
          return { ...map, [msg.conversationId]: [...currentList, msg] };
        });
        this.scrollPopup(msg.conversationId);
        this.loadInbox();
        if (!this.chatService.isInboxOpen()) {
          this.chatService.unreadTotal.update(v => v + 1);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private initializeChat() {
    if (!this.currentUserId) return;
    this.chatService.connect(this.currentUserId);
    this.restoreState();
    setTimeout(() => this.loadInbox(), 500);
  }

  loadInbox() {
    if (!this.currentUserId) return;
    this.isInboxLoading.set(true);
    
    this.http.get<ChatConversation[]>(`${this.apiUrl}/api/chat/conversations`, {
      params: { userId: this.currentUserId }
    })
      .pipe(catchError(() => of([])))
      .subscribe({
        next: (convs) => {
          convs.forEach(conv => {
            this.chatService.subscribeToConversation(conv.conversationId);
            const otherId = conv.user1Id === this.currentUserId ? conv.user2Id : conv.user1Id;
            this.chatUserService.getUserById(otherId).pipe(take(1)).subscribe(u => {
              conv.otherUser = u;
              this.inboxConversations.update(items => [...items]);
              this.cdr.detectChanges();
            });
          });
          
          convs.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
          this.inboxConversations.set(convs);
          this.isInboxLoading.set(false);
          this.chatService.unreadTotal.set(0);
          this.cdr.detectChanges();
        }
      });
  }

  loadHistory(conversationId: string) {
    if (!conversationId) return;
    this.http.get<ChatMessage[]>(`${this.apiUrl}/api/chat/history/${conversationId}`)
      .pipe(catchError(() => of([])))
      .subscribe(hist => {
        this.messagesMap.update(m => ({ ...m, [conversationId]: hist }));
        this.scrollPopup(conversationId);
        this.cdr.detectChanges();
      });
  }

  getMessages(connId: string): ChatMessage[] {
    return this.messagesMap()[connId] || [];
  }

  getAvatarUrl(avatar: string | undefined): string {
    if (!avatar) return 'assets/images/default-avatar.png';
    return avatar.startsWith('http') ? avatar : `/uploads/avatars/${avatar}`;
  }

  getFlameClass(level: number) {
    if (level >= 7) return 'flame-extreme';
    if (level >= 3) return 'flame-hot';
    return '';
  }

  toggleInbox() { 
    this.chatService.toggleInbox(); 
    if (this.chatService.isInboxOpen()) this.chatService.unreadTotal.set(0);
  }

  toggleMinimize(conversationId: string) { this.chatService.toggleMinimize(conversationId); }

  openPopup(targetUserId: string) {
    this.chatService.isInboxOpen.set(false);
    this.chatService.openChatPopup(this.currentUserId, targetUserId);
  }

  closePopup(conversationId: string) { this.chatService.closeChatPopup(conversationId); }

  sendMessage(conversationId: string, receiverId: string) {
    const text = this.draftMessages[conversationId];
    if (!text?.trim()) return;

    // Optimistic UI
    const optimisticMsg: ChatMessage = {
       id: 'tmp-' + Date.now(),
       conversationId,
       senderId: this.currentUserId,
       receiverId,
       content: text,
       timestamp: new Date().toISOString()
    };
    
    this.messagesMap.update(map => ({
       ...map,
       [conversationId]: [...(map[conversationId] || []), optimisticMsg]
    }));

    this.chatService.sendMessage({ 
      conversationId, 
      senderId: this.currentUserId, 
      receiverId, 
      content: text 
    });
    this.draftMessages[conversationId] = '';
    this.scrollPopup(conversationId);
  }

  private persistState() {
    const popups = this.chatService.activePopups().map(p => ({ id: p.targetUser.id, min: !!p.minimized }));
    localStorage.setItem('chat_popups_state_active', JSON.stringify(popups));
  }

  private restoreState() {
    const saved = localStorage.getItem('chat_popups_state_active');
    if (!saved) return;
    try {
        const states = JSON.parse(saved) as {id: string, min: boolean}[];
        states.forEach(s => {
          this.chatService.openChatPopup(this.currentUserId, s.id);
          if (s.min) {
            const convId = this.chatService.generateConversationId(this.currentUserId, s.id);
            setTimeout(() => this.chatService.toggleMinimize(convId), 2000);
          }
        });
    } catch (e) {
        console.error('State recovery failed', e);
    }
  }

  private scrollPopup(conversationId: string) {
    setTimeout(() => {
      const el = document.getElementById('scroll-' + conversationId);
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}
