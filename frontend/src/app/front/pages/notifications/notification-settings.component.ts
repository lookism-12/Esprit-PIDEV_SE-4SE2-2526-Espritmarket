import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationSettingsService } from '../../core/notification-settings.service';
import { UserNotificationSettings } from '../../models/notification.model';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ns-panel">

      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="ns-header">
        <div>
          <h2 class="ns-title">Notification Settings</h2>
          <p class="ns-sub">Control how and when you receive notifications.</p>
        </div>
        @if (focusActiveNow()) {
          <span class="ns-focus-badge">
            <span class="ns-pulse"></span>
            Focus mode active
          </span>
        }
      </div>

      <!-- ── Error ────────────────────────────────────────────── -->
      @if (loadError()) {
        <div class="ns-error-bar">
          <span>⚠ Could not load settings ({{ loadError() }})</span>
          <button class="ns-retry" (click)="load()">Retry</button>
        </div>
      }

      <!-- ── Skeleton ─────────────────────────────────────────── -->
      @if (isLoading()) {
        <div class="ns-skeleton">
          @for (i of [1,2,3]; track i) {
            <div class="sk-row">
              <div class="sk sk-icon"></div>
              <div class="sk-body">
                <div class="sk sk-line sk-w60"></div>
                <div class="sk sk-line sk-w40"></div>
              </div>
              <div class="sk sk-toggle"></div>
            </div>
          }
        </div>
      }

      <!-- ── Settings rows ────────────────────────────────────── -->
      @if (!isLoading() && !loadError()) {

        <!-- External -->
        <div class="ns-row" [class.ns-row--disabled]="!ext()">
          <div class="ns-row-info">
            <div class="ns-icon ns-icon--ext">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <p class="ns-name">External Notifications</p>
              <p class="ns-desc">Promotions, broadcasts, platform announcements</p>
            </div>
          </div>
          <div class="ns-row-ctrl">
            <span class="ns-lbl" [class.ns-lbl--on]="ext()">{{ ext() ? 'On' : 'Off' }}</span>
            <button class="ns-toggle" [class.ns-toggle--on]="ext()" (click)="ext.set(!ext())" type="button">
              <span class="ns-thumb"></span>
            </button>
          </div>
        </div>

        <!-- Internal -->
        <div class="ns-row" [class.ns-row--disabled]="!int()">
          <div class="ns-row-info">
            <div class="ns-icon ns-icon--int">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <p class="ns-name">Internal Notifications</p>
              <p class="ns-desc">Messages, negotiations, order updates, ride alerts</p>
            </div>
          </div>
          <div class="ns-row-ctrl">
            <span class="ns-lbl" [class.ns-lbl--on]="int()">{{ int() ? 'On' : 'Off' }}</span>
            <button class="ns-toggle" [class.ns-toggle--on]="int()" (click)="int.set(!int())" type="button">
              <span class="ns-thumb"></span>
            </button>
          </div>
        </div>

        <!-- Focus Mode -->
        <div class="ns-row ns-row--focus" [class.ns-row--focus-on]="focus()">
          <div class="ns-row-info">
            <div class="ns-icon ns-icon--focus">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </div>
            <div>
              <p class="ns-name">Focus Mode</p>
              <p class="ns-desc">Mute all notifications during a time window — queued and delivered after</p>
            </div>
          </div>
          <div class="ns-row-ctrl">
            <span class="ns-lbl" [class.ns-lbl--on]="focus()">{{ focus() ? 'On' : 'Off' }}</span>
            <button class="ns-toggle" [class.ns-toggle--on]="focus()" (click)="focus.set(!focus())" type="button">
              <span class="ns-thumb"></span>
            </button>
          </div>
        </div>

        <!-- Focus time picker -->
        @if (focus()) {
          <div class="ns-schedule">
            <p class="ns-schedule-label">Quiet hours</p>
            <div class="ns-time-row">
              <div class="ns-time-field">
                <label class="ns-time-lbl" for="ns-start">From</label>
                <input id="ns-start" type="time" class="ns-time-input"
                  [ngModel]="focusStart()"
                  (ngModelChange)="focusStart.set($event)" />
              </div>
              <div class="ns-time-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <div class="ns-time-field">
                <label class="ns-time-lbl" for="ns-end">Until</label>
                <input id="ns-end" type="time" class="ns-time-input"
                  [ngModel]="focusEnd()"
                  (ngModelChange)="focusEnd.set($event)" />
              </div>
            </div>

            @if (isOvernight()) {
              <div class="ns-hint ns-hint--night">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Overnight — mutes from {{ focusStart() }} until {{ focusEnd() }} next day
              </div>
            }
            @if (focusActiveNow()) {
              <div class="ns-hint ns-hint--active">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Active right now — notifications are being queued
              </div>
            }
          </div>
        }

        <!-- ── Footer ───────────────────────────────────────────── -->
        <div class="ns-footer">
          <div class="ns-feedback">
            @if (saveSuccess()) {
              <span class="ns-ok">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved
              </span>
            }
            @if (saveError()) {
              <span class="ns-err">Save failed — try again</span>
            }
          </div>
          <button class="ns-save" (click)="save()" [disabled]="isSaving() || !isDirty()" type="button">
            @if (isSaving()) {
              <svg class="ns-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            }
            {{ isSaving() ? 'Saving…' : 'Save Settings' }}
          </button>
        </div>

      }
    </div>
  `,
  styles: [`
    .ns-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    /* Header */
    .ns-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
    }
    .ns-title { font-size: .95rem; font-weight: 800; color: var(--text-color); margin: 0 0 .2rem; }
    .ns-sub   { font-size: .75rem; color: var(--muted); margin: 0; }

    .ns-focus-badge {
      display: flex; align-items: center; gap: .4rem; flex-shrink: 0;
      font-size: .7rem; font-weight: 800; padding: .3rem .8rem;
      border-radius: 999px; background: rgba(139,0,0,.1); color: #8B0000;
      border: 1px solid rgba(139,0,0,.2);
    }
    .ns-pulse {
      width: 7px; height: 7px; border-radius: 50%; background: #8B0000;
      animation: pulse-dot 1.5s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: .4; transform: scale(.7); }
    }

    /* Error bar */
    .ns-error-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: .7rem 1.5rem; background: #fff1f2; border-bottom: 1px solid #fca5a5;
      font-size: .8rem; color: #dc2626; font-weight: 600;
    }
    .ns-retry {
      background: none; border: 1px solid #dc2626; color: #dc2626;
      border-radius: 6px; padding: .2rem .65rem; font-size: .75rem;
      font-weight: 700; cursor: pointer;
    }

    /* Skeleton */
    .ns-skeleton { padding: .25rem 0; }
    .sk-row {
      display: flex; align-items: center; gap: .875rem;
      padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
    }
    .sk-body { flex: 1; display: flex; flex-direction: column; gap: .4rem; }
    .sk { background: var(--border); border-radius: 6px; animation: sk-pulse 1.5s infinite; }
    .sk-icon   { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
    .sk-line   { height: 11px; }
    .sk-w60    { width: 60%; }
    .sk-w40    { width: 40%; }
    .sk-toggle { width: 48px; height: 26px; border-radius: 999px; flex-shrink: 0; margin-left: auto; }
    @keyframes sk-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

    /* Rows */
    .ns-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
      transition: background .2s, opacity .2s;
    }
    .ns-row--disabled { opacity: .55; }
    .ns-row--focus-on { background: rgba(139,0,0,.025); }

    .ns-row-info { display: flex; align-items: flex-start; gap: .875rem; flex: 1; min-width: 0; }
    .ns-row-ctrl { display: flex; align-items: center; gap: .6rem; flex-shrink: 0; }

    /* Icon */
    .ns-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .ns-icon--ext   { background: #fce7f3; color: #be185d; }
    .ns-icon--int   { background: #dbeafe; color: #1d4ed8; }
    .ns-icon--focus { background: rgba(139,0,0,.1); color: #8B0000; }

    .ns-name { font-size: .875rem; font-weight: 700; color: var(--text-color); margin: 0 0 2px; }
    .ns-desc { font-size: .73rem; color: var(--muted); margin: 0; line-height: 1.4; }

    .ns-lbl { font-size: .72rem; font-weight: 700; color: var(--muted); min-width: 22px; text-align: right; }
    .ns-lbl--on { color: #8B0000; }

    /* Toggle */
    .ns-toggle {
      position: relative; width: 48px; height: 26px; border-radius: 999px;
      border: none; background: var(--border); cursor: pointer; flex-shrink: 0;
      transition: background .2s; padding: 0;
    }
    .ns-toggle--on { background: #8B0000; }
    .ns-thumb {
      position: absolute; top: 3px; left: 3px; width: 20px; height: 20px;
      border-radius: 50%; background: white; transition: transform .2s;
      box-shadow: 0 1px 4px rgba(0,0,0,.25);
    }
    .ns-toggle--on .ns-thumb { transform: translateX(22px); }

    /* Schedule */
    .ns-schedule {
      padding: 1rem 1.5rem 1.25rem; border-bottom: 1px solid var(--border);
      background: rgba(139,0,0,.02);
    }
    .ns-schedule-label {
      font-size: .7rem; font-weight: 800; color: var(--muted);
      text-transform: uppercase; letter-spacing: .05em; margin: 0 0 .75rem;
    }
    .ns-time-row { display: flex; align-items: flex-end; gap: .75rem; }
    .ns-time-field { display: flex; flex-direction: column; gap: .3rem; }
    .ns-time-lbl {
      font-size: .68rem; font-weight: 700; color: var(--muted);
      text-transform: uppercase; letter-spacing: .04em;
    }
    .ns-time-input {
      padding: .4rem .7rem; border-radius: 8px; border: 1px solid var(--border);
      background: var(--card-bg); color: var(--text-color); font-size: .875rem;
      font-weight: 600; outline: none; transition: border-color .15s, box-shadow .15s;
    }
    .ns-time-input:focus { border-color: #8B0000; box-shadow: 0 0 0 3px rgba(139,0,0,.1); }
    .ns-time-arrow { color: var(--muted); padding-bottom: .4rem; display: flex; align-items: center; }

    /* Hints */
    .ns-hint {
      display: flex; align-items: center; gap: .4rem; margin-top: .75rem;
      font-size: .73rem; font-weight: 600; border-radius: 8px; padding: .4rem .75rem;
    }
    .ns-hint--night  { background: #f0f9ff; color: #0369a1; }
    .ns-hint--active { background: rgba(139,0,0,.08); color: #8B0000; }

    /* Footer */
    .ns-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem; gap: 1rem;
    }
    .ns-feedback { display: flex; align-items: center; min-height: 22px; }
    .ns-ok {
      display: flex; align-items: center; gap: .35rem;
      font-size: .78rem; font-weight: 700; color: #16a34a;
    }
    .ns-err { font-size: .78rem; font-weight: 700; color: #dc2626; }

    .ns-save {
      display: flex; align-items: center; gap: .4rem;
      padding: .5rem 1.4rem; border-radius: 10px; border: none;
      background: #8B0000; color: white; font-size: .875rem; font-weight: 800;
      cursor: pointer; transition: opacity .15s;
    }
    .ns-save:disabled { opacity: .4; cursor: not-allowed; }
    .ns-save:not(:disabled):hover { opacity: .85; }
    .ns-spin { animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class NotificationSettingsComponent implements OnInit, OnDestroy {

  // ── Individual signals for each field (Angular tracks these properly) ──
  ext        = signal(true);
  int        = signal(true);
  focus      = signal(false);
  focusStart = signal('21:00');
  focusEnd   = signal('05:00');

  // ── Snapshot signals (also signals so computed() can track them) ──
  private snapExt        = signal(true);
  private snapInt        = signal(true);
  private snapFocus      = signal(false);
  private snapFocusStart = signal('21:00');
  private snapFocusEnd   = signal('05:00');

  // ── UI state ──
  isLoading   = signal(true);
  isSaving    = signal(false);
  saveSuccess = signal(false);
  saveError   = signal(false);
  loadError   = signal<string | null>(null);

  // ── Clock tick for focus-active check ──
  private tick = signal(Date.now());
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  // ── Computed ──
  isDirty = computed(() =>
    this.ext()        !== this.snapExt()        ||
    this.int()        !== this.snapInt()        ||
    this.focus()      !== this.snapFocus()      ||
    this.focusStart() !== this.snapFocusStart() ||
    this.focusEnd()   !== this.snapFocusEnd()
  );

  isOvernight = computed(() => {
    const s = this.focusStart(), e = this.focusEnd();
    return !!s && !!e && s > e;
  });

  focusActiveNow = computed(() => {
    void this.tick(); // re-evaluate every minute
    if (!this.focus() || !this.focusStart() || !this.focusEnd()) return false;
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const s = this.focusStart(), e = this.focusEnd();
    return s <= e ? (cur >= s && cur < e) : (cur >= s || cur < e);
  });

  constructor(private svc: NotificationSettingsService) {}

  ngOnInit(): void {
    this.load();
    this.clockInterval = setInterval(() => this.tick.set(Date.now()), 60_000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.svc.getSettings().subscribe({
      next: s => {
        const start = this.toHHmm(s.focusModeStart) ?? '21:00';
        const end   = this.toHHmm(s.focusModeEnd)   ?? '05:00';

        this.ext.set(s.externalNotificationsEnabled);
        this.int.set(s.internalNotificationsEnabled);
        this.focus.set(s.focusModeEnabled);
        this.focusStart.set(start);
        this.focusEnd.set(end);

        // Sync snapshot
        this.snapExt.set(s.externalNotificationsEnabled);
        this.snapInt.set(s.internalNotificationsEnabled);
        this.snapFocus.set(s.focusModeEnabled);
        this.snapFocusStart.set(start);
        this.snapFocusEnd.set(end);

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(err.status ? `${err.status} ${err.statusText}` : 'Network error');
        this.isLoading.set(false);
      }
    });
  }

  save(): void {
    if (this.isSaving() || !this.isDirty()) return;
    this.isSaving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(false);

    const payload: UserNotificationSettings = {
      externalNotificationsEnabled: this.ext(),
      internalNotificationsEnabled: this.int(),
      focusModeEnabled: this.focus(),
      focusModeStart: this.focusStart(),
      focusModeEnd:   this.focusEnd()
    };

    this.svc.updateSettings(payload).subscribe({
      next: updated => {
        const start = this.toHHmm(updated.focusModeStart) ?? '21:00';
        const end   = this.toHHmm(updated.focusModeEnd)   ?? '05:00';

        // Update snapshot to match server response
        this.snapExt.set(updated.externalNotificationsEnabled);
        this.snapInt.set(updated.internalNotificationsEnabled);
        this.snapFocus.set(updated.focusModeEnabled);
        this.snapFocusStart.set(start);
        this.snapFocusEnd.set(end);

        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set(true);
      }
    });
  }

  private toHHmm(value: string | null | undefined): string | null {
    if (!value) return null;
    return value.length > 5 ? value.substring(0, 5) : value;
  }
}
