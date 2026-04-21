import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { CartService } from '../../core/cart.service';
import { CartResponse, CartItemResponse } from '../../models/cart.model';
import { CouponService } from '../../core/coupon.service';
import { LoyaltyService } from '../../core/loyalty.service';
import { ToastService } from '../../core/toast.service';
import { ImageUrlHelper } from '../../../shared/utils/image-url.helper';
import { LoyaltyLevel } from '../../models/loyalty.model';

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
    // Base: 1 point per TND, multiplied by level
    const multipliers: Record<LoyaltyLevel, number> = {
      [LoyaltyLevel.BRONZE]: 1,
      [LoyaltyLevel.SILVER]: 1.5,
      [LoyaltyLevel.GOLD]: 2,
      [LoyaltyLevel.PLATINUM]: 3
    };
    return Math.floor(this.subtotal() * (multipliers[this.loyaltyLevel()] || 1));
  });

  // Additional computed properties for template compatibility
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
    // 100 points = 1 TND
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

  ngOnInit(): void {
    this.loadRealCartData();
    this.loadLoyaltyAccount();
    
    // Subscribe to cart updates to refresh data automatically
    this.cartService.cartUpdated$.subscribe(() => {
      console.log('🔄 Cart update detected in cart page, refreshing...');
      this.loadRealCartData();
    });
  }

  /**
   * Load loyalty account from backend
   */
  private loadLoyaltyAccount(): void {
    console.log('🏆 Loading loyalty account...');
    this.loyaltyService.getAccount().subscribe({
      next: (account) => {
        console.log('✅ Loyalty account loaded:', account);
      },
      error: (error) => {
        console.warn('⚠️ Failed to load loyalty account, using fallback:', error);
      }
    });
  }

  /**
   * Load real cart data from backend - NO MOCK DATA
   * Public method to allow retry from error state
   */
  loadRealCartData(): void {
    console.log('🔄 Loading real cart data from backend...');
    
    // Load cart totals and items in parallel with better error handling
    const cart$ = this.cartService.getCart();
    const items$ = this.cartService.getCartItems();

    // Subscribe to cart totals with graceful error handling
    cart$.subscribe({
      next: (cart) => {
        console.log('✅ Cart totals loaded:', cart);
        // Direct backend integration - no mock mode
      },
      error: (error) => {
        console.error('❌ Failed to load cart:', error);
        this.toastService.error('Failed to load cart. Please refresh the page.');
      }
    });

    // Subscribe to cart items with graceful error handling
    items$.subscribe({
      next: (items) => {
        console.log('✅ Cart items loaded:', items.length, 'items');
        this.processCartItems(items);
      },
      error: (error) => {
        console.error('❌ Failed to load cart items:', error);
        // The service handles fallback automatically
        this.cartItems.set([]);
        this.toastService.error('Failed to load cart items. Please refresh the page.');
      }
    });
  }

  /**
   * Process backend cart items into display format
   */
  private processCartItems(backendItems: CartItemResponse[]): void {
    const displayItems: DisplayCartItem[] = backendItems.map(item => {
      return {
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
      };
    });

    this.cartItems.set(displayItems);
    console.log('✅ Cart items processed for display:', displayItems.length);
  }

  /**
   * Set error message using cart service
   */
  private setError(message: string): void {
    this.cartService.error.set(message);
  }

  updateQuantity(itemId: string, change: number): void {
    const currentItem = this.cartItems().find(item => item.id === itemId);
    if (!currentItem) {
      console.error('❌ Item not found:', itemId);
      this.toastService.error('Item not found in cart');
      return;
    }

    const newQuantity = currentItem.quantity + change;
    if (newQuantity < 1) {
      this.removeItem(itemId);
      return;
    }

    console.log('🔄 Updating quantity for item:', itemId, 'to:', newQuantity);

    this.cartService.updateItemQuantity(itemId, newQuantity).subscribe({
      next: (updatedItem) => {
        console.log('✅ Quantity updated successfully:', updatedItem);
        this.toastService.success('Quantity updated');
        // Backend sync handled by service, UI will update via cart refresh
        this.loadRealCartData(); // Refresh to ensure consistency
      },
      error: (error) => {
        console.error('❌ Failed to update quantity:', error);
        this.toastService.error('Failed to update quantity. Please try again.');
        this.setError('Failed to update quantity. Please try again.');
      }
    });
  }

  removeItem(id: string): void {
    const item = this.cartItems().find(item => item.id === id);
    const productName = item?.product.name || 'this item';
    
    // Show confirmation toast with action
    const confirmToastId = this.toastService.withAction(
      `Remove ${productName} from cart?`,
      'Remove',
      () => this.confirmRemoveItem(id),
      'warning'
    );
  }

  private confirmRemoveItem(id: string): void {
    console.log('🗑️ Removing item:', id);

    this.cartService.removeItem(id).subscribe({
      next: () => {
        console.log('✅ Item removed successfully:', id);
        this.toastService.success('Item removed from cart');
        // Backend sync handled by service, UI will update via cart refresh
        this.loadRealCartData(); // Refresh to ensure consistency
      },
      error: (error) => {
        console.error('❌ Failed to remove item:', error);
        this.toastService.error('Failed to remove item. Please try again.');
        this.setError('Failed to remove item. Please try again.');
      }
    });
  }

  clearCart(): void {
    const confirmToastId = this.toastService.withAction(
      `Remove all ${this.itemCount()} items from cart?`,
      'Clear Cart',
      () => this.confirmClearCart(),
      'warning'
    );
  }

  private confirmClearCart(): void {
    console.log('🗑️ Clearing entire cart');

    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('✅ Cart cleared successfully');
        this.cartItems.set([]);
        this.appliedCoupon.set(null);
        this.couponCode.set('');
        this.couponError.set('');
        this.toastService.success('Cart cleared');
        this.loadRealCartData(); // Refresh to ensure consistency
      },
      error: (error) => {
        console.error('❌ Failed to clear cart:', error);
        this.toastService.error('Failed to clear cart. Please try again.');
        this.setError('Failed to clear cart. Please try again.');
      }
    });
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      this.couponError.set('Please enter a coupon code');
      this.toastService.warning('Please enter a coupon code');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set('');

    this.cartService.applyCoupon(code).subscribe({
      next: (cart) => {
        console.log('✅ Coupon applied:', cart);
        // Set mock coupon for display
        if (code.toUpperCase() === 'ESPRIT10') {
          this.appliedCoupon.set({ code: 'ESPRIT10', discount: 10, type: 'percentage' });
          this.toastService.success('Coupon applied! 10% discount added');
        } else {
          this.appliedCoupon.set({ code: code.toUpperCase(), discount: 5, type: 'percentage' });
          this.toastService.success('Coupon applied! 5% discount added');
        }
        this.couponCode.set('');
        this.isApplyingCoupon.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to apply coupon:', error);
        this.couponError.set('Invalid or expired coupon code');
        this.toastService.error('Invalid or expired coupon code');
        this.isApplyingCoupon.set(false);
      }
    });
  }

  removeCoupon(): void {
    this.cartService.removeCoupon().subscribe({
      next: (cart) => {
        console.log('✅ Coupon removed:', cart);
        this.appliedCoupon.set(null);
        this.toastService.info('Coupon removed');
      },
      error: (error) => {
        console.error('❌ Failed to remove coupon:', error);
        this.toastService.error('Failed to remove coupon');
        // Remove locally as fallback
        this.appliedCoupon.set(null);
      }
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

  proceedToCheckout(): void {
    if (this.isEmpty()) {
      this.toastService.warning('Your cart is empty');
      return;
    }

    // Show loading state
    this.toastService.info('Processing your order...', 2000);

    const checkoutData = {
      shippingAddress: 'Default Address', // TODO: Get from user
      paymentMethod: 'CREDIT_CARD' // Default payment method
    };

    this.cartService.checkout(checkoutData).subscribe({
      next: (order) => {
        console.log('✅ Order created:', order);
        this.toastService.success('🎉 Order placed successfully! Redirecting...', 4000);
        
        // Clear any pending purchase data
        sessionStorage.removeItem('pendingPurchase');
        
        // Navigate to success page
        setTimeout(() => {
          this.router.navigate(['/checkout-success'], { 
            queryParams: { orderId: order.id } 
          });
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Checkout failed:', error);
        this.toastService.error('Checkout failed. Please try again.');
      }
    });
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

  // ==================== STOCK VALIDATION ====================

  /**
   * Check if any cart items have stock issues
   */
  readonly hasStockIssues = computed(() => {
    return this.cartItems().some(item => 
      item.product.stock <= 0 || item.quantity > item.product.stock
    );
  });

  /**
   * Get items with insufficient stock
   */
  readonly stockIssueItems = computed(() => {
    return this.cartItems().filter(item => 
      item.product.stock <= 0 || item.quantity > item.product.stock
    );
  });

  /**
   * Check if checkout should be disabled due to stock issues
   */
  readonly canCheckout = computed(() => {
    return !this.isEmpty() && !this.hasStockIssues() && !this.isLoading();
  });

  /**
   * Get stock warning message for cart
   */
  getStockWarningMessage(): string {
    const issues = this.stockIssueItems();
    if (issues.length === 0) return '';
    
    if (issues.length === 1) {
      const item = issues[0];
      if (item.product.stock <= 0) {
        return `"${item.product.name}" is out of stock`;
      }
      return `Only ${item.product.stock} "${item.product.name}" available (you requested ${item.quantity})`;
    }
    
    return `${issues.length} items have stock issues`;
  }

  /**
   * Validate stock before operations
   */
  private validateCartStock(): boolean {
    if (this.hasStockIssues()) {
      this.toastService.error(this.getStockWarningMessage(), 5000);
      return false;
    }
    return true;
  }

  /**
   * Enhanced checkout with stock validation
   */
  checkoutWithStockValidation(): void {
    console.log('🛒 Starting checkout with stock validation...');
    
    if (!this.validateCartStock()) {
      return;
    }

    // Stock validation passed - proceed with normal checkout
    this.proceedToCheckout();
  }
}


