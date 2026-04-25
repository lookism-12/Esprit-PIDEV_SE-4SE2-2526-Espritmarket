import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

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
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Optimized change detection
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
      <form [formGroup]="configForm" (ngSubmit)="saveConfiguration()" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                formControlName="baseRate"
                step="0.001"
                min="0.001"
                max="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                [class.border-red-500]="configForm.get('baseRate')?.invalid && configForm.get('baseRate')?.touched">
              <p class="text-xs text-gray-500 mt-2">
                Current: {{ baseRatePercentage() }}% (Range: 0.1% - 1.0%)
              </p>
              @if (configForm.get('baseRate')?.invalid && configForm.get('baseRate')?.touched) {
                <p class="text-xs text-red-600 mt-1">Base rate must be between 0.001 and 0.01</p>
              }
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
                  formControlName="silverThreshold"
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
                  formControlName="goldThreshold"
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
                  formControlName="platinumThreshold"
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
                  formControlName="bronzeMultiplier"
                  step="0.05"
                  min="1.0"
                  max="2.0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-orange-600 mt-1">{{ bronzeMultiplierDisplay() }}</p>
              </div>

              <!-- Silver -->
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-300">
                <label class="block text-sm font-medium text-gray-900 mb-2">
                  🥈 Silver
                </label>
                <input 
                  type="number" 
                  formControlName="silverMultiplier"
                  step="0.05"
                  min="1.0"
                  max="2.0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-gray-600 mt-1">{{ silverMultiplierDisplay() }}</p>
              </div>

              <!-- Gold -->
              <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
                <label class="block text-sm font-medium text-yellow-900 mb-2">
                  🥇 Gold
                </label>
                <input 
                  type="number" 
                  formControlName="goldMultiplier"
                  step="0.05"
                  min="1.0"
                  max="2.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-yellow-700 mt-1">{{ goldMultiplierDisplay() }}</p>
              </div>

              <!-- Platinum -->
              <div class="bg-purple-50 rounded-lg p-4 border border-purple-300">
                <label class="block text-sm font-medium text-purple-900 mb-2">
                  💎 Platinum
                </label>
                <input 
                  type="number" 
                  formControlName="platinumMultiplier"
                  step="0.05"
                  min="1.0"
                  max="3.0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-purple-700 mt-1">{{ platinumMultiplierDisplay() }}</p>
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
                      formControlName="bonusQuantity"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm text-blue-700 mb-1">Minimum Items</label>
                    <input 
                      type="number" 
                      formControlName="bonusQuantityThreshold"
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
                      formControlName="bonusHighOrder"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm text-green-700 mb-1">Minimum Amount ($)</label>
                    <input 
                      type="number" 
                      formControlName="bonusHighOrderThreshold"
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
              type="button"
              (click)="resetToDefaults()"
              [disabled]="isSaving()"
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              Reset to Defaults
            </button>
            <button 
              type="submit"
              [disabled]="isSaving() || configForm.invalid"
              class="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50">
              {{ isSaving() ? 'Saving...' : 'Save Configuration' }}
            </button>
          </div>
        </div>
      </form>

      <!-- Success/Error Messages -->
      @if (successMessage()) {
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span class="text-2xl">✅</span>
          <span class="text-green-800">{{ successMessage() }}</span>
        </div>
      }
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span class="text-2xl">❌</span>
          <span class="text-red-800">{{ errorMessage() }}</span>
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
  private fb = inject(FormBuilder);
  
  // ✅ Signals for reactive state management
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // ✅ Reactive Form (eliminates ExpressionChangedAfterItHasBeenCheckedError)
  configForm!: FormGroup;

  // ✅ Computed signals for display values (no change detection issues)
  baseRatePercentage = computed(() => {
    const baseRate = this.configForm?.get('baseRate')?.value ?? 0.002;
    return (baseRate * 100).toFixed(2);
  });

  bronzeMultiplierDisplay = computed(() => {
    const value = this.configForm?.get('bronzeMultiplier')?.value ?? 1.0;
    return `${value}x`;
  });

  silverMultiplierDisplay = computed(() => {
    const value = this.configForm?.get('silverMultiplier')?.value ?? 1.1;
    return `${value}x`;
  });

  goldMultiplierDisplay = computed(() => {
    const value = this.configForm?.get('goldMultiplier')?.value ?? 1.25;
    return `${value}x`;
  });

  platinumMultiplierDisplay = computed(() => {
    const value = this.configForm?.get('platinumMultiplier')?.value ?? 1.5;
    return `${value}x`;
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadConfiguration();
  }

  private initializeForm(): void {
    this.configForm = this.fb.group({
      baseRate: [0.002, [Validators.required, Validators.min(0.001), Validators.max(0.01)]],
      silverThreshold: [5000, [Validators.required, Validators.min(1000)]],
      goldThreshold: [20000, [Validators.required, Validators.min(5000)]],
      platinumThreshold: [50000, [Validators.required, Validators.min(10000)]],
      bronzeMultiplier: [1.0, [Validators.required, Validators.min(1.0), Validators.max(2.0)]],
      silverMultiplier: [1.1, [Validators.required, Validators.min(1.0), Validators.max(2.0)]],
      goldMultiplier: [1.25, [Validators.required, Validators.min(1.0), Validators.max(2.5)]],
      platinumMultiplier: [1.5, [Validators.required, Validators.min(1.0), Validators.max(3.0)]],
      bonusQuantity: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      bonusQuantityThreshold: [10, [Validators.required, Validators.min(1)]],
      bonusHighOrder: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
      bonusHighOrderThreshold: [500.0, [Validators.required, Validators.min(100)]]
    });
  }

  private loadConfiguration(): void {
    console.log('🔄 Loading loyalty configuration...');
    
    this.http.get<LoyaltyConfig>(`${environment.apiUrl}/admin/loyalty-config`)
      .pipe(
        tap(data => console.log('✅ Configuration loaded:', data)),
        catchError((error: HttpErrorResponse) => {
          console.warn('⚠️ Failed to load configuration, using defaults:', error);
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            // ✅ Immutable update - creates new form state
            this.configForm.patchValue(data, { emitEvent: false });
          }
        }
      });
  }

  saveConfiguration(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      this.errorMessage.set('Please fix validation errors before saving.');
      setTimeout(() => this.errorMessage.set(''), 5000);
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // ✅ Get immutable snapshot of form value
    const configData: LoyaltyConfig = { ...this.configForm.value };
    
    console.log('🔄 Saving loyalty configuration...', configData);

    this.http.put<LoyaltyConfig>(`${environment.apiUrl}/admin/loyalty-config`, configData)
      .pipe(
        tap(response => console.log('✅ Configuration saved successfully', response)),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Failed to save configuration', error);
          
          let errorMsg = 'Failed to save configuration. Please try again.';
          
          if (error.status === 403) {
            errorMsg = 'Access denied. You need ADMIN role to update loyalty configuration.';
          } else if (error.status === 400) {
            errorMsg = error.error?.message || 'Invalid configuration. Please check your values.';
          } else if (error.status === 401) {
            errorMsg = 'Session expired. Please login again.';
          } else if (error.error?.message) {
            errorMsg = error.error.message;
          }
          
          this.errorMessage.set(errorMsg);
          setTimeout(() => this.errorMessage.set(''), 8000);
          
          return of(null);
        }),
        finalize(() => {
          // ✅ Always stop loading state
          this.isSaving.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            // ✅ Update form with server response (immutable)
            this.configForm.patchValue(response, { emitEvent: false });
            
            this.successMessage.set('Loyalty configuration saved successfully!');
            setTimeout(() => this.successMessage.set(''), 5000);
          }
        }
      });
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset to default values?')) {
      // ✅ Immutable reset
      this.configForm.reset({
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
      });
    }
  }
}
