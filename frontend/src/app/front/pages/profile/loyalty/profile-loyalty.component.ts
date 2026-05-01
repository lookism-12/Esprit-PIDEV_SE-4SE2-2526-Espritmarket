import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoyaltyService, LoyaltyDashboard, ShopSummary } from '../../../core/loyalty.service';
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
      } @else if (dashboard()) {
        <!-- Loyalty Card -->
        <div class="rounded-xl p-6 mb-6 bg-gradient-to-br from-primary to-primary-dark text-white">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm opacity-80">Your Level</p>
              <p class="text-2xl font-black">{{ getLevelIcon(dashboard()!.loyaltyLevel) }} {{ dashboard()!.loyaltyLevel }}</p>
              @if (dashboard()!.dynamicBoost > 0) {
                <p class="text-xs mt-1 bg-white/20 rounded px-2 py-1 inline-block">
                  🚀 {{ dashboard()!.boostTier }} Activity Boost: +{{ dashboard()!.dynamicBoost }}
                </p>
              }
            </div>
            <div class="text-right">
              <p class="text-sm opacity-80">Points</p>
              <p class="text-3xl font-black">{{ dashboard()!.totalPoints }}</p>
              <p class="text-xs opacity-80">{{ dashboard()!.currentMultiplier }}x multiplier</p>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-4">
            <div class="flex justify-between text-xs mb-1">
              <span>{{ dashboard()!.totalPoints }} pts</span>
              @if (dashboard()!.nextRewardName) {
                <span>Next reward: {{ dashboard()!.nextRewardName }}</span>
              }
            </div>
            <div class="w-full bg-white/20 rounded-full h-2">
              <div class="bg-white rounded-full h-2 transition-all" [style.width.%]="loyaltyProgress()"></div>
            </div>
            @if (dashboard()!.pointsToNextReward) {
              <p class="text-xs mt-1 opacity-80">{{ dashboard()!.pointsToNextReward }} points to next reward</p>
            }
          </div>
        </div>

        <!-- Activity Stats -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="rounded-xl p-4 text-center" style="background-color:var(--subtle);border:1px solid var(--border)">
            <p class="text-2xl font-black" style="color:var(--text-color)">{{ dashboard()!.ordersThisMonth }}</p>
            <p class="text-xs" style="color:var(--muted)">Orders This Month</p>
          </div>
          <div class="rounded-xl p-4 text-center" style="background-color:var(--subtle);border:1px solid var(--border)">
            <p class="text-2xl font-black" style="color:var(--text-color)">{{ dashboard()!.totalPointsEarned }}</p>
            <p class="text-xs" style="color:var(--muted)">Lifetime Points Earned</p>
          </div>
        </div>

        <!-- Top Shops Section -->
        @if (dashboard()!.topShops && dashboard()!.topShops.length > 0) {
          <div class="mb-6">
            <h3 class="font-black text-sm mb-3" style="color:var(--text-color)">🏪 Your Top Shops</h3>
            <p class="text-xs mb-3" style="color:var(--muted)">
              Your rewards can only be used in these shops (based on your last 30 days of orders)
            </p>
            <div class="space-y-2">
              @for (shop of dashboard()!.topShops; track shop.shopId) {
                <div class="flex items-center justify-between p-3 rounded-lg" style="background-color:var(--subtle);border:1px solid var(--border)">
                  <div class="flex-1">
                    <p class="font-semibold text-sm" style="color:var(--text-color)">{{ shop.shopName }}</p>
                    <p class="text-xs" style="color:var(--muted)">{{ shop.orderCount }} orders • {{ shop.totalSpent | number:'1.2-2' }} TND spent</p>
                  </div>
                  <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✅ Rewards Valid</span>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="mb-6 p-4 rounded-lg text-center" style="background-color:var(--subtle)">
            <p class="text-sm" style="color:var(--muted)">
              🛍️ Make purchases to unlock shops where you can use your rewards!
            </p>
          </div>
        }

        <!-- Available Rewards -->
        @if (dashboard()!.availableRewards && dashboard()!.availableRewards.length > 0) {
          <div class="mb-6">
            <h3 class="font-black text-sm mb-3" style="color:var(--text-color)">🎁 Available Rewards</h3>
            <p class="text-xs mb-3" style="color:var(--muted)">
              Convert your points to rewards you can use at checkout
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (reward of dashboard()!.availableRewards; track reward.id) {
                <div class="rounded-lg p-4" style="background-color:var(--subtle);border:1px solid var(--border)">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <p class="font-bold text-sm" style="color:var(--text-color)">{{ reward.name }}</p>
                      <p class="text-xs" style="color:var(--muted)">{{ reward.description }}</p>
                    </div>
                    <span class="text-xs font-bold text-primary">
                      {{ getRewardTypeDisplay(reward) }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between mt-3">
                    <span class="text-xs font-semibold" style="color:var(--muted)">
                      {{ reward.pointsRequired }} points
                    </span>
                    <button 
                      (click)="convertReward(reward)"
                      [disabled]="converting()"
                      class="text-xs px-3 py-1 rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50">
                      Convert
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Active Rewards -->
        @if (dashboard()!.activeRewards && dashboard()!.activeRewards.length > 0) {
          <div class="mb-6">
            <h3 class="font-black text-sm mb-3" style="color:var(--text-color)">🎫 Your Active Coupons</h3>
            <div class="space-y-2">
              @for (reward of dashboard()!.activeRewards; track reward.id) {
                <div class="rounded-lg p-4" style="background-color:var(--subtle);border:1px solid var(--border)">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex-1">
                      <p class="font-bold text-sm" style="color:var(--text-color)">{{ reward.rewardName }}</p>
                      <p class="text-xs" style="color:var(--muted)">
                        Expires in {{ reward.daysUntilExpiry }} days
                      </p>
                    </div>
                    <button 
                      (click)="copyCouponCode(reward.couponCode)"
                      class="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
                      📋 Copy Code
                    </button>
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <code class="text-sm font-mono bg-white px-2 py-1 rounded">{{ reward.couponCode }}</code>
                  </div>
                  @if (reward.allowedShops && reward.allowedShops.length > 0) {
                    <p class="text-xs mt-2" style="color:var(--muted)">
                      Valid in: {{ reward.allowedShops.map(s => s.shopName).join(', ') }}
                    </p>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Loyalty Tiers -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          @for (tier of loyaltyTiers; track tier.level) {
            <div class="rounded-xl p-4 text-center transition-all" 
              [class.ring-2]="dashboard()!.loyaltyLevel === tier.level"
              [class.ring-primary]="dashboard()!.loyaltyLevel === tier.level"
              style="background-color:var(--subtle);border:1px solid var(--border)">
              <p class="text-2xl mb-1">{{ getLevelIcon(tier.level) }}</p>
              <p class="font-bold text-sm" style="color:var(--text-color)">{{ tier.level }}</p>
              <p class="text-xs" style="color:var(--muted)">{{ tier.minPoints }}+ pts</p>
              <p class="text-xs font-semibold text-primary">{{ tier.multiplier }}x</p>
            </div>
          }
        </div>

        <!-- How It Works -->
        <div class="rounded-lg p-4" style="background-color:var(--subtle)">
          <h3 class="font-bold text-sm mb-2" style="color:var(--text-color)">💡 How It Works</h3>
          <ol class="text-xs space-y-1" style="color:var(--muted)">
            <li>1. Earn points with every purchase (multiplier based on your level)</li>
            <li>2. Convert points to rewards (discounts & coupons)</li>
            <li>3. Rewards only work in your top 3 most-shopped stores</li>
            <li>4. Use coupon codes at checkout to save money!</li>
          </ol>
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
  private router = inject(Router);

  dashboard = signal<LoyaltyDashboard | null>(null);
  isLoading = signal(false);
  converting = signal(false);

  loyaltyTiers = LOYALTY_LEVELS;

  loyaltyProgress = computed(() => {
    const dash = this.dashboard();
    if (!dash || !dash.pointsToNextReward) return 100;
    
    const current = LOYALTY_LEVELS.find(l => l.level === dash.loyaltyLevel);
    const next = LOYALTY_LEVELS.find(l => l.minPoints > (current?.minPoints || 0));
    if (!current || !next) return 100;
    
    return Math.min(100, Math.max(0, ((dash.totalPoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100));
  });

  ngOnInit(): void {
    this.loadLoyaltyData();
  }

  private loadLoyaltyData(): void {
    this.isLoading.set(true);
    this.loyaltyService.getDashboard().subscribe({
      next: (dashboard) => {
        console.log('✅ Loyalty dashboard loaded:', dashboard);
        this.dashboard.set(dashboard);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load loyalty dashboard:', error);
        this.isLoading.set(false);
      }
    });
  }

  convertReward(reward: any): void {
    if (this.converting()) return;
    
    if (!confirm(`Convert ${reward.pointsRequired} points to ${reward.name}?`)) {
      return;
    }
    
    this.converting.set(true);
    this.loyaltyService.convertPointsToReward(reward.id).subscribe({
      next: (userReward) => {
        console.log('✅ Reward converted:', userReward);
        alert(`Success! Your coupon code is: ${userReward.couponCode}\n\nValid for ${userReward.daysUntilExpiry} days in your top shops.`);
        this.converting.set(false);
        this.loadLoyaltyData(); // Refresh
      },
      error: (error) => {
        console.error('❌ Conversion failed:', error);
        alert(error.error?.message || 'Failed to convert points. Please try again.');
        this.converting.set(false);
      }
    });
  }

  copyCouponCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ Coupon code copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
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

  getRewardTypeDisplay(reward: any): string {
    if (reward.rewardType === 'PERCENTAGE_DISCOUNT') {
      return `${reward.rewardValue}% OFF`;
    } else {
      return `${reward.rewardValue} TND OFF`;
    }
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
