import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrustService } from '../../core/services/trust.service';

/**
 * Reusable Trust Badge Component
 * 
 * Usage:
 * <app-trust-badge [trustScore]="75" [badge]="'TRUSTED_SELLER'" [size]="'md'" />
 */
@Component({
  selector: 'app-trust-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trust-badge inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium transition-all"
         [ngClass]="sizeClass"
         [style.background-color]="badgeConfig.bgColor"
         [style.color]="badgeConfig.color">
      
      @if (showIcon) {
        <span class="badge-icon">{{ badgeConfig.icon }}</span>
      }
      
      @if (showScore) {
        <span class="badge-score font-bold">{{ trustScore }}%</span>
      }
      
      @if (showLabel) {
        <span class="badge-label">{{ badgeConfig.displayName }}</span>
      }
    </div>
  `,
  styles: [`
    .trust-badge {
      user-select: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .trust-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .size-sm {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }
    
    .size-md {
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    }
    
    .size-lg {
      font-size: 1rem;
      padding: 0.5rem 1rem;
    }
  `]
})
export class TrustBadgeComponent {
  private trustService = inject(TrustService);
  
  @Input() trustScore: number = 0;
  @Input() badge?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showIcon: boolean = true;
  @Input() showScore: boolean = true;
  @Input() showLabel: boolean = true;
  
  get badgeConfig() {
    if (this.badge) {
      return this.trustService.getBadgeConfig(this.badge);
    }
    return this.trustService.getBadgeFromScore(this.trustScore);
  }
  
  get sizeClass() {
    return `size-${this.size}`;
  }
}
