import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyLevel } from '../../../models/loyalty.model';

/**
 * Loyalty Badge Component
 * 
 * Displays user's loyalty level with appropriate styling.
 * Uses ONLY existing theme colors - no new colors introduced.
 * 
 * Usage:
 * <app-loyalty-badge [level]="LoyaltyLevel.GOLD" [size]="'md'" />
 */
@Component({
  selector: 'app-loyalty-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="getBadgeClasses()"
      [attr.aria-label]="level + ' loyalty member'">
      <span class="badge-icon">{{ getIcon() }}</span>
      <span class="badge-text">{{ level }}</span>
    </div>
  `,
  styles: [`
    .loyalty-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.75rem;
      font-weight: 600;
      transition: all 0.2s ease;
      border: 1.5px solid;
    }

    .loyalty-badge-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      gap: 0.375rem;
    }

    .loyalty-badge-md {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      gap: 0.5rem;
    }

    .loyalty-badge-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      gap: 0.625rem;
    }

    /* Bronze - Use existing neutral/gray colors */
    .loyalty-bronze {
      background: var(--bg-subtle);
      border-color: var(--border);
      color: var(--text-muted);
    }

    .dark .loyalty-bronze {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.7);
    }

    /* Silver - Use existing secondary color */
    .loyalty-silver {
      background: rgba(189, 156, 124, 0.1);
      border-color: #BD9C7C;
      color: var(--text-color);
    }

    .dark .loyalty-silver {
      background: rgba(189, 156, 124, 0.15);
      border-color: rgba(189, 156, 124, 0.4);
      color: rgba(189, 156, 124, 0.9);
    }

    /* Gold - Use existing accent-gold */
    .loyalty-gold {
      background: var(--accent-gold-soft);
      border-color: var(--accent-gold);
      color: #8B6914;
    }

    .dark .loyalty-gold {
      background: rgba(224, 184, 74, 0.15);
      border-color: var(--accent-gold);
      color: var(--accent-gold);
    }

    /* Platinum - Use existing primary color */
    .loyalty-platinum {
      background: rgba(139, 0, 0, 0.1);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .dark .loyalty-platinum {
      background: rgba(139, 0, 0, 0.2);
      border-color: var(--primary-color);
      color: #ff6b6b;
    }

    .badge-icon {
      font-size: 1.2em;
      line-height: 1;
    }

    .badge-text {
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  `]
})
export class LoyaltyBadgeComponent {
  @Input() level: LoyaltyLevel = LoyaltyLevel.BRONZE;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  getBadgeClasses(): string {
    const baseClass = 'loyalty-badge';
    const sizeClass = `loyalty-badge-${this.size}`;
    const levelClass = `loyalty-${this.level.toLowerCase()}`;
    return `${baseClass} ${sizeClass} ${levelClass}`;
  }

  getIcon(): string {
    switch (this.level) {
      case LoyaltyLevel.BRONZE:
        return '🥉';
      case LoyaltyLevel.SILVER:
        return '🥈';
      case LoyaltyLevel.GOLD:
        return '🥇';
      case LoyaltyLevel.PLATINUM:
        return '💎';
      default:
        return '⭐';
    }
  }
}
