import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RideReviewService } from '../../../core/ride-review.service';
import { ToastService } from '../../../core/toast.service';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'app-ride-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('starPop', [
      transition(':enter', [
        animate('300ms ease-out', keyframes([
          style({ transform: 'scale(0)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.3)', opacity: 1, offset: 0.7 }),
          style({ transform: 'scale(1)',   opacity: 1, offset: 1 }),
        ]))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(40px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.34,1.56,0.64,1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ transform: 'translateY(20px)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease', style({ opacity: 1 }))
      ])
    ]),
    trigger('successBounce', [
      transition(':enter', [
        animate('600ms ease-out', keyframes([
          style({ transform: 'scale(0) rotate(-10deg)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.2) rotate(5deg)',  opacity: 1, offset: 0.6 }),
          style({ transform: 'scale(0.95) rotate(-2deg)', opacity: 1, offset: 0.8 }),
          style({ transform: 'scale(1) rotate(0)',       opacity: 1, offset: 1 }),
        ]))
      ])
    ])
  ],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
         (click)="onClose()">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @fadeIn></div>

      <!-- Sheet -->
      <div class="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
           (click)="$event.stopPropagation()"
           @slideUp>

        <!-- Drag handle (mobile) -->
        <div class="flex justify-center pt-3 pb-1 sm:hidden">
          <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
        </div>

        <!-- ══════════════════════════════════════════════════════
             STEP 1 — RATING
        ══════════════════════════════════════════════════════ -->
        @if (step() === 1) {
          <div class="px-6 pb-8 pt-4" @slideUp>

            <!-- Avatar + name -->
            <div class="flex flex-col items-center mb-6">
              <div class="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl font-black shadow-lg mb-3"
                   [style.background]="ratingGradient()">
                {{ otherPartyName.charAt(0).toUpperCase() }}
              </div>
              <h3 class="text-xl font-black text-gray-900">How was your ride?</h3>
              <p class="text-sm text-gray-400 mt-0.5">with <span class="font-bold text-gray-600">{{ otherPartyName }}</span></p>
            </div>

            <!-- Big animated stars -->
            <div class="flex justify-center gap-3 mb-3">
              @for (star of [1,2,3,4,5]; track star) {
                <button type="button"
                  (click)="setRating(star)"
                  (mouseenter)="hovered = star"
                  (mouseleave)="hovered = 0"
                  class="transition-all duration-150 focus:outline-none"
                  [style.transform]="isActive(star) ? 'scale(1.25)' : 'scale(1)'">
                  <svg viewBox="0 0 24 24" class="w-12 h-12 transition-all duration-200"
                       [style.filter]="isActive(star) ? 'drop-shadow(0 0 8px '+starColor()+')' : 'none'">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          [attr.fill]="isActive(star) ? starColor() : '#e5e7eb'"
                          [attr.stroke]="isActive(star) ? starColor() : '#d1d5db'"
                          stroke-width="1"/>
                  </svg>
                </button>
              }
            </div>

            <!-- Emoji + label -->
            <div class="text-center h-10 mb-6">
              @if (displayRating() > 0) {
                <div @fadeIn class="flex flex-col items-center">
                  <span class="text-3xl">{{ ratingEmoji() }}</span>
                  <span class="text-sm font-black mt-0.5" [style.color]="starColor()">{{ ratingLabel() }}</span>
                </div>
              } @else {
                <p class="text-sm text-gray-400">Tap a star to rate</p>
              }
            </div>

            <!-- Error -->
            @if (showError()) {
              <p class="text-center text-xs text-red-500 font-bold mb-3" @fadeIn>
                Please select a rating to continue
              </p>
            }

            <!-- Next button -->
            <button type="button" (click)="nextStep()"
              class="w-full py-4 rounded-2xl font-black text-base transition-all duration-200 active:scale-95"
              [class.opacity-40]="displayRating() === 0"
              [style.background]="displayRating() > 0 ? ratingGradient() : '#e5e7eb'"
              [style.color]="displayRating() > 0 ? 'white' : '#9ca3af'">
              Continue →
            </button>

            <button type="button" (click)="onClose()"
              class="w-full py-2 mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Skip for now
            </button>
          </div>
        }

        <!-- ══════════════════════════════════════════════════════
             STEP 2 — TAGS + COMMENT
        ══════════════════════════════════════════════════════ -->
        @if (step() === 2) {
          <div class="px-6 pb-8 pt-4" @slideUp>

            <!-- Back + stars summary -->
            <div class="flex items-center justify-between mb-5">
              <button type="button" (click)="step.set(1)"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 font-bold">
                ←
              </button>
              <div class="flex gap-1">
                @for (s of [1,2,3,4,5]; track s) {
                  <svg viewBox="0 0 24 24" class="w-5 h-5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          [attr.fill]="s <= rating ? starColor() : '#e5e7eb'"
                          stroke="none"/>
                  </svg>
                }
              </div>
              <div class="w-8"></div>
            </div>

            <h3 class="text-lg font-black text-gray-900 mb-1">What stood out?</h3>
            <p class="text-xs text-gray-400 mb-4">Select all that apply</p>

            <!-- Tag chips -->
            <div class="flex flex-wrap gap-2 mb-5">
              @for (tag of currentTags(); track tag.label) {
                <button type="button"
                  (click)="toggleTag(tag.label)"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border-2 transition-all duration-150 active:scale-95"
                  [class.border-transparent]="selectedTags.includes(tag.label)"
                  [class.text-white]="selectedTags.includes(tag.label)"
                  [class.border-gray-200]="!selectedTags.includes(tag.label)"
                  [class.bg-gray-50]="!selectedTags.includes(tag.label)"
                  [class.text-gray-600]="!selectedTags.includes(tag.label)"
                  [style.background]="selectedTags.includes(tag.label) ? ratingGradient() : ''">
                  <span>{{ tag.emoji }}</span>
                  <span>{{ tag.label }}</span>
                </button>
              }
            </div>

            <!-- Comment -->
            <div class="relative mb-5">
              <textarea
                [(ngModel)]="comment"
                rows="3"
                maxlength="500"
                placeholder="Add a comment... (optional)"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm resize-none focus:outline-none focus:border-amber-300 transition-all bg-gray-50 placeholder-gray-300">
              </textarea>
              <span class="absolute bottom-3 right-3 text-[10px] text-gray-300">
                {{ comment.length }}/500
              </span>
            </div>

            <!-- Submit -->
            <button type="button" (click)="submit()"
              [disabled]="isSubmitting()"
              class="w-full py-4 rounded-2xl font-black text-base text-white transition-all duration-200 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              [style.background]="ratingGradient()">
              @if (isSubmitting()) {
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              } @else {
                <span>Submit Review</span>
                <span>🚀</span>
              }
            </button>
          </div>
        }

        <!-- ══════════════════════════════════════════════════════
             STEP 3 — SUCCESS
        ══════════════════════════════════════════════════════ -->
        @if (step() === 3) {
          <div class="px-6 pb-10 pt-6 flex flex-col items-center text-center" @slideUp>

            <!-- Animated checkmark -->
            <div @successBounce
              class="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 shadow-xl"
              [style.background]="ratingGradient()">
              ✓
            </div>

            <h3 class="text-2xl font-black text-gray-900 mb-1">Thank you! 🎉</h3>
            <p class="text-sm text-gray-500 mb-2">Your review helps the community</p>

            <!-- Stars display -->
            <div class="flex gap-1 mb-6">
              @for (s of [1,2,3,4,5]; track s) {
                <svg viewBox="0 0 24 24" class="w-7 h-7">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        [attr.fill]="s <= rating ? starColor() : '#e5e7eb'"
                        stroke="none"/>
                </svg>
              }
            </div>

            <!-- Badge earned -->
            <div class="px-5 py-3 rounded-2xl mb-6 text-sm font-bold"
                 [style.background]="ratingGradient() + '22'"
                 [style.color]="starColor()">
              {{ ratingEmoji() }} {{ ratingLabel() }}
            </div>

            <button type="button" (click)="onClose()"
              class="w-full py-4 rounded-2xl font-black text-base text-white transition-all active:scale-95"
              [style.background]="ratingGradient()">
              Done
            </button>
          </div>
        }

      </div>
    </div>
  `
})
export class RideReviewModal {
  @Input({ required: true }) rideId!: string;
  @Input() otherPartyName = 'your ride partner';
  @Output() submitted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private reviewService = inject(RideReviewService);
  private toastService = inject(ToastService);

  step = signal<1 | 2 | 3>(1);
  rating = 0;
  hovered = 0;
  comment = '';
  selectedTags: string[] = [];
  isSubmitting = signal(false);
  showError = signal(false);

  // ── Tag sets per rating ───────────────────────────────────────────────
  private tagSets: Record<number, { emoji: string; label: string }[]> = {
    5: [
      { emoji: '⏰', label: 'Punctual' },
      { emoji: '😊', label: 'Friendly' },
      { emoji: '🚗', label: 'Safe Driver' },
      { emoji: '✨', label: 'Clean Car' },
      { emoji: '💬', label: 'Great Chat' },
      { emoji: '🎵', label: 'Good Music' },
      { emoji: '🛣️', label: 'Smooth Ride' },
      { emoji: '🌟', label: 'Would Ride Again' },
    ],
    4: [
      { emoji: '⏰', label: 'Punctual' },
      { emoji: '😊', label: 'Friendly' },
      { emoji: '🚗', label: 'Safe Driver' },
      { emoji: '✨', label: 'Clean Car' },
      { emoji: '💬', label: 'Good Communication' },
      { emoji: '🛣️', label: 'Comfortable' },
    ],
    3: [
      { emoji: '⏰', label: 'Slightly Late' },
      { emoji: '🚗', label: 'Average Driving' },
      { emoji: '💬', label: 'Limited Chat' },
      { emoji: '🧹', label: 'Could Be Cleaner' },
    ],
    2: [
      { emoji: '⏰', label: 'Late' },
      { emoji: '🚗', label: 'Unsafe Driving' },
      { emoji: '😶', label: 'Unfriendly' },
      { emoji: '🧹', label: 'Dirty Car' },
      { emoji: '📵', label: 'Poor Communication' },
    ],
    1: [
      { emoji: '⏰', label: 'Very Late' },
      { emoji: '🚗', label: 'Dangerous Driving' },
      { emoji: '😠', label: 'Rude' },
      { emoji: '🧹', label: 'Very Dirty' },
      { emoji: '📵', label: 'No Communication' },
      { emoji: '❌', label: 'Would Not Recommend' },
    ],
  };

  currentTags() {
    return this.tagSets[this.rating] ?? this.tagSets[5];
  }

  displayRating() {
    return this.hovered || this.rating;
  }

  isActive(star: number) {
    return star <= this.displayRating();
  }

  setRating(star: number) {
    this.rating = star;
    this.showError.set(false);
    this.selectedTags = [];
  }

  toggleTag(tag: string) {
    this.selectedTags = this.selectedTags.includes(tag)
      ? this.selectedTags.filter(t => t !== tag)
      : [...this.selectedTags, tag];
  }

  nextStep() {
    if (this.rating === 0) { this.showError.set(true); return; }
    this.step.set(2);
  }

  // ── Visual helpers ────────────────────────────────────────────────────

  ratingGradient(): string {
    const r = this.displayRating();
    if (r >= 5) return 'linear-gradient(135deg, #f59e0b, #f97316)';
    if (r >= 4) return 'linear-gradient(135deg, #10b981, #059669)';
    if (r >= 3) return 'linear-gradient(135deg, #3b82f6, #6366f1)';
    if (r >= 2) return 'linear-gradient(135deg, #f97316, #ef4444)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  }

  starColor(): string {
    const r = this.displayRating();
    if (r >= 5) return '#f59e0b';
    if (r >= 4) return '#10b981';
    if (r >= 3) return '#3b82f6';
    if (r >= 2) return '#f97316';
    return '#ef4444';
  }

  ratingEmoji(): string {
    const emojis = ['', '😞', '😕', '😐', '😊', '🤩'];
    return emojis[this.displayRating()] ?? '';
  }

  ratingLabel(): string {
    const labels = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent!'];
    return labels[this.displayRating()] ?? '';
  }

  // ── Submit ────────────────────────────────────────────────────────────

  submit() {
    if (this.rating === 0) return;
    this.isSubmitting.set(true);

    const fullComment = [
      this.comment.trim(),
      this.selectedTags.length ? `Tags: ${this.selectedTags.join(', ')}` : ''
    ].filter(Boolean).join('\n');

    this.reviewService.submitReview({
      rideId: this.rideId,
      rating: this.rating,
      comment: fullComment || undefined
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.step.set(3);
        setTimeout(() => {
          this.submitted.emit();
        }, 2000);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to submit review');
        this.isSubmitting.set(false);
      }
    });
  }

  onClose() {
    this.closed.emit();
  }
}
