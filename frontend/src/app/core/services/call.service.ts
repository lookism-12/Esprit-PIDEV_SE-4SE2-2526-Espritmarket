import { Injectable, inject, signal } from '@angular/core';
import { ChatService, SignalPayload } from './chat.service';
import { ChatUserService } from './chat-user.service';
import { Subject, Subscription } from 'rxjs';

export type CallType = 'video' | 'audio';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface ActiveCall {
  conversationId: string;
  remoteUserId: string;
  remoteUserName: string;
  remoteUserAvatar?: string;
  type: CallType;
  state: CallState;
  isInitiator: boolean;
  startedAt?: Date;
}

export interface VoiceRecording {
  id: string;
  conversationId: string;
  senderId: string;
  blob: Blob;
  url: string;
  durationSec: number;
  timestamp: string;
}

/**
 * WebRTC call service — video calls, audio calls, voice message recording.
 *
 * Call signaling flow:
 *
 *  Initiator                          Receiver
 *  ─────────                          ────────
 *  startCall()
 *    → call-request ──────────────→  ringing UI shown
 *                                    acceptCall()
 *    ← call-accept  ←──────────────  getUserMedia + createPeerConnection(isInitiator=false)
 *  getUserMedia + createPeerConnection(isInitiator=true)
 *    → offer        ──────────────→  setRemoteDesc + createAnswer
 *    ← answer       ←──────────────  setLocalDesc
 *  setRemoteDesc
 *  ←→ ice-candidate ←─────────────→  addIceCandidate (both sides)
 *  CONNECTED                         CONNECTED
 */
@Injectable({ providedIn: 'root' })
export class CallService {
  private chatService = inject(ChatService);
  private chatUserService = inject(ChatUserService);

