import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyService } from '../../../core/loyalty.service';
import { LoyaltyAccount, LoyaltyLevel, PointsTransaction, PointsTransactionType, LOYALTY_LEVELS } from '../../../models/loyalty.model';

@Component({
  selector: 'app-profile-loyalty',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl p-6" style="background-color:var(--card-bg);border:1px solid var(--border)">
      <h2 class="text-xl font-black mb-5" style="color:var(--text-color)">🏆 Loyalty Program</h2>

      @if (isLoading()) {
        <div class="text-center py-12" style="color:var(--muted)">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading loyalty information...</p>
        </div>
      } @else if (loyaltyAccount()) {
        <!-- Loyalty Card -->
        <div class="rounded-xl p-6 mb-6 bg-gradient-to-br from-primary to-primary-dark text-white">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm opacity-80">Your Level</p>
              <p class="text-2xl font-black">{{ getLevelIcon(loyaltyAccount()!.level) }} {{ loyaltyAccount()!.level }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm opacity-80">Points</p>
              <p class="text-3xl font-black">{{ loyaltyAccount()!.points }}</p>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-4">
            <div class="flex justify-between text-xs mb-1">
              <span>{{ loyaltyAccount()!.points }} pts</span>
              <span>Next level: {{ getNextLevelPoints() }} pts</span>
            </div>
            <div class="w-full bg-white/20 rounded-full h-2">
              <div class="bg-white rounded-full h-2 transition-all" [style.width.%]="loyaltyProgress()"></div>
            </div>
          </div>
        </div>

        <!-- Loyalty Tiers -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          @for (tier of loyaltyTiers; track tier.level) {
            <div class="rounded-xl p-4 text-center transition-all" 
              [class.ring-2]="loyaltyAccount()!.level === tier.level"
              [class.ring-primary]="loyaltyAccount()!.level === tier.level"
              style="background-color:var(--subtle);border:1px solid var(--border)">
              <p class="text-2xl mb-1">{{ getLevelIcon(tier.level) }}</p>
              <p class="font-bold text-sm" style="color:var(--text-color)">{{ tier.level }}</p>
              <p class="text-xs" style="color:var(--muted)">{{ tier.minPoints }}+ pts</p>
              <p class="text-xs font-semibold text-primary">{{ tier.multiplier }}x</p>
            </div>
          }
        </div>

        <!-- Points History -->
        <div>
          <h3 class="font-black text-sm mb-3" style="color:var(--text-color)">Recent Activity</h3>
          @if (pointsHistory().length === 0) {
            <p class="text-center py-8 text-sm" style="color:var(--muted)">No activity yet</p>
          } @else {
            <div class="space-y-2">
              @for (transaction of pointsHistory(); track transaction.id) {
                <div class="flex items-center justify-between p-3 rounded-lg" style="background-color:var(--subtle)">
                  <div class="flex-1">
                    <p class="font-semibold text-sm" style="color:var(--text-color)">{{ transaction.description }}</p>
                    <p class="text-xs" style="color:var(--muted)">{{ formatDate(transaction.createdAt) }}</p>
                  </div>
                  <p class="font-bold text-sm" [class.text-green-600]="transaction.type === 'EARNED' || transaction.type === 'BONUS'" 
                    [class.text-red-600]="transaction.type === 'REDEEMED' || transaction.type === 'EXPIRED'">
                    {{ transaction.type === 'EARNED' || transaction.type === 'BONUS' ? '+' : '-' }}{{ transaction.points }} pts
                  </p>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-12" style="color:var(--muted)">
          <p class="text-4xl mb-3">🏆</p>
          <p class="font-semibold">No loyalty account found</p>
          <p class="text-sm mt-1">Start shopping to earn loyalty points!</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfileLoyaltyComponent implements OnInit {
  private loyaltyService = inject(LoyaltyService);

  loyaltyAccount = signal<LoyaltyAccount | null>(null);
  pointsHistory = signal<PointsTransaction[]>([]);
  isLoading = signal(false);

  loyaltyTiers = LOYALTY_LEVELS;

  loyaltyProgress = computed(() => {
    const account = this.loyaltyAccount();
    if (!account) return 0;
    const current = LOYALTY_LEVELS.find(l => l.level === account.level);
    const next = LOYALTY_LEVELS.find(l => l.minPoints > (current?.minPoints || 0));
    if (!current || !next) return 100;
    return Math.min(100, Math.max(0, ((account.lifetimePoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100));
  });

  ngOnInit(): void {
    this.loadLoyaltyData();
  }

  private loadLoyaltyData(): void {
    this.isLoading.set(true);
    this.loyaltyService.getAccount().subscribe({
      next: (account) => {
        this.loyaltyAccount.set(account);
        // Use history from account if available
        if (account && account.history) {
          this.pointsHistory.set(account.history);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load loyalty account:', error);
        this.isLoading.set(false);
      }
    });
  }

  getLevelIcon(level: string): string {
    const icons: Record<string, string> = {
      'BRONZE': '🥉',
      'SILVER': '🥈',
      'GOLD': '🥇',
      'PLATINUM': '💎'
    };
    return icons[level] || '⭐';
  }

  getNextLevelPoints(): number {
    const account = this.loyaltyAccount();
    if (!account) return 0;
    const current = LOYALTY_LEVELS.find(l => l.level === account.level);
    const next = LOYALTY_LEVELS.find(l => l.minPoints > (current?.minPoints || 0));
    return next?.minPoints || 0;
  }

  formatDate(date: Date | string): string {
    if (!date) return '—';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}
