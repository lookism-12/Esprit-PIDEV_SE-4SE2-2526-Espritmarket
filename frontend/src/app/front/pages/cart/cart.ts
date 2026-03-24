import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { CartService } from '../../core/cart.service';
import { CouponService } from '../../core/coupon.service';
import { LoyaltyService } from '../../core/loyalty.service';
import { LoyaltyLevel } from '../../models/loyalty.model';

interface CartItem {
  id: string;
  product: Partial<Product>;
  quantity: number;
  maxQuantity: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  private router = inject(Router);
  private cartService = inject(CartService);
  private couponService = inject(CouponService);
  private loyaltyService = inject(LoyaltyService);

  // State
  readonly cartItems = signal<CartItem[]>([
    {
      id: 'item1',
      product: {
        id: '1',
        name: 'Modern Laptop Stand',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=870&auto=format&fit=crop',
        category: 'Electronics',
        sellerName: 'Amine K.',
        stock: 5,
        stockStatus: StockStatus.IN_STOCK
      },
      quantity: 1,
      maxQuantity: 5
    },
    {
      id: 'item2',
      product: {
        id: '3',
        name: 'Calculus Made Easy',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=774&auto=format&fit=crop',
        category: 'Books',
        sellerName: 'Mehdi B.',
        stock: 10,
        stockStatus: StockStatus.IN_STOCK
      },
      quantity: 2,
      maxQuantity: 10
    }
  ]);

  readonly couponCode = signal<string>('');
  readonly appliedCoupon = signal<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);
  readonly couponError = signal<string>('');
  readonly isApplyingCoupon = signal<boolean>(false);
  readonly usePoints = signal<boolean>(false);
  readonly pointsToRedeem = signal<number>(0);

  // Mock loyalty data
  readonly loyaltyPoints = signal<number>(250);
  readonly loyaltyLevel = signal<LoyaltyLevel>(LoyaltyLevel.SILVER);

  // Tax rate (19% TVA in Tunisia)
  readonly taxRate = 0.19;

  // Computed values
  readonly subtotal = computed(() => 
    this.cartItems().reduce((acc, item) => acc + ((item.product.price || 0) * item.quantity), 0)
  );

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

  readonly totalDiscount = computed(() => this.couponDiscount() + this.pointsDiscount());
  
  readonly taxableAmount = computed(() => this.subtotal() - this.totalDiscount());
  
  readonly tax = computed(() => this.taxableAmount() * this.taxRate);
  
  readonly shipping = computed(() => {
    if (this.loyaltyLevel() === LoyaltyLevel.GOLD || this.loyaltyLevel() === LoyaltyLevel.PLATINUM) {
      return 0; // Free shipping for Gold/Platinum
    }
    return this.subtotal() > 100 ? 0 : 7;
  });
  
  readonly total = computed(() => this.taxableAmount() + this.tax() + this.shipping());

  readonly earnedPoints = computed(() => {
    // Base: 1 point per TND, multiplied by level
    const multipliers: Record<LoyaltyLevel, number> = {
      [LoyaltyLevel.BRONZE]: 1,
      [LoyaltyLevel.SILVER]: 1.5,
      [LoyaltyLevel.GOLD]: 2,
      [LoyaltyLevel.PLATINUM]: 3
    };
    return Math.floor(this.taxableAmount() * (multipliers[this.loyaltyLevel()] || 1));
  });

  readonly itemCount = computed(() => 
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly isEmpty = computed(() => this.cartItems().length === 0);

  readonly maxRedeemablePoints = computed(() => {
    const maxDiscount = this.subtotal() - this.couponDiscount();
    return Math.min(this.loyaltyPoints(), Math.floor(maxDiscount * 100));
  });

  updateQuantity(itemId: string, change: number): void {
    this.cartItems.update(items => 
      items.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, Math.min(item.maxQuantity, item.quantity + change));
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }

  setQuantity(itemId: string, quantity: number): void {
    this.cartItems.update(items => 
      items.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, Math.min(item.maxQuantity, quantity));
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }

  removeItem(id: string): void {
    this.cartItems.update(items => items.filter(item => item.id !== id));
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartItems.set([]);
      this.appliedCoupon.set(null);
      this.usePoints.set(false);
      this.pointsToRedeem.set(0);
    }
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      this.couponError.set('Please enter a coupon code');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set('');

    // Mock coupon validation
    setTimeout(() => {
      if (code.toUpperCase() === 'ESPRIT10') {
        this.appliedCoupon.set({ code: code.toUpperCase(), discount: 10, type: 'percentage' });
        this.couponCode.set('');
      } else if (code.toUpperCase() === 'SAVE20') {
        this.appliedCoupon.set({ code: code.toUpperCase(), discount: 20, type: 'fixed' });
        this.couponCode.set('');
      } else if (code.toUpperCase() === 'STUDENT15') {
        this.appliedCoupon.set({ code: code.toUpperCase(), discount: 15, type: 'percentage' });
        this.couponCode.set('');
      } else {
        this.couponError.set('Invalid or expired coupon code');
      }
      this.isApplyingCoupon.set(false);
    }, 500);
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
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
    this.router.navigate(['/checkout']);
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
}


