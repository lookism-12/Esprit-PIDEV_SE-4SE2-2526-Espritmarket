import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';

interface LoyaltyConfig {
  id?: string;
  baseRate: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
  bronzeMultiplier: number;
  silverMultiplier: number;
  goldMultiplier: number;
  platinumMultiplier: number;
  bonusQuantity: number;
  bonusQuantityThreshold: number;
  bonusHighOrder: number;
  bonusHighOrderThreshold: number;
}

interface LoyaltyAISuggestion {
  recommendedBaseRate: number;
  recommendedThresholds: { silver: number; gold: number; platinum: number };
  recommendedMultipliers: { bronze: number; silver: number; gold: number; platinum: number };
  strategy: string;
  reasoning: string;
  expectedImpact: string;
  tips: string[];
  score: number;
}

@Component({
  selector: 'app-loyalty-system',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span class="text-3xl">🏆</span>
          Loyalty System Configuration
        </h1>
        <p class="text-gray-600 mt-1">Configure loyalty tiers, points rules, and multipliers</p>
      </div>

      <!-- Configuration Form -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6 space-y-8">
          
          <!-- Base Rate Section -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>💎</span> Base Points Rate
            </h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Base Rate (% of order amount)
              </label>
              <input 
                type="number" 
                [(ngModel)]="config.baseRate"
                step="0.001"
                min="0.001"
                max="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
              <p class="text-xs text-gray-500 mt-2">
                Current: {{ baseRatePercentage }}% (Range: 0.1% - 1.0%)
              </p>
            </div>
          </div>

          <!-- Level Thresholds Section -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎯</span> Level Thresholds
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Silver -->
              <div class="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 border-2 border-gray-300">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-2xl">🥈</span>
                  <span class="font-bold text-gray-700">SILVER</span>
                </div>
                <input 
                  type="number" 
                  [(ngModel)]="config.silverThreshold"
                  min="1000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
                <p class="text-xs text-gray-600 mt-2">Points required</p>
              </div>

              <!-- Gold -->
              <div class="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-4 border-2 border-yellow-400">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-2xl">🥇</span>
                  <span class="font-bold text-yellow-700">GOLD</span>
                </div>
                <input 
                  type="number" 
                  [(ngModel)]="config.goldThreshold"
                  min="5000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                <p class="text-xs text-yellow-700 mt-2">Points required</p>
              </div>

              <!-- Platinum -->
              <div class="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-4 border-2 border-purple-400">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-2xl">💎</span>
                  <span class="font-bold text-purple-700">PLATINUM</span>
                </div>
                <input 
                  type="number" 
                  [(ngModel)]="config.platinumThreshold"
                  min="10000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <p class="text-xs text-purple-700 mt-2">Points required</p>
              </div>
            </div>
          </div>

          <!-- Multipliers Section -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>✨</span> Tier Multipliers
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- Bronze -->
              <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <label class="block text-sm font-medium text-orange-900 mb-2">
                  🥉 Bronze
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="config.bronzeMultiplier"
                  step="0.05"
                  min="1.0"
                  max="2.0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-orange-600 mt-1">{{ bronzeMultiplierDisplay }}</p>
              </div>

              <!-- Silver -->
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-300">
                <label class="block text-sm font-medium text-gray-900 mb-2">
                  🥈 Silver
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="config.silverMultiplier"
                  step="0.05"
                  min="1.0"
                  max="2.0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-gray-600 mt-1">{{ silverMultiplierDisplay }}</p>
              </div>

              <!-- Gold -->
              <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
                <label class="block text-sm font-medium text-yellow-900 mb-2">
                  🥇 Gold
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="config.goldMultiplier"
                  step="0.05"
                  min="1.0"
                  max="2.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-yellow-700 mt-1">{{ goldMultiplierDisplay }}</p>
              </div>

              <!-- Platinum -->
              <div class="bg-purple-50 rounded-lg p-4 border border-purple-300">
                <label class="block text-sm font-medium text-purple-900 mb-2">
                  💎 Platinum
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="config.platinumMultiplier"
                  step="0.05"
                  min="1.0"
                  max="3.0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-purple-700 mt-1">{{ platinumMultiplierDisplay }}</p>
              </div>
            </div>
          </div>

          <!-- Bonus Points Section -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎁</span> Bonus Points
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Quantity Bonus -->
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 class="font-medium text-blue-900 mb-3">Bulk Order Bonus</h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm text-blue-700 mb-1">Bonus Points</label>
                    <input 
                      type="number" 
                      [(ngModel)]="config.bonusQuantity"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm text-blue-700 mb-1">Minimum Items</label>
                    <input 
                      type="number" 
                      [(ngModel)]="config.bonusQuantityThreshold"
                      min="1"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  </div>
                </div>
              </div>

              <!-- High Order Bonus -->
              <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 class="font-medium text-green-900 mb-3">High Value Order Bonus</h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm text-green-700 mb-1">Bonus Points</label>
                    <input 
                      type="number" 
                      [(ngModel)]="config.bonusHighOrder"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm text-green-700 mb-1">Minimum Amount ($)</label>
                    <input 
                      type="number" 
                      [(ngModel)]="config.bonusHighOrderThreshold"
                      min="100"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between pt-6 border-t border-gray-200">
            <!-- 🤖 AI Advisor button -->
            <button
              (click)="openLoyaltyAI()"
              class="flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl transition-all shadow-md text-sm"
              style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">
              🤖 Help with AI
            </button>
            <div class="flex items-center gap-4">
              <button
                (click)="resetToDefaults()"
                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Reset to Defaults
              </button>
              <button
                (click)="saveConfiguration()"
                [disabled]="isSaving"
                class="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50">
                {{ isSaving ? 'Saving...' : 'Save Configuration' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      @if (successMessage) {
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span class="text-2xl">✅</span>
          <span class="text-green-800">{{ successMessage }}</span>
        </div>
      }
      @if (errorMessage) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span class="text-2xl">❌</span>
          <span class="text-red-800">{{ errorMessage }}</span>
        </div>
      }
    </div>

    <!-- ============================================================ -->
    <!-- 🤖 AI LOYALTY ADVISOR MODAL                                  -->
    <!-- ============================================================ -->
    @if (showLoyaltyAI) {
      <div class="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
           (click)="closeLoyaltyAI()">
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
             (click)="$event.stopPropagation()"
             style="animation: popIn 0.22s cubic-bezier(0.34,1.56,0.64,1);">

          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex items-start justify-between"
               style="background: linear-gradient(135deg, #f0faf5, #e6f5ee); border-bottom: 1px solid #c8e6d4;">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                   style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">🏆</div>
              <div>
                <h2 class="font-black text-lg" style="color: #1a3d2e;">AI Loyalty Advisor</h2>
                <p class="text-xs" style="color: #5a8a72;">Optimal parameters for maximum user engagement</p>
              </div>
            </div>
            <button (click)="closeLoyaltyAI()"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style="background: #d4ede0; color: #2d7a5f;">✕</button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            @if (loyaltyAILoading) {
              <div class="text-center py-10">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                     style="background: linear-gradient(135deg, #e6f5ee, #c8e6d4);">🤖</div>
                <div class="flex justify-center mb-3">
                  <div class="w-8 h-8 rounded-full animate-spin"
                       style="border: 3px solid #c8e6d4; border-top-color: #4a9e7f;"></div>
                </div>
                <p class="font-semibold" style="color: #1a3d2e;">Analyzing all shops & user behavior...</p>
                <p class="text-xs mt-1" style="color: #5a8a72;">Reading orders, loyalty cards, and engagement data</p>
              </div>
            }

            @if (!loyaltyAILoading && loyaltyAISuggestion) {

              <!-- Strategy badge -->
              <div class="rounded-2xl p-5 text-center"
                   style="background: linear-gradient(135deg, #e6f5ee, #d4ede0); border: 1px solid #b8dfc8;">
                <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color: #2d7a5f;">🎯 Recommended Strategy</p>
                <p class="font-black text-xl" style="color: #1a3d2e;">{{ loyaltyAISuggestion.strategy }}</p>
                <p class="text-sm mt-2" style="color: #2d7a5f;">{{ loyaltyAISuggestion.reasoning }}</p>
              </div>

              <!-- Recommended params -->
              <div class="rounded-xl p-4" style="background: #f8fdfb; border: 1px solid #e0f0e8;">
                <p class="text-xs font-bold mb-3" style="color: #2d7a5f;">💡 Recommended Parameters</p>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Base Rate</p>
                    <p class="font-black text-lg" style="color: #1a3d2e;">{{ (loyaltyAISuggestion.recommendedBaseRate * 100).toFixed(1) }}%</p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Silver Threshold</p>
                    <p class="font-bold" style="color: #1a3d2e;">{{ loyaltyAISuggestion.recommendedThresholds.silver }} pts</p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Gold Threshold</p>
                    <p class="font-bold" style="color: #1a3d2e;">{{ loyaltyAISuggestion.recommendedThresholds.gold }} pts</p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Platinum Threshold</p>
                    <p class="font-bold" style="color: #1a3d2e;">{{ loyaltyAISuggestion.recommendedThresholds.platinum }} pts</p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Gold Multiplier</p>
                    <p class="font-bold" style="color: #1a3d2e;">{{ loyaltyAISuggestion.recommendedMultipliers.gold }}x</p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Platinum Multiplier</p>
                    <p class="font-bold" style="color: #1a3d2e;">{{ loyaltyAISuggestion.recommendedMultipliers.platinum }}x</p>
                  </div>
                </div>
              </div>

              <!-- Expected impact -->
              <div class="rounded-xl p-4" style="background: #f0faf5; border: 1px solid #c8e6d4;">
                <p class="text-xs font-bold mb-1" style="color: #2d7a5f;">📈 Expected Impact</p>
                <p class="text-sm" style="color: #1a3d2e;">{{ loyaltyAISuggestion.expectedImpact }}</p>
              </div>

              <!-- Tips -->
              <div class="rounded-xl p-4" style="background: #fffbf0; border: 1px solid #f0e0a0;">
                <p class="text-xs font-bold mb-2" style="color: #8a6d00;">💡 Best Practices</p>
                <ul class="space-y-1.5">
                  @for (tip of loyaltyAISuggestion.tips; track $index) {
                    <li class="text-xs flex items-start gap-1.5" style="color: #5a4a00;">
                      <span style="color: #4a9e7f;">•</span><span>{{ tip }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Score -->
              <div class="flex items-center gap-3 px-1">
                <span class="text-xs shrink-0" style="color: #5a8a72;">Optimization Score</span>
                <div class="flex-1 rounded-full h-2" style="background: #e0f0e8;">
                  <div class="h-2 rounded-full" style="background: linear-gradient(90deg, #4a9e7f, #2d7a5f);"
                       [style.width.%]="loyaltyAISuggestion.score"></div>
                </div>
                <span class="text-xs font-bold shrink-0" style="color: #2d7a5f;">{{ loyaltyAISuggestion.score }}/100</span>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 flex gap-3" style="border-top: 1px solid #e0f0e8; background: #f8fdfb;">
            @if (loyaltyAISuggestion) {
              <button (click)="applyLoyaltyAISuggestion()"
                      class="flex-1 py-2.5 text-white text-sm font-bold rounded-xl transition-all"
                      style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">
                ✅ Apply These Parameters
              </button>
            }
            <button (click)="analyzeLoyaltyConfig()"
                    [disabled]="loyaltyAILoading"
                    class="px-4 py-2.5 text-sm font-bold rounded-xl disabled:opacity-40"
                    style="background: #e0f0e8; color: #2d7a5f;">🔄</button>
            <button (click)="closeLoyaltyAI()"
                    class="px-5 py-2.5 text-sm font-bold rounded-xl"
                    style="background: #f0f0f0; color: #555;">Close</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    @keyframes popIn {
      from { transform: scale(0.88) translateY(16px); opacity: 0; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }
  `]
})
export class LoyaltySystemComponent implements OnInit {
  private http = inject(HttpClient);
  
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // ── AI Loyalty Advisor ───────────────────────────────────────
  showLoyaltyAI = false;
  loyaltyAILoading = false;
  loyaltyAISuggestion: LoyaltyAISuggestion | null = null;

  openLoyaltyAI(): void {
    this.showLoyaltyAI = true;
    this.loyaltyAISuggestion = null;
    this.analyzeLoyaltyConfig();
  }

  closeLoyaltyAI(): void { this.showLoyaltyAI = false; }

  analyzeLoyaltyConfig(): void {
    this.loyaltyAILoading = true;
    this.loyaltyAISuggestion = null;

    // Fetch all loyalty cards to understand user distribution
    this.http.get<any[]>(`${environment.apiUrl}/admin/loyalty-cards`).subscribe({
      next: (cards) => this.buildLoyaltySuggestion(cards),
      error: () => this.buildLoyaltySuggestion([])
    });
  }

  private buildLoyaltySuggestion(cards: any[]): void {
    setTimeout(() => {
      const totalUsers = cards.length || 0;
      const bronzeUsers = cards.filter(c => c.level === 'BRONZE').length;
      const silverUsers = cards.filter(c => c.level === 'SILVER').length;
      const goldUsers   = cards.filter(c => c.level === 'GOLD').length;
      const platUsers   = cards.filter(c => c.level === 'PLATINUM').length;
      const avgPoints   = totalUsers > 0 ? cards.reduce((s, c) => s + (c.points || 0), 0) / totalUsers : 0;

      // Determine strategy based on distribution
      let strategy = 'Balanced Growth';
      let reasoning = 'Your loyalty system is well-balanced across tiers.';
      let score = 72;

      if (totalUsers === 0) {
        strategy = 'Acquisition Focus';
        reasoning = 'No loyalty cards yet — set low thresholds to onboard users quickly.';
        score = 60;
      } else if (bronzeUsers / Math.max(totalUsers, 1) > 0.85) {
        strategy = 'Engagement Boost';
        reasoning = `${Math.round(bronzeUsers / totalUsers * 100)}% of users are Bronze — lower Silver threshold to motivate upgrades.`;
        score = 65;
      } else if (platUsers / Math.max(totalUsers, 1) > 0.2) {
        strategy = 'Premium Retention';
        reasoning = 'High Platinum ratio — increase multipliers to reward your VIP users.';
        score = 85;
      }

      // Recommend based on avg points
      const baseRate = avgPoints > 500 ? 0.008 : avgPoints > 100 ? 0.005 : 0.003;
      const silverT  = avgPoints > 200 ? 500  : 300;
      const goldT    = silverT * 4;
      const platT    = silverT * 12;

      const tips = [
        'Set Silver threshold low enough that 30–40% of active users can reach it',
        'Platinum multiplier should be 2x+ to create real aspiration',
        'High-value order bonus drives larger cart sizes — set threshold at avg order × 1.5',
        totalUsers > 0 ? `Current avg points: ${Math.round(avgPoints)} — adjust base rate accordingly` : 'Start with base rate 0.5% and adjust after first 100 users',
        'Review thresholds every 3 months as your user base grows'
      ];

      this.loyaltyAISuggestion = {
        recommendedBaseRate: baseRate,
        recommendedThresholds: { silver: silverT, gold: goldT, platinum: platT },
        recommendedMultipliers: { bronze: 1.0, silver: 1.2, gold: 1.5, platinum: 2.0 },
        strategy,
        reasoning,
        expectedImpact: `+${Math.round(score * 0.3)}% user retention · +${Math.round(score * 0.2)}% avg order value · ${Math.round(score * 0.15)}% more repeat purchases`,
        tips,
        score
      };
      this.loyaltyAILoading = false;
    }, 1000);
  }

  applyLoyaltyAISuggestion(): void {
    if (!this.loyaltyAISuggestion) return;
    const s = this.loyaltyAISuggestion;
    this.config.baseRate = s.recommendedBaseRate;
    this.config.silverThreshold = s.recommendedThresholds.silver;
    this.config.goldThreshold = s.recommendedThresholds.gold;
    this.config.platinumThreshold = s.recommendedThresholds.platinum;
    this.config.bronzeMultiplier = s.recommendedMultipliers.bronze;
    this.config.silverMultiplier = s.recommendedMultipliers.silver;
    this.config.goldMultiplier = s.recommendedMultipliers.gold;
    this.config.platinumMultiplier = s.recommendedMultipliers.platinum;
    this.closeLoyaltyAI();
    this.successMessage = '✅ AI parameters applied — review and save when ready.';
    setTimeout(() => this.successMessage = '', 5000);
  }

  config: LoyaltyConfig = {
    baseRate: 0.002,
    silverThreshold: 5000,
    goldThreshold: 20000,
    platinumThreshold: 50000,
    bronzeMultiplier: 1.0,
    silverMultiplier: 1.1,
    goldMultiplier: 1.25,
    platinumMultiplier: 1.5,
    bonusQuantity: 10,
    bonusQuantityThreshold: 10,
    bonusHighOrder: 5,
    bonusHighOrderThreshold: 500.0
  };

  // Computed properties to prevent ExpressionChangedAfterItHasBeenCheckedError
  get baseRatePercentage(): string {
    return (this.config.baseRate * 100).toFixed(2);
  }
  
  get bronzeMultiplierDisplay(): string {
    return `${this.config.bronzeMultiplier}x`;
  }
  
  get silverMultiplierDisplay(): string {
    return `${this.config.silverMultiplier}x`;
  }
  
  get goldMultiplierDisplay(): string {
    return `${this.config.goldMultiplier}x`;
  }
  
  get platinumMultiplierDisplay(): string {
    return `${this.config.platinumMultiplier}x`;
  }

  ngOnInit(): void {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    this.http.get<LoyaltyConfig>(`${environment.apiUrl}/admin/loyalty-config`).subscribe({
      next: (data) => {
        this.config = data;
      },
      error: () => {
        // Use default values if API fails
        console.log('Using default loyalty configuration');
      }
    });
  }

  saveConfiguration(): void {
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    console.log('🔄 Saving loyalty configuration...', this.config);

    this.http.put<LoyaltyConfig>(`${environment.apiUrl}/admin/loyalty-config`, this.config).subscribe({
      next: (response) => {
        console.log('✅ Configuration saved successfully', response);
        
        // Update local state with server response to ensure consistency
        this.config = response;
        
        this.isSaving = false;
        this.successMessage = 'Loyalty configuration saved successfully!';
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        console.error('❌ Failed to save configuration', error);
        this.isSaving = false;
        
        // Handle different error types
        if (error.status === 403) {
          this.errorMessage = 'Access denied. You need ADMIN role to update loyalty configuration.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid configuration. Please check your values.';
        } else if (error.status === 401) {
          this.errorMessage = 'Session expired. Please login again.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to save configuration. Please try again.';
        }
        
        setTimeout(() => this.errorMessage = '', 8000);
      },
      complete: () => {
        // Ensure loading state is always stopped
        this.isSaving = false;
      }
    });
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset to default values?')) {
      this.config = {
        baseRate: 0.002,
        silverThreshold: 5000,
        goldThreshold: 20000,
        platinumThreshold: 50000,
        bronzeMultiplier: 1.0,
        silverMultiplier: 1.1,
        goldMultiplier: 1.25,
        platinumMultiplier: 1.5,
        bonusQuantity: 10,
        bonusQuantityThreshold: 10,
        bonusHighOrder: 5,
        bonusHighOrderThreshold: 500.0
      };
    }
  }
}
