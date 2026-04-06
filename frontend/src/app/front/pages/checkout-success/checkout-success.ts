import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/toast.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div class="max-w-2xl mx-auto text-center">
        
        <!-- Success Animation -->
        <div class="mb-8">
          <div class="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
          
          <!-- Confetti Effect -->
          <div class="confetti-container">
            @for (confetti of confettiPieces; track $index) {
              <div class="confetti" [style.left.px]="confetti.x" [style.animation-delay.ms]="confetti.delay">
                {{ confetti.emoji }}
              </div>
            }
          </div>
        </div>

        <!-- Success Message -->
        <h1 class="text-4xl md:text-5xl font-black text-gray-800 mb-4">
          Order Placed Successfully! 🎉
        </h1>
        
        <p class="text-xl text-gray-600 mb-2">
          Thank you for your purchase, {{ userFullName() }}!
        </p>
        
        @if (orderId()) {
          <p class="text-sm text-gray-500 mb-8">
            Order ID: <span class="font-mono bg-gray-100 px-2 py-1 rounded">{{ orderId() }}</span>
          </p>
        }

        <!-- Order Summary -->
        <div class="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📦 What's Next?
          </h2>
          
          <div class="space-y-4">
            <div class="flex items-start gap-4 text-left">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">1</div>
              <div>
                <h3 class="font-semibold text-gray-800">Order Confirmation</h3>
                <p class="text-sm text-gray-600">You'll receive an email confirmation shortly with your order details.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4 text-left">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold text-yellow-600">2</div>
              <div>
                <h3 class="font-semibold text-gray-800">Seller Preparation</h3>
                <p class="text-sm text-gray-600">The seller will prepare your items for delivery within 1-2 business days.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4 text-left">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">3</div>
              <div>
                <h3 class="font-semibold text-gray-800">Delivery</h3>
                <p class="text-sm text-gray-600">Your order will be delivered to your campus address within 3-5 business days.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/profile" 
             class="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all transform hover:scale-105 shadow-xl">
            📋 View My Orders
          </a>
          
          <a routerLink="/products" 
             class="bg-white text-primary border-2 border-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary hover:text-white transition-all transform hover:scale-105 shadow-lg">
            🛍️ Continue Shopping
          </a>
        </div>

        <!-- Social Sharing -->
        <div class="mt-8 pt-8 border-t border-gray-200">
          <p class="text-sm text-gray-500 mb-4">Love shopping with us? Share the experience!</p>
          <div class="flex justify-center gap-4">
            <button class="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
              📘 Share on Facebook
            </button>
            <button class="bg-blue-400 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-500 transition-colors">
              🐦 Share on Twitter
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confetti-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 200px;
      overflow: hidden;
      pointer-events: none;
      z-index: 10;
    }

    .confetti {
      position: absolute;
      font-size: 24px;
      animation: confetti-fall 3s linear infinite;
    }

    @keyframes confetti-fall {
      0% {
        transform: translateY(-200px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(600px) rotate(360deg);
        opacity: 0;
      }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-20px);
      }
      60% {
        transform: translateY(-10px);
      }
    }
  `]
})
export class CheckoutSuccess implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  readonly orderId = signal<string>('');
  readonly userFullName = computed(() => this.authService.getFullName() || 'Valued Customer');

  // Confetti animation data
  readonly confettiPieces = Array.from({ length: 20 }, (_, i) => ({
    emoji: ['🎉', '🎊', '✨', '🌟', '💫', '🎁', '🛍️', '💝'][i % 8],
    x: Math.random() * window.innerWidth,
    delay: Math.random() * 2000
  }));

  ngOnInit(): void {
    // Get order ID from query params
    this.route.queryParams.subscribe(params => {
      if (params['orderId']) {
        this.orderId.set(params['orderId']);
      }
      
      if (params['highlight']) {
        this.orderId.set(params['highlight']);
      }
    });

    // Show success message
    this.toastService.success('Your order has been placed successfully! 🎉', 5000);

    // Clear any checkout-related session data
    sessionStorage.removeItem('pendingPurchase');
    sessionStorage.removeItem('checkoutData');
  }
}