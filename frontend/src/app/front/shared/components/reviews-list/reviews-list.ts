import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RideReviewService, ReviewResponse } from '../../../core/ride-review.service';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [CommonModule, DatePipe, StarRating],
  template: `
    <div>
      <!-- Header with average -->
      @if (reviews().length > 0) {
        <div class="flex items-center gap-4 mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <div class="text-center">
            <p class="text-4xl font-black text-amber-500">{{ average() | number:'1.1-1' }}</p>
            <app-star-rating [value]="averageRounded()" [readonly]="true" size="sm"></app-star-rating>
            <p class="text-xs text-gray-500 mt-1">{{ reviews().length }} review{{ reviews().length !== 1 ? 's' : '' }}</p>
          </div>
          <div class="flex-1">
            @for (star of [5,4,3,2,1]; track star) {
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold text-gray-500 w-3">{{ star }}</span>
                <span class="text-amber-400 text-xs">★</span>
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 rounded-full transition-all"
                       [style.width.%]="barWidth(star)"></div>
                </div>
                <span class="text-xs text-gray-400 w-4">{{ countByStar(star) }}</span>
              </div>
            }
          </div>
          @if (badge()) {
            <div class="text-center">
              <span class="px-3 py-1.5 rounded-xl text-xs font-black" [class]="reviewService.badgeClass(badge())">
                {{ reviewService.badgeLabel(badge()) }}
              </span>
            </div>
          }
        </div>
      }

      <!-- Review cards -->
      @if (isLoading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-24 rounded-2xl animate-pulse bg-gray-100"></div>
          }
        </div>
      } @else if (reviews().length === 0) {
        <div class="text-center py-10 text-gray-400">
          <p class="text-4xl mb-2">⭐</p>
          <p class="font-bold">No reviews yet</p>
          <p class="text-sm">Be the first to leave a review!</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (review of reviews(); track review.id) {
            <div class="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div class="flex items-start gap-3">
                <!-- Avatar -->
                @if (review.reviewerAvatar) {
                  <img [src]="review.reviewerAvatar" alt="avatar"
                       class="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0">
                } @else {
                  <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0">
                    {{ (review.reviewerName || 'U').charAt(0).toUpperCase() }}
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between flex-wrap gap-2">
                    <span class="font-black text-sm text-gray-800">{{ review.reviewerName }}</span>
                    <span class="text-[10px] text-gray-400">{{ review.createdAt | date:'MMM d, y' }}</span>
                  </div>
                  <app-star-rating [value]="review.rating" [readonly]="true" size="sm"></app-star-rating>
                  @if (review.comment) {
                    <p class="text-sm text-gray-600 mt-2 leading-relaxed">{{ review.comment }}</p>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ReviewsList implements OnInit {
  @Input({ required: true }) userId!: string;

  reviewService = inject(RideReviewService);
  reviews = signal<ReviewResponse[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.reviewService.getReviewsByUser(this.userId).subscribe({
      next: (data) => { this.reviews.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  average(): number {
    if (!this.reviews().length) return 0;
    return this.reviews().reduce((s, r) => s + r.rating, 0) / this.reviews().length;
  }

  averageRounded(): number {
    return Math.round(this.average());
  }

  badge(): string {
    const r = this.reviews();
    if (!r.length) return '';
    return r[0].badge ?? '';
  }

  countByStar(star: number): number {
    return this.reviews().filter(r => r.rating === star).length;
  }

  barWidth(star: number): number {
    if (!this.reviews().length) return 0;
    return (this.countByStar(star) / this.reviews().length) * 100;
  }
}
