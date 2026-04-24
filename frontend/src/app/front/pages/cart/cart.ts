import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/cart.service';
import { CartResponse, CartItemResponse } from '../../models/cart.model';
import { CouponService } from '../../core/coupon.service';
import { LoyaltyService } from '../../core/loyalty.service';
import { ToastService } from '../../core/toast.service';
import { ImageUrlHelper } from '../../../shared/utils/image-url.helper';
import { LoyaltyLevel } from '../../models/loyalty.model';
import { AuthService } from '../../core/auth.service';
import { forkJoin } from 'rxjs';

// Enhanced cart item interface for display
interface DisplayCartItem extends CartItemResponse {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    category: string;
    sellerName: string;
    stock: number;
    stockStatus: string;
  };
  maxQuantity: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);
  private couponService = inject(CouponService);
  private loyaltyService = inject(LoyaltyService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  // New Wizard Flow State
  readonly currentStep = signal<'CART' | 'PLACE_ORDER' | 'PAY' | 'COMPLETE'>('CART');

  // Place Order Form Signals
  readonly shippingName = signal<string>('');
  readonly shippingPhone = signal<string>('');
  readonly shippingAddress = signal<string>('');
  readonly shippingCity = signal<string>('');
  readonly saveAsDefault = signal<boolean>(false);
  readonly paymentMethod = signal<'CARD' | 'CASH'>('CARD');
  readonly estimatedDelivery = signal<string>('');

  // Pay Form Signals
  readonly cardNumber = signal<string>('');
  readonly cardExpiry = signal<string>('');
  readonly cardCvv = signal<string>('');
  readonly cardName = signal<string>('');
  readonly isProcessingPayment = signal<boolean>(false);

  // Complete Step Data
  readonly orderNumber = signal<string | null>(null);

  // Backend-connected state
  readonly cart = this.cartService.cart;
  readonly cartItems = signal<DisplayCartItem[]>([]);
  readonly isLoading = this.cartService.isLoading;
  readonly error = this.cartService.error;

  // UI state
  readonly couponCode = signal<string>('');
  readonly appliedCoupon = signal<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);
  readonly couponError = signal<string>('');
  readonly isApplyingCoupon = signal<boolean>(false);
  readonly usePoints = signal<boolean>(false);
  readonly pointsToRedeem = signal<number>(0);

  // Real loyalty data from backend
  readonly loyaltyAccount = this.loyaltyService.account;
  readonly loyaltyPoints = computed(() => this.loyaltyAccount()?.points ?? 0);
  readonly loyaltyLevel = computed(() => this.loyaltyAccount()?.level ?? LoyaltyLevel.BRONZE);

  // Tax rate (19% TVA in Tunisia)
  readonly taxRate = 0.19;

  // Computed values from backend cart
  readonly subtotal = computed(() => this.cart()?.subtotal ?? 0);
  readonly discountAmount = computed(() => this.cart()?.discountAmount ?? 0);
  readonly taxAmount = computed(() => this.cart()?.taxAmount ?? 0);
  readonly total = computed(() => this.cart()?.total ?? 0);

  readonly itemCount = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  readonly isEmpty = computed(() => this.cartItems().length === 0);

  readonly shipping = computed(() => {
    if (this.loyaltyLevel() === LoyaltyLevel.GOLD || this.loyaltyLevel() === LoyaltyLevel.PLATINUM) {
      return 0; // Free shipping for Gold/Platinum
    }
    return this.subtotal() > 100 ? 0 : 7;
  });

  readonly earnedPoints = computed(() => {
    const multipliers: Record<LoyaltyLevel, number> = {
      [LoyaltyLevel.BRONZE]: 1,
      [LoyaltyLevel.SILVER]: 1.5,
      [LoyaltyLevel.GOLD]: 2,
      [LoyaltyLevel.PLATINUM]: 3
    };
    return Math.floor(this.subtotal() * (multipliers[this.loyaltyLevel()] || 1));
  });

  readonly couponDiscount = computed(() => {
    const coupon = this.appliedCoupon();
    if (!coupon) return 0;
    if (coupon.type === 'percentage') {
      return this.subtotal() * (coupon.discount / 100);
    }
    return Math.min(coupon.discount, this.subtotal());
  });

  readonly pointsDiscount = computed(() => {
    if (!this.usePoints()) return 0;
    return Math.min(this.pointsToRedeem() / 100, this.subtotal() - this.couponDiscount());
  });

  readonly tax = computed(() => {
    const cart = this.cart();
    return cart?.taxAmount ?? (this.subtotal() * this.taxRate);
  });

  readonly maxRedeemablePoints = computed(() => {
    const maxDiscount = this.subtotal() - this.couponDiscount();
    return Math.min(this.loyaltyPoints(), Math.floor(maxDiscount * 100));
  });

  constructor() {
    // Watch for wizard step redirect (e.g. from Buy Now)
    effect(() => {
      const step = this.route.snapshot.queryParamMap.get('step');
      if (step === 'PLACE_ORDER' && this.canCheckout()) {
        this.goToStep('PLACE_ORDER');
      }
    });
  }

  ngOnInit(): void {
    this.loadRealCartData();
    this.loyaltyService.getAccount().subscribe();
    this.initDeliveryEstimation();
    this.prefillUserProfile();
  }

  private initDeliveryEstimation(): void {
    const today = new Date();
    const minDay = new Date(today);
    minDay.setDate(today.getDate() + 3);
    const maxDay = new Date(today);
    maxDay.setDate(today.getDate() + 5);
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    this.estimatedDelivery.set(`${minDay.toLocaleDateString('en-US', options)} - ${maxDay.toLocaleDateString('en-US', options)}`);
  }

  private prefillUserProfile(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.shippingName.set(`${user.firstName} ${user.lastName}`.trim());
      this.shippingPhone.set(user.phone || '');
      // Try to parse out City and Address if "Aouina, Tunis"
      const addr = (user as any).address || '';
      if (addr.includes(',')) {
        const parts = addr.split(',');
        this.shippingAddress.set(parts[0].trim());
        this.shippingCity.set(parts[1].trim());
      } else {
        this.shippingAddress.set(addr);
      }
    }
  }

  // ============== WIZARD NAVIGATION ==============

  goToStep(step: 'CART' | 'PLACE_ORDER' | 'PAY' | 'COMPLETE') {
    if (step === 'PLACE_ORDER' && this.hasStockIssues()) return;
    this.currentStep.set(step);
    window.scrollTo(0, 0);
  }

  proceedToPlaceOrder() {
    if (!this.validateCartStock()) return;
    this.goToStep('PLACE_ORDER');
  }

  proceedToPaymentOrComplete() {
    if (!this.shippingName() || !this.shippingAddress() || !this.shippingCity() || !this.shippingPhone()) {
      this.toastService.warning('Please fill in all required delivery fields.');
      return;
    }

    if (this.paymentMethod() === 'CASH') {
      this.submitOrder();
    } else {
      this.goToStep('PAY');
    }
  }

  processCardPayment() {
    if (!this.cardNumber() || !this.cardExpiry() || !this.cardCvv() || !this.cardName()) {
      this.toastService.warning('Please fill in all credit card details.');
      return;
    }

    this.isProcessingPayment.set(true);
    // Simulate secure 3D secure checking or payment gateway delay
    setTimeout(() => {
      this.submitOrder();
    }, 1500);
  }

  submitOrder() {
    this.toastService.info('Processing your order...', 2000);
    
    // Concat address & city
    const fullAddress = `${this.shippingAddress()}, ${this.shippingCity()}`;
    const mappedPayment = this.paymentMethod() === 'CARD' ? 'CREDIT_CARD' : 'CASH_ON_DELIVERY';

    const checkoutData = {
      shippingAddress: fullAddress,
      paymentMethod: mappedPayment
    };

    this.cartService.checkout(checkoutData).subscribe({
      next: (order) => {
        this.isProcessingPayment.set(false);
        // Sometimes backend returns orderNumber or id
        this.orderNumber.set(order.orderNumber || order.id || `ORD-${Math.floor(Math.random() * 1000000)}`);
        this.goToStep('COMPLETE');
        this.toastService.success('🎉 Order placed successfully!', 4000);
        this.triggerConfetti();
        sessionStorage.removeItem('pendingPurchase');
      },
      error: (error) => {
        this.isProcessingPayment.set(false);
        console.error('❌ Checkout failed:', error);
        this.toastService.error('Checkout failed. Please try again.');
      }
    });
  }

  triggerConfetti(): void {
    // Inject a quick DOM-based confetti to celebrate without heavy libraries
    const colors = ['#dc2626', '#fca5a5', '#ef4444', '#ffffff', '#fee2e2'];
    for (let i = 0; i < 60; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'fixed';
      conf.style.zIndex = '9999';
      conf.style.width = Math.random() * 10 + 5 + 'px';
      conf.style.height = Math.random() * 10 + 5 + 'px';
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.top = '-10px';
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.opacity = Math.random() + 0.5 + '';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      // Fast dropping animation
      const duration = Math.random() * 2 + 2;
      conf.style.transition = `top ${duration}s ease-in, opacity ${duration}s ease-in, transform ${duration}s ease-in`;
      document.body.appendChild(conf);

      // Trigger animation
      setTimeout(() => {
        conf.style.top = '100vh';
        conf.style.opacity = '0';
        conf.style.transform = `rotate(${Math.random() * 720}deg)`;
      }, 10);

      // Cleanup
      setTimeout(() => document.body.removeChild(conf), duration * 1000 + 100);
    }
  }

  // ============== EXISTING CART LOGIC ==============

  private loadLoyaltyAccount(): void {
    this.loyaltyService.getAccount().subscribe();
  }

  loadRealCartData(): void {
    forkJoin({
      cart: this.cartService.getCart(),
      items: this.cartService.getCartItems()
    }).subscribe({
      next: ({ items }) => this.processCartItems(items),
      error: () => this.cartItems.set([])
    });
  }

  private processCartItems(backendItems: CartItemResponse[]): void {
    const displayItems: DisplayCartItem[] = backendItems.map(item => ({
      ...item,
      product: {
        id: item.productId,
        name: item.productName,
        imageUrl: ImageUrlHelper.toAbsoluteUrl(item.imageUrl),
        price: item.unitPrice,
        category: item.category || 'General',
        sellerName: item.sellerName || 'Unknown Seller',
        stock: item.stock || 0,
        stockStatus: item.stockStatus || 'UNKNOWN'
      },
      maxQuantity: item.stock || 100
    }));
    this.cartItems.set(displayItems);
  }

  private setError(message: string): void {
    this.cartService.error.set(message);
  }

  updateQuantity(itemId: string, change: number): void {
    const currentItem = this.cartItems().find(item => item.id === itemId);
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + change;
    if (newQuantity < 1) {
      this.removeItem(itemId);
      return;
    }

    this.cartService.updateItemQuantity(itemId, newQuantity).subscribe({
      next: () => {
        this.toastService.success('Quantity updated');
        this.loadRealCartData();
      },
      error: () => this.toastService.error('Failed to update quantity.')
    });
  }

  removeItem(id: string): void {
    const item = this.cartItems().find(item => item.id === id);
    const productName = item?.product.name || 'this item';
    this.toastService.withAction(`Remove ${productName}?`, 'Remove', () => this.confirmRemoveItem(id), 'warning');
  }

  private confirmRemoveItem(id: string): void {
    this.cartService.removeItem(id).subscribe({
      next: () => {
        this.toastService.success('Item removed');
        this.loadRealCartData();
      },
      error: () => this.toastService.error('Failed to remove item.')
    });
  }

  clearCart(): void {
    this.toastService.withAction(`Remove all ${this.itemCount()} items?`, 'Clear Cart', () => this.confirmClearCart(), 'warning');
  }

  private confirmClearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.cartItems.set([]);
        this.appliedCoupon.set(null);
        this.couponCode.set('');
        this.toastService.success('Cart cleared');
        this.loadRealCartData();
      },
      error: () => this.toastService.error('Failed to clear cart.')
    });
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      this.toastService.warning('Enter code');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set('');

    this.cartService.applyCoupon(code).subscribe({
      next: () => {
        if (code.toUpperCase() === 'ESPRIT10') {
          this.appliedCoupon.set({ code: 'ESPRIT10', discount: 10, type: 'percentage' });
        } else {
          this.appliedCoupon.set({ code: code.toUpperCase(), discount: 5, type: 'percentage' });
        }
        this.toastService.success('Coupon applied!');
        this.couponCode.set('');
        this.isApplyingCoupon.set(false);
      },
      error: () => {
        this.couponError.set('Invalid coupon code');
        this.isApplyingCoupon.set(false);
      }
    });
  }

  removeCoupon(): void {
    this.cartService.removeCoupon().subscribe({
      next: () => {
        this.appliedCoupon.set(null);
        this.toastService.info('Coupon removed');
      },
      error: () => this.appliedCoupon.set(null)
    });
  }

  toggleUsePoints(): void {
    this.usePoints.update(v => !v);
    if (this.usePoints()) {
      this.pointsToRedeem.set(this.maxRedeemablePoints());
    } else {
      this.pointsToRedeem.set(0);
    }
  }

  updatePointsToRedeem(points: number): void {
    this.pointsToRedeem.set(Math.min(points, this.maxRedeemablePoints()));
  }

  getLevelBadgeClass(level: LoyaltyLevel): string {
    switch (level) {
      case LoyaltyLevel.BRONZE: return 'bg-amber-100 text-amber-700';
      case LoyaltyLevel.SILVER: return 'bg-gray-200 text-gray-700';
      case LoyaltyLevel.GOLD: return 'bg-yellow-100 text-yellow-700';
      case LoyaltyLevel.PLATINUM: return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  readonly hasStockIssues = computed(() => {
    return this.cartItems().some(item => item.product.stock <= 0 || item.quantity > item.product.stock);
  });

  readonly stockIssueItems = computed(() => {
    return this.cartItems().filter(item => item.product.stock <= 0 || item.quantity > item.product.stock);
  });

  readonly canCheckout = computed(() => {
    return !this.isEmpty() && !this.hasStockIssues() && !this.isLoading();
  });

  getStockWarningMessage(): string {
    const issues = this.stockIssueItems();
    if (issues.length === 0) return '';
    if (issues.length === 1) {
      const item = issues[0];
      if (item.product.stock <= 0) return `"${item.product.name}" is out of stock`;
      return `Only ${item.product.stock} available (you requested ${item.quantity})`;
    }
    return `${issues.length} items have stock issues`;
  }

  private validateCartStock(): boolean {
    if (this.hasStockIssues()) {
      this.toastService.error(this.getStockWarningMessage(), 5000);
      return false;
    }
    return true;
  }
}



