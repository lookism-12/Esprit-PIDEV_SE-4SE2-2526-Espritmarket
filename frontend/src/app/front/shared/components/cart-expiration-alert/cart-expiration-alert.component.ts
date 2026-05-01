import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartExpirationWarning } from '../../../core/cart.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-cart-expiration-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Cart Expiration Alert Overlay -->
    @if (showAlert() && warning()) {
      <div class="fixed inset-0 z-[9999] flex items-start justify-center pt-6 pointer-events-none">
        <div 
          class="pointer-events-auto w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden animate-slideDown"
          [class]="getAlertClass()">
          
          <!-- Header -->
          <div class="px-5 py-3 flex items-center gap-3" [class]="getHeaderClass()">
            <span class="text-2xl">{{ getIcon() }}</span>
            <div class="flex-1">
              <h4 class="font-bold text-white text-sm">Cart Expiration Alert</h4>
              <p class="text-white/80 text-xs">{{ getTimeLabel() }}</p>
            </div>
            <button 
              (click)="dismiss()"
              class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <span class="text-white text-sm">✕</span>
            </button>
          </div>
          
          <!-- Body -->
          <div class="px-5 py-4 bg-white">
            <p class="text-gray-700 text-sm leading-relaxed mb-3">
              {{ warning()?.message }}
            </p>
            
            <!-- Cart Info -->
            <div class="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
              <div class="text-center">
                <div class="text-lg font-bold text-gray-900">{{ warning()?.itemCount }}</div>
                <div class="text-xs text-gray-500">Items</div>
              </div>
              <div class="w-px h-8 bg-gray-300"></div>
              <div class="text-center">
                <div class="text-lg font-bold text-gray-900">{{ warning()?.cartTotal?.toFixed(2) }} TND</div>
                <div class="text-xs text-gray-500">Total</div>
              </div>
              <div class="w-px h-8 bg-gray-300"></div>
              <div class="text-center">
                <div class="text-lg font-bold" [class]="getTimerColor()">
                  {{ formatRemainingTime() }}
                </div>
                <div class="text-xs text-gray-500">Remaining</div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-3">
              <button 
                (click)="goToCheckout()"
                class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg">
                🛒 Checkout Now
              </button>
              <button 
                (click)="dismiss()"
                class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors">
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slideDown {
      animation: slideDown 0.4s ease-out;
    }
  `]
})
export class CartExpirationAlertComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router = inject(Router);
  private checkSubscription?: Subscription;
  private periodicSubscription?: Subscription;

  showAlert = signal(false);
  warning = signal<CartExpirationWarning | null>(null);

  ngOnInit(): void {
    // Check on init (login)
    this.checkExpiration();

    // Check every 5 minutes
    this.periodicSubscription = interval(300000).subscribe(() => {
      this.checkExpiration();
    });
  }

  ngOnDestroy(): void {
    this.checkSubscription?.unsubscribe();
    this.periodicSubscription?.unsubscribe();
  }

  checkExpiration(): void {
    this.checkSubscription = this.cartService.checkExpirationWarning().subscribe({
      next: (warning) => {
        if (warning.hasWarning) {
          this.warning.set(warning);
          this.showAlert.set(true);
        }
      },
      error: () => {
        // Silently fail — don't block user experience
      }
    });
  }

  dismiss(): void {
    this.showAlert.set(false);
  }

  goToCheckout(): void {
    this.showAlert.set(false);
    this.router.navigate(['/cart']);
  }

  getIcon(): string {
    const severity = this.warning()?.severity;
    if (severity === 'CRITICAL') return '🚨';
    if (severity === 'URGENT') return '⚠️';
    return '⏰';
  }

  getAlertClass(): string {
    const severity = this.warning()?.severity;
    if (severity === 'CRITICAL') return 'border-2 border-red-500';
    if (severity === 'URGENT') return 'border-2 border-orange-500';
    return 'border-2 border-yellow-500';
  }

  getHeaderClass(): string {
    const severity = this.warning()?.severity;
    if (severity === 'CRITICAL') return 'bg-gradient-to-r from-red-600 to-red-700';
    if (severity === 'URGENT') return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
  }

  getTimerColor(): string {
    const severity = this.warning()?.severity;
    if (severity === 'CRITICAL') return 'text-red-600';
    if (severity === 'URGENT') return 'text-orange-600';
    return 'text-yellow-600';
  }

  getTimeLabel(): string {
    const mins = this.warning()?.remainingMinutes ?? 0;
    if (mins <= 30) return 'Expiring in minutes!';
    if (mins <= 60) return 'Less than 1 hour left';
    const hours = Math.floor(mins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  }

  formatRemainingTime(): string {
    const mins = this.warning()?.remainingMinutes ?? 0;
    if (mins <= 0) return 'Expired';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins}m`;
  }
}