  // ── Call signals ──────────────────────────────────────────────────────
  readonly activeCall   = signal<ActiveCall | null>(null);
  readonly localStream  = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);
  readonly callDuration = signal<number>(0);

  // ── Voice recording signals ───────────────────────────────────────────
  readonly isRecording      = signal<boolean>(false);
  readonly recordingDuration = signal<number>(0);
  /** Emits a completed VoiceRecording when the user stops recording */
  readonly voiceRecorded$ = new Subject<VoiceRecording>();

  private pc: RTCPeerConnection | null = null;
  private durationTimer: ReturnType<typeof setInterval> | null = null;
  private subs = new Subscription();
  /** ICE candidates buffered while remote description is not yet set */
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private remoteDescSet = false;

  // Voice recording internals
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private recordingStream: MediaStream | null = null;

  private readonly ICE_SERVERS: RTCIceServer[] = [
    // ── STUN servers (discover public IP, works for same-network calls) ──
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // ── Free TURN relay (fallback for cross-network / strict NAT) ────────
    // Metered free tier — works without an account
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turns:a.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────

  init(currentUserId: string) {
    // Unsubscribe previous subscription before re-subscribing (idempotent)
    this.subs.unsubscribe();
    this.subs = new Subscription();
    this.subs.add(
      this.chatService.signal$.subscribe(sig => this.handleSignal(sig, currentUserId))
    );
    console.log(`[CallService] init() — listening for signals as userId=${currentUserId}`);
  }

  destroy() {
    this.subs.unsubscribe();
    this.hangUp();
    this.stopRecording();
  }

  // ── Start call (initiator) ────────────────────────────────────────────

  async startCall(
    currentUserId: string,
    remoteUserId: string,
    remoteUserName: string,
    remoteUserAvatar: string | undefined,
    type: CallType
  ): Promise<void> {
    if (this.activeCall()) { console.warn('Already in a call'); return; }

    const conversationId = this.chatService.generateConversationId(currentUserId, remoteUserId);

    this.activeCall.set({
      conversationId, remoteUserId, remoteUserName, remoteUserAvatar,
      type, state: 'calling', isInitiator: true,
    });

    // Send call-request — receiver will show ringing UI
    this.chatService.sendSignal({
      type: 'call-request',
      conversationId,
      senderId: currentUserId,
      receiverId: remoteUserId,
      sdp: type,           // piggyback call type on sdp field
    });
  }

  // ── Accept call (receiver) ────────────────────────────────────────────

  async acceptCall(currentUserId: string): Promise<void> {
    const call = this.activeCall();
    if (!call || call.state !== 'ringing') return;

    this.activeCall.update(c => c ? { ...c, state: 'connected', startedAt: new Date() } : null);
    // Start the duration timer now — the WebRTC onconnectionstatechange will
    // also fire 'connected' later, but _startDurationTimer guards against double-start.
    this._startDurationTimer();

    // 1. Get media first
    await this._setupMedia(call.type);

    // 2. Create the RTCPeerConnection BEFORE sending call-accept.
    await this._createPeerConnection(currentUserId, call.remoteUserId, call.conversationId, false);

    // 3. Now tell the initiator we accepted.
    this.chatService.sendSignal({
      type: 'call-accept',
      conversationId: call.conversationId,
      senderId: currentUserId,
      receiverId: call.remoteUserId,
    });
  }

  // ── Reject / hang up ─────────────────────────────────────────────────

  rejectCall(currentUserId: string): void {
    const call = this.activeCall();
    if (!call) return;
    this.chatService.sendSignal({
      type: 'call-reject',
      conversationId: call.conversationId,
      senderId: currentUserId,
      receiverId: call.remoteUserId,
    });
    this._cleanup();
  }

  hangUp(currentUserId?: string): void {
    const call = this.activeCall();
    // Capture duration BEFORE _cleanup() resets it
    const duration = this.callDuration();

    if (call && currentUserId) {
      this.chatService.sendSignal({
        type: 'call-end',
        conversationId: call.conversationId,
        senderId: currentUserId,
        receiverId: call.remoteUserId,
      });

      // Send summary message if the call was actually connected long enough
      if (duration > 0) {
        const typeStr = call.type === 'video' ? '📹 Video' : '📞 Voice';
        this.chatService.sendMessage({
          conversationId: call.conversationId,
          senderId: currentUserId,
          receiverId: call.remoteUserId,
          content: `${typeStr} call ended • ${this.formatDuration(duration)}`,
        });
      }
    }
    this._cleanup();
  }

  // ── Signal handler ────────────────────────────────────────────────────

  private async handleSignal(sig: SignalPayload, currentUserId: string): Promise<void> {
    switch (sig.type) {

      case 'call-request': {
        if (this.activeCall()) return; // busy
        const callType = (sig.sdp as CallType) || 'audio';

        // Set with ID as placeholder first so the UI appears immediately
        this.activeCall.set({
          conversationId: sig.conversationId,
          remoteUserId: sig.senderId,
          remoteUserName: '...',
          type: callType,
          state: 'ringing',
          isInitiator: false,
        });

        // Resolve the real name + avatar asynchronously
        this.chatUserService.getUserById(sig.senderId).subscribe(user => {
          this.activeCall.update(c => c ? {
            ...c,
            remoteUserName: user.fullName,
            remoteUserAvatar: user.profileImage,
          } : null);
        });
        break;
      }

      case 'call-accept': {
        // Receiver accepted — now we (initiator) set up media and create the offer
        const call = this.activeCall();
        if (!call || !call.isInitiator) return;
        console.log('[WebRTC] call-accept received — setting up media and creating offer');
        this.activeCall.update(c => c ? { ...c, state: 'connected', startedAt: new Date() } : null);
        // Start timer now as fallback — WebRTC onconnectionstatechange may be delayed
        this._startDurationTimer();
        await this._setupMedia(call.type);
        await this._createPeerConnection(currentUserId, call.remoteUserId, call.conversationId, true);
        break;
      }

      case 'call-reject':
      case 'call-end': {
        // If we were in a connected call, send a summary message on our side too
        const endedCall = this.activeCall();
        const endedDuration = this.callDuration();
        if (sig.type === 'call-end' && endedCall && endedDuration > 0) {
          const typeStr = endedCall.type === 'video' ? '📹 Video' : '📞 Voice';
          // Send as the remote user ended it — show in our chat from their perspective
          this.chatService.sendMessage({
            conversationId: endedCall.conversationId,
            senderId: sig.senderId,          // the one who hung up
            receiverId: currentUserId,
            content: `${typeStr} call ended • ${this.formatDuration(endedDuration)}`,
          });
        }
        this._cleanup();
        break;
      }

      case 'offer': {
        if (!this.pc) {
          console.error('[WebRTC] ❌ offer received but RTCPeerConnection is null — receiver did not create PC yet');
          return;
        }
        console.log('[WebRTC] offer received — calling setRemoteDescription');
        await this.pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp: sig.sdp! })
        );
        console.log('[WebRTC] ✅ setRemoteDescription(offer) done');
        this.remoteDescSet = true;
        // Flush any ICE candidates that arrived before the offer
        if (this.pendingCandidates.length > 0) {
          console.log(`[WebRTC] flushing ${this.pendingCandidates.length} buffered ICE candidates`);
        }
        const candidatesToFlush = [...this.pendingCandidates];
        this.pendingCandidates = [];
        for (const c of candidatesToFlush) {
          try { 
            console.log(`[WebRTC] adding buffered ICE candidate...`);
            await this.pc.addIceCandidate(new RTCIceCandidate(c)); 
          } catch (e) { console.error('[WebRTC] Failed to add buffered ICE candidate', e); }
        }

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        console.log('[WebRTC] ✅ setLocalDescription(answer) done — sending answer');
        this.chatService.sendSignal({
          type: 'answer',
          conversationId: sig.conversationId,
          senderId: currentUserId,
          receiverId: sig.senderId,
          sdp: answer.sdp,
        });
        break;
      }

      case 'answer': {
        if (!this.pc) {
          console.error('[WebRTC] ❌ answer received but RTCPeerConnection is null');
          return;
        }
        console.log('[WebRTC] answer received — calling setRemoteDescription');
        await this.pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: sig.sdp! })
        );
        console.log('[WebRTC] ✅ setRemoteDescription(answer) done');
        this.remoteDescSet = true;
        // Flush buffered ICE candidates
        if (this.pendingCandidates.length > 0) {
          console.log(`[WebRTC] flushing ${this.pendingCandidates.length} buffered ICE candidates`);
        }
        const answerCandidatesToFlush = [...this.pendingCandidates];
        this.pendingCandidates = [];
        for (const c of answerCandidatesToFlush) {
          try { 
            console.log(`[WebRTC] adding buffered ICE candidate...`);
            await this.pc.addIceCandidate(new RTCIceCandidate(c)); 
          } catch (e) { console.error('[WebRTC] Failed to add buffered ICE candidate', e); }
        }
        break;
      }

      case 'ice-candidate': {
        if (!sig.candidate) return;
        const candidate: RTCIceCandidateInit = JSON.parse(sig.candidate);
        const parsed = new RTCIceCandidate(candidate);
        const type = parsed.type ?? 'unknown';
        if (!this.pc || !this.remoteDescSet) {
          console.log(`[WebRTC] buffering ICE candidate (${type}) — remoteDesc not set yet`);
          this.pendingCandidates.push(candidate);
          return;
        }
        console.log(`[WebRTC] adding ICE candidate: ${type} — ${parsed.address ?? '?'}`);
        try {
          await this.pc.addIceCandidate(parsed);
          console.log(`[WebRTC] ✅ added ICE candidate successfully: ${type}`);
        } catch (e) { console.error('[WebRTC] ❌ stale or invalid candidate — ignore', e); }
        break;
      }
    }
  }

  // ── WebRTC internals ──────────────────────────────────────────────────

  private async _setupMedia(type: CallType): Promise<void> {
    console.log(`[WebRTC] requesting getUserMedia — type: ${type}`);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
      });
      this.localStream.set(stream);
      console.log(`[WebRTC] ✅ getUserMedia OK — tracks: ${stream.getTracks().map(t => t.kind).join(', ')}`);
    } catch (e) {
      console.error('[WebRTC] ❌ getUserMedia failed:', e);
      this._cleanup();
      throw e;
    }
  }

  private async _createPeerConnection(
    currentUserId: string,
    remoteUserId: string,
    conversationId: string,
    isInitiator: boolean
  ): Promise<void> {
    this.pc = new RTCPeerConnection({
      iceServers: this.ICE_SERVERS,
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
    });

    // Add local tracks to the connection
    const local = this.localStream();
    if (local) local.getTracks().forEach(t => this.pc!.addTrack(t, local));

    // Receive remote tracks — fires when the other peer's media arrives
    this.pc.ontrack = (ev) => {
      console.log(`[WebRTC] ontrack fired! kind: ${ev.track.kind}, streams: ${ev.streams.length}`);
      // Use the stream directly from the event — don't copy it, as copying
      // can break the live track binding that the audio/video element needs.
      if (ev.streams && ev.streams[0]) {
        console.log(`[WebRTC] setting remoteStream — tracks: ${ev.streams[0].getTracks().map(t => t.kind).join(', ')}`);
        this.remoteStream.set(ev.streams[0]);
      } else {
        // No stream in event — build one from the track directly
        console.log(`[WebRTC] no stream in ontrack event, building from track`);
        const existing = this.remoteStream();
        if (existing) {
          existing.addTrack(ev.track);
          // Force signal update with a new reference
          this.remoteStream.set(new MediaStream(existing.getTracks()));
        } else {
          this.remoteStream.set(new MediaStream([ev.track]));
        }
      }
    };

    // Relay ICE candidates through the signaling server
    this.pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        console.log(`[WebRTC] local ICE candidate gathered: ${ev.candidate.type} (${ev.candidate.address})`);
        this.chatService.sendSignal({
          type: 'ice-candidate',
          conversationId,
          senderId: currentUserId,
          receiverId: remoteUserId,
          candidate: JSON.stringify(ev.candidate),
        });
      } else {
        console.log('[WebRTC] local ICE candidate gathering complete');
      }
    };

    // Log ICE state changes for debugging
    this.pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state: ${this.pc?.iceConnectionState}`);
      if (this.pc?.iceConnectionState === 'failed') {
        // Try ICE restart
        console.warn('[WebRTC] ICE failed — attempting restart');
        if (isInitiator && this.pc) {
          this.pc.restartIce();
        }
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log(`[WebRTC] Connection state change: ${state}`);
      if (state === 'connected') {
        console.log('[WebRTC] ✅ PeerConnection fully connected');
        this.activeCall.update(c => c ? { ...c, state: 'connected', startedAt: c.startedAt ?? new Date() } : null);
        this._startDurationTimer();
      }
      // 'disconnected' is transient — browser will try to recover automatically.
      // Only clean up on terminal states.
      if (state === 'failed' || state === 'closed') {
        console.warn(`[WebRTC] Connection terminal state: ${state}`);
        this._cleanup();
      }
    };

    if (isInitiator) {
      console.log('[WebRTC] Initiator creating offer...');
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: false,
      });
      console.log('[WebRTC] setLocalDescription(offer) starting...');
      await this.pc.setLocalDescription(offer);
      console.log('[WebRTC] ✅ setLocalDescription(offer) done');
      this.chatService.sendSignal({
        type: 'offer',
        conversationId,
        senderId: currentUserId,
        receiverId: remoteUserId,
        sdp: offer.sdp,
      });
    }
  }

  private _startDurationTimer() {
    // Guard: don't reset if already running (WebRTC onconnectionstatechange
    // may fire after acceptCall/call-accept already started the timer)
    if (this.durationTimer) return;
    this.callDuration.set(0);
    this.durationTimer = setInterval(() => this.callDuration.update(v => v + 1), 1000);
  }

  private _cleanup() {
    if (this.durationTimer) { clearInterval(this.durationTimer); this.durationTimer = null; }
    const local = this.localStream();
    if (local) { local.getTracks().forEach(t => t.stop()); this.localStream.set(null); }
    this.remoteStream.set(null);
    if (this.pc) { this.pc.close(); this.pc = null; }
    this.activeCall.set(null);
    this.callDuration.set(0);
    this.pendingCandidates = [];
    this.remoteDescSet = false;
  }

  // ── Voice message recording ───────────────────────────────────────────

  async startRecording(conversationId: string, senderId: string): Promise<void> {
    if (this.isRecording()) return;

    try {
      this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error('Microphone access denied:', e);
      return;
    }

    // Pick the best supported MIME type
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']
      .find(m => MediaRecorder.isTypeSupported(m)) ?? '';

    this.recordingChunks = [];
    this.mediaRecorder = new MediaRecorder(
      this.recordingStream,
      mimeType ? { mimeType } : undefined
    );

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordingChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordingChunks, {
        type: this.mediaRecorder?.mimeType || 'audio/webm',
      });
      const url = URL.createObjectURL(blob);
      const recording: VoiceRecording = {
        id: 'rec-' + Date.now(),
        conversationId,
        senderId,
        blob,
        url,
        durationSec: this.recordingDuration(),
        timestamp: new Date().toISOString(),
      };
      this.voiceRecorded$.next(recording);
      this._stopRecordingCleanup();
    };

    this.mediaRecorder.start(100); // collect data every 100 ms
    this.isRecording.set(true);
    this.recordingDuration.set(0);

    this.recordingTimer = setInterval(() => {
      this.recordingDuration.update(v => v + 1);
      // Auto-stop at 2 minutes
      if (this.recordingDuration() >= 120) this.stopRecording();
    }, 1000);
  }

  stopRecording(): void {
    if (!this.isRecording() || !this.mediaRecorder) return;
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording.set(false);
  }

  cancelRecording(): void {
    if (!this.isRecording()) return;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      // Remove onstop so the blob is discarded
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this._stopRecordingCleanup();
  }

  private _stopRecordingCleanup() {
    if (this.recordingTimer) { clearInterval(this.recordingTimer); this.recordingTimer = null; }
    if (this.recordingStream) {
      this.recordingStream.getTracks().forEach(t => t.stop());
      this.recordingStream = null;
    }
    this.isRecording.set(false);
    this.recordingDuration.set(0);
    this.recordingChunks = [];
    this.mediaRecorder = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  toggleMic(): void {
    this.localStream()?.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
  }

  toggleCamera(): void {
    this.localStream()?.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
  }

  isMicEnabled(): boolean {
    return this.localStream()?.getAudioTracks()[0]?.enabled ?? true;
  }

  isCameraEnabled(): boolean {
    return this.localStream()?.getVideoTracks()[0]?.enabled ?? true;
  }
}
