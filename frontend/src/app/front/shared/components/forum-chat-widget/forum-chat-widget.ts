import { Component, inject, OnInit, OnDestroy, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ActivePopup } from '../../../../core/services/chat.service';
import { AuthService } from '../../../core/auth.service';
import { ChatUserService } from '../../../../core/services/chat-user.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { CallService, CallType } from '../../../../core/services/call.service';
import { MediaStreamDirective } from '../../../../core/directives/media-stream.directive';
import { ChatConversation, ChatMessage } from '../../../../core/models/chat.models';
import { Subscription, of, catchError, take, interval, filter, Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-forum-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaStreamDirective],
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
                  <!-- ✅ Real-time presence dot -->
                  <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm"
                       [class.bg-green-500]="presenceService.getStatus(conv.otherUser?.id || '') === 'online'"
                       [class.bg-yellow-400]="presenceService.getStatus(conv.otherUser?.id || '') === 'away'"
                       [class.bg-gray-400]="presenceService.getStatus(conv.otherUser?.id || '') === 'offline'">
                  </div>
                </div>
                
                <div class="ml-6 flex-1 overflow-hidden">
                  <div class="flex justify-between items-baseline mb-2">
                    <h4 class="font-black text-dark text-lg truncate transition-colors">
                       {{ conv.otherUser?.fullName || 'Anonymous' }}
                    </h4>
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
                  <!-- Presence dot on popup header -->
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                       [class.bg-green-400]="presenceService.getStatus(popup.targetUser.id) === 'online'"
                       [class.bg-yellow-300]="presenceService.getStatus(popup.targetUser.id) === 'away'"
                       [class.bg-gray-400]="presenceService.getStatus(popup.targetUser.id) === 'offline'">
                  </div>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-black text-lg truncate leading-tight tracking-tight uppercase">{{ popup.targetUser.fullName }}</span>
                  <div class="flex items-center gap-3 mt-1.5">
                    <div *ngIf="popup.flameLevel > 0" class="flex items-center gap-2 bg-[#E0B84A] text-[#800000] px-3 py-1 rounded-lg">
                       <span class="text-sm">🔥</span>
                       <span class="text-[10px] font-black uppercase">Streak: {{ popup.flameLevel }}</span>
                    </div>
                    <!-- Status label: online / away / last seen X ago -->
                    <span class="text-[10px] font-black uppercase tracking-[0.2em]"
                          [class.text-green-300]="presenceService.getStatus(popup.targetUser.id) === 'online'"
                          [class.text-yellow-200]="presenceService.getStatus(popup.targetUser.id) === 'away'"
                          [class.text-white/50]="presenceService.getStatus(popup.targetUser.id) === 'offline'">
                      {{ getPresenceLabel(popup) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 relative z-10">
                <!-- Voice call button -->
                <button (click)="$event.stopPropagation(); startCall(popup, 'audio')"
                        title="Voice call"
                        class="w-11 h-11 flex items-center justify-center hover:bg-white/20 rounded-2xl transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </button>
                <!-- Video call button -->
                <button (click)="$event.stopPropagation(); startCall(popup, 'video')"
                        title="Video call"
                        class="w-11 h-11 flex items-center justify-center hover:bg-white/20 rounded-2xl transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                      d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
                <button (click)="$event.stopPropagation(); toggleMinimize(popup.conversationId)" class="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 12H6" stroke-width="4" stroke-linecap="round"></path></svg>
                </button>
                <button (click)="$event.stopPropagation(); closePopup(popup.conversationId)" class="w-11 h-11 flex items-center justify-center hover:bg-red-600 rounded-2xl transition-all">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="4" stroke-linecap="round"></path></svg>
                </button>
              </div>
            </div>

            <!-- Messages Area (Modern Bubbles) -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar" [id]="'scroll-' + popup.conversationId">
              @for (msg of getMessages(popup.conversationId); track msg.id) {
                <div [class]="msg.senderId === currentUserId ? 'flex justify-end' : 'flex justify-start'">
                  @if (msg.messageType === 'voice') {
                    <!-- Voice message bubble -->
                    <div [class]="msg.senderId === currentUserId
                        ? 'voice-bubble-sent group'
                        : 'voice-bubble-received group'">
                      <div class="flex items-center gap-3">
                        <button (click)="playVoiceMessage(msg)"
                                class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                [class.bg-white/30]="msg.senderId === currentUserId"
                                [class.bg-[#800000]/10]="msg.senderId !== currentUserId">
                          <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                          </svg>
                        </button>
                        <div class="flex-1 min-w-[100px]">
                          <div class="h-1 rounded-full" [class.bg-white/40]="msg.senderId === currentUserId" [class.bg-gray-300]="msg.senderId !== currentUserId">
                            <div class="h-full rounded-full w-0 transition-all duration-300"
                                 [class.bg-white]="msg.senderId === currentUserId"
                                 [class.bg-[#800000]]="msg.senderId !== currentUserId"
                                 [style.width]="getVoiceProgress(msg.id || '') + '%'">
                            </div>
                          </div>
                          <span class="text-[10px] font-bold mt-1 block opacity-70">
                            {{ callService.formatDuration(msg.voiceDuration || 0) }}
                          </span>
                        </div>
                        <svg class="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                        </svg>
                      </div>
                      <div class="flex items-center gap-2 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-[9px] font-black tracking-widest uppercase">{{ msg.timestamp | date:'HH:mm' }}</span>
                        @if (msg.senderId === currentUserId) {
                          <span class="text-[10px] font-black" [class.text-yellow-300]="msg.status === 'SEEN'">{{ getStatusIcon(msg) }}</span>
                        }
                      </div>
                    </div>
                  } @else {
                    <!-- Text message bubble -->
                    <div [class]="msg.senderId === currentUserId
                        ? 'message-sent-premium shadow-2xl shadow-[#800000]/10 group'
                        : 'message-received-premium shadow-xl shadow-gray-200/50 group'">
                      <p class="text-[14px] leading-relaxed font-semibold">{{ msg.content }}</p>
                      <div class="flex items-center gap-2 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-[9px] font-black tracking-widest uppercase">{{ msg.timestamp | date:'HH:mm' }}</span>
                        @if (msg.senderId === currentUserId) {
                          <span class="text-[10px] font-black" [class.text-yellow-300]="msg.status === 'SEEN'">{{ getStatusIcon(msg) }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Typing indicator -->
              @if (isTyping(popup.conversationId)) {
                <div class="flex justify-start">
                  <div class="message-received-premium shadow-xl shadow-gray-200/50 flex items-center gap-2 py-3 px-5">
                    <span class="typing-dot"></span>
                    <span class="typing-dot" style="animation-delay:0.2s"></span>
                    <span class="typing-dot" style="animation-delay:0.4s"></span>
                  </div>
                </div>
              }
            </div>

            <!-- Enhanced Input Area -->
            <div class="p-5 bg-white border-t border-gray-100">
              <!-- Voice recording bar -->
              @if (callService.isRecording()) {
                <div class="flex items-center gap-4 bg-red-50 border border-red-200 rounded-[24px] px-5 py-3 mb-3 animate-pulse">
                  <div class="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  <span class="text-red-600 font-black text-sm flex-1">Recording... {{ callService.formatDuration(callService.recordingDuration()) }}</span>
                  <button (click)="cancelRecording(popup.conversationId)" class="text-gray-400 hover:text-gray-600 font-black text-xs uppercase">Cancel</button>
                  <button (click)="stopAndSendRecording(popup.conversationId, popup.targetUser.id)"
                          class="bg-red-500 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-red-600 transition-all">
                    Send
                  </button>
                </div>
              }

              <!-- Pending voice preview (recorded, not yet sent) -->
              @if (pendingVoice[popup.conversationId]) {
                <div class="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-[24px] px-5 py-3 mb-3">
                  <button (click)="playPendingVoice(popup.conversationId)"
                          class="w-10 h-10 bg-[#800000] text-white rounded-full flex items-center justify-center hover:bg-[#a52a2a] transition-all flex-shrink-0">
                    <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                    </svg>
                  </button>
                  <div class="flex-1">
                    <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-[#800000] rounded-full w-full opacity-30"></div>
                    </div>
                    <span class="text-xs text-gray-500 font-bold mt-1 block">{{ callService.formatDuration(pendingVoice[popup.conversationId]!.durationSec) }}</span>
                  </div>
                  <button (click)="discardPendingVoice(popup.conversationId)" class="text-gray-400 hover:text-red-500 transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <button (click)="sendPendingVoice(popup.conversationId, popup.targetUser.id)"
                          class="bg-[#800000] text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-[#a52a2a] transition-all">
                    Send
                  </button>
                </div>
              }

              <form (ngSubmit)="sendMessage(popup.conversationId, popup.targetUser.id)"
                    class="flex items-center gap-3 bg-gray-100/50 rounded-[28px] px-5 py-2 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#800000]/5 transition-all border border-gray-100">
                <input type="text" [(ngModel)]="draftMessages[popup.conversationId]" [name]="'msg-'+popup.conversationId"
                  (keydown)="onInputKeydown(popup.conversationId)"
                  placeholder="Express your thoughts..." class="flex-1 bg-transparent border-none text-sm outline-none font-bold text-dark h-10" autocomplete="off">

                <!-- Voice record button (hold to record) -->
                @if (!draftMessages[popup.conversationId]?.trim()) {
                  <button type="button"
                          (mousedown)="startRecording(popup.conversationId, popup.targetUser.id)"
                          (mouseup)="stopAndSendRecording(popup.conversationId, popup.targetUser.id)"
                          (touchstart)="startRecording(popup.conversationId, popup.targetUser.id)"
                          (touchend)="stopAndSendRecording(popup.conversationId, popup.targetUser.id)"
                          title="Hold to record voice message"
                          class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                          [class.bg-red-500]="callService.isRecording()"
                          [class.bg-gray-200]="!callService.isRecording()">
                    <svg class="w-5 h-5" [class.text-white]="callService.isRecording()" [class.text-gray-600]="!callService.isRecording()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                    </svg>
                  </button>
                }

                <!-- Send text button -->
                <button type="submit" [disabled]="!draftMessages[popup.conversationId]?.trim()"
                   class="bg-gradient-to-tr from-[#800000] to-[#a52a2a] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-[#800000]/20 hover:scale-110 active:scale-95 disabled:opacity-20 transition-all">
                  <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                </button>
              </form>
            </div>
          </div>
        }
      }
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- INCOMING CALL OVERLAY                                               -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    @if (callService.activeCall()?.state === 'ringing') {
      <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="bg-white rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.4)] p-12 flex flex-col items-center gap-8 w-[360px] border border-gray-100">
          <div class="relative">
            <div class="absolute inset-0 rounded-full bg-[#800000]/20 animate-ping"></div>
            <img [src]="getAvatarUrl(callService.activeCall()?.remoteUserAvatar)"
                 class="relative w-28 h-28 rounded-full object-cover border-4 border-[#800000]/30 shadow-2xl">
          </div>
          <div class="text-center">
            <p class="text-gray-400 text-sm font-black uppercase tracking-widest mb-2">Incoming {{ callService.activeCall()?.type }} call</p>
            <h3 class="text-2xl font-black text-gray-900">{{ callService.activeCall()?.remoteUserName }}</h3>
          </div>
          <div class="flex gap-8">
            <!-- Reject -->
            <button (click)="rejectCall()"
                    class="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all">
              <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            </button>
            <!-- Accept -->
            <button (click)="acceptCall()"
                    class="w-20 h-20 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:scale-110 active:scale-95 transition-all animate-bounce">
              <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ACTIVE CALL OVERLAY (calling / connected)                          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    @if (callService.activeCall()?.state === 'calling' || callService.activeCall()?.state === 'connected') {
      <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        <div class="relative w-full max-w-2xl h-[520px] bg-gray-900 rounded-[40px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.6)] flex flex-col">

          <!-- Remote video (full background) -->
          @if (callService.activeCall()?.type === 'video') {
            <video [appMediaStream]="callService.remoteStream()"
                   autoplay playsinline
                   class="absolute inset-0 w-full h-full object-cover bg-black">
            </video>
          } @else {
            <!-- Audio call: invisible audio element — same pattern as video but audio-only -->
            <!-- position:fixed keeps it in the DOM even if parent overflows; w/h 0 hides it -->
            <audio #remoteAudio
                   [appMediaStream]="callService.remoteStream()"
                   autoplay
                   style="position:fixed;width:0;height:0;opacity:0;pointer-events:none;">
            </audio>
            <!-- Audio / voice call background -->
            <div class="absolute inset-0 bg-gradient-to-br from-[#800000] via-[#500000] to-black flex items-center justify-center">
              <div class="relative">
                <div class="absolute inset-0 rounded-full bg-white/10 animate-ping scale-150"></div>
                <img [src]="getAvatarUrl(callService.activeCall()?.remoteUserAvatar)"
                     class="relative w-36 h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl">
              </div>
            </div>
          }

          <!-- Overlay gradient -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

          <!-- Top bar -->
          <div class="relative z-10 p-8 flex items-center justify-between">
            <div>
              <h3 class="text-white font-black text-xl">{{ callService.activeCall()?.remoteUserName }}</h3>
              <p class="text-white/60 text-sm font-bold mt-1">
                @if (callService.activeCall()?.state === 'calling') {
                  <span class="animate-pulse">Calling...</span>
                } @else {
                  {{ callService.formatDuration(callService.callDuration()) }}
                }
              </p>
            </div>
            <div class="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2">
              @if (callService.activeCall()?.type === 'video') {
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              } @else {
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              }
              <span class="text-white text-xs font-black uppercase">{{ callService.activeCall()?.type }}</span>
            </div>
          </div>

          <!-- Local video (picture-in-picture) -->
          @if (callService.activeCall()?.type === 'video' && callService.localStream()) {
            <video [appMediaStream]="callService.localStream()"
                   autoplay playsinline muted
                   class="absolute top-24 right-8 w-40 h-28 object-cover rounded-2xl border-2 border-white/30 shadow-2xl z-20 bg-black">
            </video>
          }

          <!-- Bottom controls -->
          <div class="absolute bottom-0 left-0 right-0 z-10 p-8 flex items-center justify-center gap-6">
            <!-- Mute mic -->
            <button (click)="toggleMic()"
                    class="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    [class.bg-white/20]="callService.isMicEnabled()"
                    [class.bg-red-500]="!callService.isMicEnabled()">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                @if (callService.isMicEnabled()) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                }
              </svg>
            </button>

            <!-- Toggle camera (video only) -->
            @if (callService.activeCall()?.type === 'video') {
              <button (click)="toggleCamera()"
                      class="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      [class.bg-white/20]="callService.isCameraEnabled()"
                      [class.bg-red-500]="!callService.isCameraEnabled()">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            }

            <!-- Hang up -->
            <button (click)="hangUp()"
                    class="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 hover:scale-110 active:scale-95 transition-all">
              <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    }
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

    .typing-dot {
      display: inline-block; width: 8px; height: 8px;
      background: #800000; border-radius: 50%;
      animation: typingBounce 1.2s infinite ease-in-out;
    }
    @keyframes typingBounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40%            { transform: scale(1);   opacity: 1; }
    }

    .voice-bubble-sent {
      background: linear-gradient(135deg, #800000, #a52a2a);
      color: white; border-radius: 24px 24px 4px 24px;
      padding: 12px 16px; max-width: 75%; min-width: 180px;
    }
    .voice-bubble-received {
      background: white; color: #1a1a1a; border-radius: 24px 24px 24px 4px;
      padding: 12px 16px; max-width: 75%; min-width: 180px;
      border: 1px solid #f1f5f9;
    }
  `]
})
export class ForumChatWidget implements OnInit, OnDestroy {
  public chatService = inject(ChatService);
  public presenceService = inject(PresenceService);
  public callService = inject(CallService);
  private authService = inject(AuthService);
  private chatUserService = inject(ChatUserService);
  private cdr = inject(ChangeDetectorRef);

  currentUserId = '';
  inboxConversations = signal<ChatConversation[]>([]);
  messagesMap = signal<Record<string, ChatMessage[]>>({});
  draftMessages: Record<string, string> = {};
  isInboxLoading = signal<boolean>(false);
  typingMap = signal<Record<string, boolean>>({});

  /** conversationId → pending VoiceRecording (recorded but not yet sent) */
  pendingVoice: Record<string, import('../../../../core/services/call.service').VoiceRecording | null> = {};

  /** messageId → playback progress 0-100 */
  private voiceProgress: Record<string, number> = {};
  /** messageId → HTMLAudioElement */
  private audioPlayers: Record<string, HTMLAudioElement> = {};
  /** conversationId → last-seen Date (from lastMessageDate) */
  private lastSeenMap: Record<string, Date> = {};

  private subs = new Subscription();
  private typingSubjects = new Map<string, Subject<void>>();

  constructor() {
    effect(() => {
      const popups = this.chatService.activePopups();
      popups.forEach(p => {
        if (!p.minimized && this.messagesMap()[p.conversationId] === undefined) {
          this.messagesMap.update(m => ({ ...m, [p.conversationId]: [] }));
          this.loadHistory(p.conversationId);
        }
        if (!p.minimized) {
          this.chatService.markAsSeen(p.conversationId, this.currentUserId);
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

    // ── Incoming messages ──────────────────────────────────────────────────
    this.subs.add(
      this.chatService.incomingMessage$.subscribe(msg => {
        this.messagesMap.update(map => {
          const currentList = map[msg.conversationId] || [];
          const tmpIdx = currentList.findIndex(
            m => m.id?.startsWith('tmp-') && m.senderId === msg.senderId && m.content === msg.content
          );
          if (tmpIdx !== -1) {
            const updated = [...currentList];
            updated[tmpIdx] = msg;
            return { ...map, [msg.conversationId]: updated };
          }
          if (currentList.some(m => m.id === msg.id)) return map;
          return { ...map, [msg.conversationId]: [...currentList, msg] };
        });
        this.scrollPopup(msg.conversationId);
        this.loadInbox();
        if (!this.chatService.isInboxOpen()) {
          this.chatService.unreadTotal.update(v => v + 1);
        }
        this.cdr.detectChanges();
      })
    );

    // ── Typing indicators ──────────────────────────────────────────────────
    this.subs.add(
      this.chatService.typing$.subscribe(indicator => {
        if (indicator.userId === this.currentUserId) return;
        this.typingMap.update(m => ({ ...m, [indicator.conversationId]: indicator.isTyping }));
        this.cdr.detectChanges();
      })
    );

    // ── Presence updates → trigger change detection ────────────────────────
    this.subs.add(
      this.chatService.presence$.subscribe(() => this.cdr.detectChanges())
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.typingSubjects.forEach(s => s.complete());
    this.callService.destroy();
  }

  private initializeChat() {
    if (!this.currentUserId) return;
    this.chatService.connect(this.currentUserId);

    // Init call service immediately (handles the case where STOMP is already connected)
    this.callService.init(this.currentUserId);
    this.presenceService.init(this.currentUserId);

    // Re-init on every subsequent STOMP reconnect (replaces stale subscriptions)
    this.subs.add(
      this.chatService.connectionState$.pipe(
        filter(v => v),
        // skip(1) so we don't double-init on the very first connect
        // (we already called init() above synchronously)
      ).subscribe(() => {
        this.presenceService.init(this.currentUserId);
        this.callService.init(this.currentUserId);
      })
    );

    // Subscribe to completed voice recordings
    this.subs.add(
      this.callService.voiceRecorded$.subscribe(rec => {
        this.pendingVoice[rec.conversationId] = rec;
        this.cdr.detectChanges();
      })
    );

    this.restoreState();
    setTimeout(() => this.loadInbox(), 500);
  }

  loadInbox() {
    if (!this.currentUserId) return;
    this.isInboxLoading.set(true);

    this.chatService.getUserConversations(this.currentUserId)
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

          // Store last-seen dates for popup header
          convs.forEach(c => {
            const otherId = c.user1Id === this.currentUserId ? c.user2Id : c.user1Id;
            if (c.lastMessageDate) this.lastSeenMap[otherId] = new Date(c.lastMessageDate);
          });

          // Bulk-fetch presence for all conversation partners
          const otherIds = convs.map(c =>
            c.user1Id === this.currentUserId ? c.user2Id : c.user1Id
          );
          this.presenceService.fetchBulkStatus(otherIds);

          this.cdr.detectChanges();
        }
      });
  }

  loadHistory(conversationId: string) {
    if (!conversationId) return;
    this.chatService.getChatHistory(conversationId)
      .pipe(catchError(() => of([])))
      .subscribe(hist => {
        this.messagesMap.update(m => ({ ...m, [conversationId]: hist }));
        this.scrollPopup(conversationId);
        this.chatService.markAsSeen(conversationId, this.currentUserId);
        this.cdr.detectChanges();
      });
  }

  getMessages(connId: string): ChatMessage[] {
    return this.messagesMap()[connId] || [];
  }

  isTyping(conversationId: string): boolean {
    return this.typingMap()[conversationId] ?? false;
  }

  getStatusIcon(msg: ChatMessage): string {
    if (msg.senderId !== this.currentUserId) return '';
    if (msg.id?.startsWith('tmp-')) return '🕐';
    switch (msg.status) {
      case 'SEEN': return '✓✓';
      case 'DELIVERED': return '✓✓';
      default: return '✓';
    }
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

  onInputKeydown(conversationId: string) {
    if (!this.typingSubjects.has(conversationId)) {
      const subject = new Subject<void>();
      subject.pipe(debounceTime(2000)).subscribe(() => {
        this.chatService.sendTypingIndicator(conversationId, this.currentUserId, false);
      });
      this.typingSubjects.set(conversationId, subject);
    }
    this.chatService.sendTypingIndicator(conversationId, this.currentUserId, true);
    this.typingSubjects.get(conversationId)!.next();
  }

  sendMessage(conversationId: string, receiverId: string) {
    const text = this.draftMessages[conversationId];
    if (!text?.trim()) return;

    this.chatService.sendTypingIndicator(conversationId, this.currentUserId, false);

    const optimisticMsg: ChatMessage = {
      id: 'tmp-' + Date.now(),
      conversationId,
      senderId: this.currentUserId,
      receiverId,
      content: text,
      timestamp: new Date().toISOString(),
      status: 'SENT'
    };

    this.messagesMap.update(map => ({
      ...map,
      [conversationId]: [...(map[conversationId] || []), optimisticMsg]
    }));

    this.chatService.sendMessage({ conversationId, senderId: this.currentUserId, receiverId, content: text });
    this.draftMessages[conversationId] = '';
    this.scrollPopup(conversationId);
  }

  // ── Call actions ───────────────────────────────────────────────────────

  startCall(popup: ActivePopup, type: CallType) {
    this.callService.startCall(
      this.currentUserId,
      popup.targetUser.id,
      popup.targetUser.fullName,
      popup.targetUser.profileImage,
      type
    );
  }

  acceptCall() {
    this.callService.acceptCall(this.currentUserId);
  }

  rejectCall() {
    this.callService.rejectCall(this.currentUserId);
  }

  hangUp() {
    this.callService.hangUp(this.currentUserId);
  }

  toggleMic() { this.callService.toggleMic(); }
  toggleCamera() { this.callService.toggleCamera(); }

  // ── Presence label ─────────────────────────────────────────────────────

  getPresenceLabel(popup: ActivePopup): string {
    const status = this.presenceService.getStatus(popup.targetUser.id);
    if (status === 'online') return 'Active now';
    if (status === 'away') return 'Away';
    // offline → show last seen time
    const lastSeen = this.lastSeenMap[popup.targetUser.id];
    if (!lastSeen) return 'Offline';
    return 'Last seen ' + this.timeAgo(lastSeen);
  }

  private timeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // ── Voice recording ────────────────────────────────────────────────────

  startRecording(conversationId: string, receiverId: string) {
    this.callService.startRecording(conversationId, this.currentUserId);
  }

  stopAndSendRecording(conversationId: string, receiverId: string) {
    if (!this.callService.isRecording()) {
      // If there's a pending voice, send it
      if (this.pendingVoice[conversationId]) {
        this.sendPendingVoice(conversationId, receiverId);
      }
      return;
    }
    this.callService.stopRecording();
    // voiceRecorded$ will fire → pendingVoice is set → user sees preview
  }

  cancelRecording(conversationId: string) {
    this.callService.cancelRecording();
    this.pendingVoice[conversationId] = null;
  }

  discardPendingVoice(conversationId: string) {
    const rec = this.pendingVoice[conversationId];
    if (rec) URL.revokeObjectURL(rec.url);
    this.pendingVoice[conversationId] = null;
  }

  sendPendingVoice(conversationId: string, receiverId: string) {
    const rec = this.pendingVoice[conversationId];
    if (!rec) return;

    // Convert blob to base64 so it can be sent over WebSocket and played by the remote user
    const reader = new FileReader();
    reader.readAsDataURL(rec.blob);
    reader.onloadend = () => {
      const base64data = reader.result as string;

      // Optimistic voice bubble
      const optimistic: ChatMessage = {
        id: 'tmp-' + Date.now(),
        conversationId,
        senderId: this.currentUserId,
        receiverId,
        content: base64data,          // base64 audio data
        timestamp: new Date().toISOString(),
        status: 'SENT',
        messageType: 'voice',
        voiceDuration: rec.durationSec,
      };
      this.messagesMap.update(m => ({
        ...m,
        [conversationId]: [...(m[conversationId] || []), optimistic],
      }));

      // Send via STOMP
      this.chatService.sendMessage({
        conversationId,
        senderId: this.currentUserId,
        receiverId,
        content: base64data,
        messageType: 'voice',
        voiceDuration: rec.durationSec,
      });

      this.pendingVoice[conversationId] = null;
      this.scrollPopup(conversationId);
      this.cdr.detectChanges();
    };
  }

  // ── Voice playback ─────────────────────────────────────────────────────

  playVoiceMessage(msg: ChatMessage) {
    const id = msg.id || '';
    if (this.audioPlayers[id]) {
      const player = this.audioPlayers[id];
      if (player.paused) { player.play(); } else { player.pause(); }
      return;
    }
    const audio = new Audio(msg.content);
    this.audioPlayers[id] = audio;
    audio.ontimeupdate = () => {
      this.voiceProgress[id] = audio.duration
        ? (audio.currentTime / audio.duration) * 100
        : 0;
      this.cdr.detectChanges();
    };
    audio.onended = () => {
      this.voiceProgress[id] = 0;
      this.cdr.detectChanges();
    };
    audio.play();
  }

  playPendingVoice(conversationId: string) {
    const rec = this.pendingVoice[conversationId];
    if (!rec) return;
    const audio = new Audio(rec.url);
    audio.play();
  }

  getVoiceProgress(msgId: string): number {
    return this.voiceProgress[msgId] ?? 0;
  }

  // ── State persistence ──────────────────────────────────────────────────

  private persistState() {
    const popups = this.chatService.activePopups().map(p => ({ id: p.targetUser.id, min: !!p.minimized }));
    localStorage.setItem('chat_popups_state_active', JSON.stringify(popups));
  }

  private restoreState() {
    const saved = localStorage.getItem('chat_popups_state_active');
    if (!saved) return;
    try {
      const states = JSON.parse(saved) as { id: string; min: boolean }[];
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
