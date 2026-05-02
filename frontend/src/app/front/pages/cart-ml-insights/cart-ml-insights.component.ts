import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartMLService, CartMLSuggestion } from '../../core/cart-ml.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-cart-ml-insights',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-black" style="color:var(--text-color)">🤖 AI Cart Insights</h1>
          <p class="text-sm mt-1" style="color:var(--muted)">
            ML model predictions for your cart items — {{ modelStatus() }}
          </p>
        </div>
        <button (click)="loadSuggestions()"
          class="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark">
          🔄 Refresh
        </button>
      </div>

      <!-- Service Status -->
      <div class="rounded-xl p-4 mb-6 flex items-center gap-3"
        [class.bg-green-50]="serviceUp()"
        [class.bg-red-50]="!serviceUp()"
        [class.border-green-200]="serviceUp()"
        [class.border-red-200]="!serviceUp()"
        style="border-width:1px">
        <span class="text-lg">{{ serviceUp() ? '✅' : '❌' }}</span>
        <div>
          <p class="font-bold text-sm" [class.text-green-700]="serviceUp()" [class.text-red-700]="!serviceUp()">
            ML Service: {{ serviceUp() ? 'Online' : 'Offline' }}
          </p>
          <p class="text-xs" [class.text-green-600]="serviceUp()" [class.text-red-600]="!serviceUp()">
            {{ serviceUp() ? 'Trained model active (85.2% promo accuracy, 93.6% price accuracy)' : 'Using rule-based fallback' }}
          </p>
        </div>
        <a href="http://localhost:8002/docs" target="_blank"
          class="ml-auto text-xs text-blue-600 underline">
          API Docs →
        </a>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-16" style="color:var(--muted)">
          <div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading AI predictions...</p>
        </div>
      }

      <!-- Empty cart -->
      @else if (suggestions().length === 0 && !loading()) {
        <div class="text-center py-16 rounded-2xl" style="background:var(--subtle)">
          <p class="text-4xl mb-3">🛒</p>
          <p class="font-bold" style="color:var(--text-color)">No items in cart</p>
          <p class="text-sm mt-1" style="color:var(--muted)">Add products to your cart to see AI suggestions</p>
          <a routerLink="/products" class="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold">
            Browse Products
          </a>
        </div>
      }

      <!-- Summary Cards -->
      @else {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="rounded-xl p-4 text-center" style="background:var(--subtle);border:1px solid var(--border)">
            <p class="text-2xl font-black" style="color:var(--text-color)">{{ suggestions().length }}</p>
            <p class="text-xs mt-1" style="color:var(--muted)">Items Analyzed</p>
          </div>
          <div class="rounded-xl p-4 text-center bg-orange-50 border border-orange-200">
            <p class="text-2xl font-black text-orange-700">{{ promoCount() }}</p>
            <p class="text-xs mt-1 text-orange-600">🏷️ Promo Eligible</p>
          </div>
          <div class="rounded-xl p-4 text-center bg-red-50 border border-red-200">
            <p class="text-2xl font-black text-red-700">{{ priceUpCount() }}</p>
            <p class="text-xs mt-1 text-red-600">📈 Price Rising</p>
          </div>
          <div class="rounded-xl p-4 text-center bg-green-50 border border-green-200">
            <p class="text-2xl font-black text-green-700">{{ priceDownCount() }}</p>
            <p class="text-xs mt-1 text-green-600">📉 Price Dropping</p>
          </div>
        </div>

        <!-- Predictions Table -->
        <div class="rounded-2xl overflow-hidden" style="border:1px solid var(--border)">
          <div class="px-6 py-4" style="background:var(--subtle)">
            <h2 class="font-bold text-sm" style="color:var(--text-color)">Per-Item Predictions</h2>
          </div>
          <div class="divide-y" style="divide-color:var(--border)">
            @for (s of suggestions(); track s.product_id) {
              <div class="px-6 py-4 flex flex-wrap items-center gap-4">
                <!-- Product ID -->
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-mono truncate" style="color:var(--muted)">{{ s.product_id }}</p>
                  <p class="text-xs mt-1" style="color:var(--muted)">{{ s.expected_impact }}</p>
                </div>

                <!-- Promotion Badge -->
                <span class="px-2 py-1 rounded-full text-xs font-bold"
                  [class.bg-orange-100]="s.promotion_suggestion === 'YES'"
                  [class.text-orange-700]="s.promotion_suggestion === 'YES'"
                  [class.bg-gray-100]="s.promotion_suggestion === 'NO'"
                  [class.text-gray-500]="s.promotion_suggestion === 'NO'">
                  {{ s.promotion_suggestion === 'YES' ? '🏷️ Promo' : '✓ No Promo' }}
                </span>

                <!-- Price Badge -->
                <span class="px-2 py-1 rounded-full text-xs font-bold"
                  [class.bg-red-100]="s.price_adjustment === 'INCREASE'"
                  [class.text-red-700]="s.price_adjustment === 'INCREASE'"
                  [class.bg-green-100]="s.price_adjustment === 'DECREASE'"
                  [class.text-green-700]="s.price_adjustment === 'DECREASE'"
                  [class.bg-gray-100]="s.price_adjustment === 'HOLD' || s.price_adjustment === 'STABLE'"
                  [class.text-gray-500]="s.price_adjustment === 'HOLD' || s.price_adjustment === 'STABLE'">
                  {{ s.price_adjustment === 'INCREASE' ? '📈 Rising' : s.price_adjustment === 'DECREASE' ? '📉 Dropping' : '➡️ Stable' }}
                </span>

                <!-- Recommended Price -->
                @if (s.recommended_price) {
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    💡 {{ s.recommended_price | number:'1.2-2' }} TND
                  </span>
                }

                <!-- Confidence -->
                <div class="text-right text-xs" style="color:var(--muted)">
                  <p>Promo: {{ (s.confidence_promo * 100) | number:'1.0-0' }}%</p>
                  <p>Price: {{ (s.confidence_price * 100) | number:'1.0-0' }}%</p>
                </div>

                <!-- Model badge -->
                <span class="px-2 py-1 rounded text-xs"
                  [class.bg-purple-100]="s.model_used === 'trained-ml'"
                  [class.text-purple-700]="s.model_used === 'trained-ml'"
                  [class.bg-gray-100]="s.model_used !== 'trained-ml'"
                  [class.text-gray-500]="s.model_used !== 'trained-ml'">
                  {{ s.model_used === 'trained-ml' ? '🧠 ML' : '📋 Rules' }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Go to Cart -->
        <div class="mt-6 text-center">
          <a routerLink="/cart"
            class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark">
            🛒 Go to Cart to See Badges
          </a>
        </div>
      }
    </div>
  `
})
export class CartMLInsightsComponent implements OnInit {
  private mlService = inject(CartMLService);
  private http = inject(HttpClient);

  suggestions = signal<CartMLSuggestion[]>([]);
  loading = signal(false);
  serviceUp = signal(false);
  modelStatus = signal('Checking...');

  promoCount  = computed(() => this.suggestions().filter(s => s.promotion_suggestion === 'YES').length);
  priceUpCount= computed(() => this.suggestions().filter(s => s.price_adjustment === 'INCREASE').length);
  priceDownCount = computed(() => this.suggestions().filter(s => s.price_adjustment === 'DECREASE').length);

  ngOnInit() {
    this.checkHealth();
    this.loadSuggestions();
  }

  checkHealth() {
    this.mlService.checkHealth().subscribe(h => {
      this.serviceUp.set(h.cartMLService === 'UP');
      this.modelStatus.set(h.message);
    });
  }

  loadSuggestions() {
    this.loading.set(true);
    this.mlService.getSuggestions().subscribe({
      next: (data) => {
        this.suggestions.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
