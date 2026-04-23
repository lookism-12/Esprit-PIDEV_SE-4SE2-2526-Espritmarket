import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrustService } from '../../core/services/trust.service';
import { TrustBadgeComponent } from './trust-badge.component';

/**
 * Trust Score Display Component
 * Shows detailed trust score with progress bar
 * 
 * Usage:
 * <app-trust-score-display [trustScore]="75" [badge]="'TRUSTED_SELLER'" />
 */
@Component({
  selector: 'app-trust-score-display',
  standalone: true,
  imports: [CommonModule, TrustBadgeComponent],
  template: `
    <div class="trust-score-display">
      <!-- Badge -->
      <div class="mb-3">
        <app-trust-badge 
          [trustScore]="trustScore" 
          [badge]="badge"
          [size]="'lg'"
          [showIcon]="true"
          [showScore]="true"
          [showLabel]="true" />
      </div>
      
      <!-- Progress Bar -->
      <div class="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div class="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
             [style.width.%]="trustScore"
             [ngClass]="progressColorClass"></div>
      </div>
      
      <!-- Score Text -->
      <div class="mt-2 text-sm text-gray-600 text-center">
        Trust Score: <span class="font-bold" [ngClass]="scoreColorClass">{{ trustScore }}/100</span>
      </div>
      
      <!-- Optional Details -->
      @if (showDetails && totalSales !== undefined) {
        <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div class="bg-gray-50 rounded-lg p-2 text-center">
            <div class="font-bold text-gray-900">{{ totalSales }}</div>
            <div class="text-gray-600">Sales</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2 text-center">
            <div class="font-bold text-gray-900">{{ averageRating?.toFixed(1) || '0.0' }}</div>
            <div class="text-gray-600">Rating</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .trust-score-display {
      padding: 1rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
    }
  `]
})
export class TrustScoreDisplayComponent {
  private trustService = inject(TrustService);
  
  @Input() trustScore: number = 0;
  @Input() badge?: string;
  @Input() showDetails: boolean = false;
  @Input() totalSales?: number;
  @Input() averageRating?: number;
  
  get progressColorClass() {
    return this.trustService.getScoreBgClass(this.trustScore).replace('bg-', 'bg-gradient-to-r from-');
  }
  
  get scoreColorClass() {
    return this.trustService.getScoreColorClass(this.trustScore);
  }
}
