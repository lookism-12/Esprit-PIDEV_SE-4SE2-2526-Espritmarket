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
          <div class="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
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
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoyaltySystemComponent implements OnInit {
  private http = inject(HttpClient);
  
  isSaving = false;
  successMessage = '';
  errorMessage = '';

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
