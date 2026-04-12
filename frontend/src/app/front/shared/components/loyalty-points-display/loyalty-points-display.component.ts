import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyLevel, LOYALTY_LEVELS } from '../../../models/loyalty.model';
import { LoyaltyBadgeComponent } from '../loyalty-badge/loyalty-badge.component';

/**
 * Loyalty Points Display Component
 * 
 * Shows points earned after an order with:
 * - Animated counter
 * - Level progress bar
 * - Next level indicator
 * 
 * Uses ONLY existing theme colors.
 */
@Component({
  selector: 'app-loyalty-points-display',
  standalone: true,
  imports: [CommonModule, LoyaltyBadgeComponent],
  template: `
    <div class="loyalty-display dm-card">
      <!-- Header -->
      <div class="loyalty-header">
        <div class="loyalty-icon">🎉</div>
        <h3 class="loyalty-title dm-title">Loyalty Points Earned!</h3>
      </div>

      <!-- Points Earned -->
      <div class="points-earned">
        <div class="points-value">+{{ pointsEarned }}</div>
        <div class="points-label dm-muted">Points Added</div>
      </div>

      <!-- Current Status -->
      <div class="loyalty-status">
        <div class="status-row">
          <span class="status-label dm-muted">Current Level:</span>
          <app-loyalty-badge [level]="currentLevel" [size]="'sm'" />
        </div>
        <div class="status-row">
          <span class="status-label dm-muted">Total Points:</span>
          <span class="status-value dm-title">{{ totalPoints }}</span>
        </div>
      </div>

      <!-- Progress to Next Level -->
      <div class="progress-section" *ngIf="nextLevel">
        <div class="progress-header">
          <span class="progress-label dm-muted">Progress to {{ nextLevel }}</span>
          <span class="progress-value dm-muted">{{ pointsToNext }} points to go</span>
        </div>
        <div class="progress-bar-container dm-progress-track">
          <div 
            class="progress-bar-fill"
            [style.width.%]="progressPercent">
          </div>
        </div>
      </div>

      <!-- Level Up Message -->
      <div class="level-up-message" *ngIf="leveledUp">
        <div class="level-up-icon">🎊</div>
        <div class="level-up-text">
          <strong>Congratulations!</strong> You've reached {{ currentLevel }} level!
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loyalty-display {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .loyalty-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .loyalty-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .loyalty-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .points-earned {
      text-align: center;
      padding: 1.5rem;
      background: var(--accent-gold-soft);
      border-radius: 0.75rem;
      border: 2px solid var(--accent-gold);
    }

    .dark .points-earned {
      background: rgba(224, 184, 74, 0.1);
      border-color: rgba(224, 184, 74, 0.3);
    }

    .points-value {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--accent-gold);
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .dark .points-value {
      color: var(--accent-gold);
    }

    .points-label {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .loyalty-status {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-label {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .status-value {
      font-size: 1.125rem;
      font-weight: 700;
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .progress-label,
    .progress-value {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .progress-bar-container {
      height: 0.75rem;
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-gold) 0%, #c19c3b 100%);
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 0.375rem;
    }

    .level-up-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1.5px solid #10b981;
      border-radius: 0.75rem;
      color: #10b981;
    }

    .dark .level-up-message {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
      color: #34d399;
    }

    .level-up-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .level-up-text {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.4;
    }

    .level-up-text strong {
      font-weight: 700;
      display: block;
      margin-bottom: 0.25rem;
    }
  `]
})
export class LoyaltyPointsDisplayComponent implements OnInit {
  @Input() pointsEarned: number = 0;
  @Input() totalPoints: number = 0;
  @Input() currentLevel: LoyaltyLevel = LoyaltyLevel.BRONZE;
  @Input() leveledUp: boolean = false;

  nextLevel: string | null = null;
  pointsToNext: number = 0;
  progressPercent: number = 0;

  ngOnInit() {
    this.calculateProgress();
  }

  private calculateProgress() {
    const currentLevelInfo = LOYALTY_LEVELS.find(l => l.level === this.currentLevel);
    if (!currentLevelInfo) return;

    // Find next level
    const currentIndex = LOYALTY_LEVELS.findIndex(l => l.level === this.currentLevel);
    if (currentIndex < LOYALTY_LEVELS.length - 1) {
      const nextLevelInfo = LOYALTY_LEVELS[currentIndex + 1];
      this.nextLevel = nextLevelInfo.level;
      this.pointsToNext = nextLevelInfo.minPoints - this.totalPoints;

      // Calculate progress percentage
      const pointsInLevel = this.totalPoints - currentLevelInfo.minPoints;
      const levelRange = nextLevelInfo.minPoints - currentLevelInfo.minPoints;
      this.progressPercent = Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
    } else {
      // Already at max level
      this.nextLevel = null;
      this.pointsToNext = 0;
      this.progressPercent = 100;
    }
  }
}
