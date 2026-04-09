import { Component, input, computed, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Product } from '../../../models/product';
import { CartService } from '../../../core/cart.service';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { StockService } from '../../../core/stock.service';
import { FavoriteService } from '../../../core/favorite.service';
import { UserRole } from '../../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard implements OnInit, OnDestroy {
  product = input.required<Product>();
  
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private stockService = inject(StockService);
  readonly favoriteService = inject(FavoriteService);
  private router = inject(Router);
  private subscription = new Subscription();

  readonly isFavorited = computed(() => this.favoriteService.isProductFavorited(this.product().id));
  readonly isTogglingFavorite = signal(false);

  // Generate star array based on rating
  readonly stars = computed(() => {
    const rating = this.product().rating;
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(rating)) return 'full';
      if (i < rating) return 'half';
      return 'empty';
    });
  });

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly userRole = computed(() => this.authService.userRole());
  readonly isAddingToCart = computed(() => this.cartService.isLoading());

  // Role-based computed properties
  readonly isClient = computed(() => {
    const role = this.userRole();
    return role === UserRole.CLIENT;
  });

  // Enhanced stock management computed properties
  readonly isOutOfStock = computed(() => this.product().stock <= 0);
  readonly isLowStock = computed(() => {
    const stock = this.product().stock;
    const threshold = this.product().stockWarningThreshold || 5;
    return stock > 0 && stock <= threshold;
  });
  readonly maxPurchaseQuantity = computed(() => 
    this.product().maxPurchaseQuantity || this.product().stock || 10
  );

  readonly canPurchase = computed(() => {
    // Only authenticated clients can purchase AND stock must be available
    return this.isAuthenticated() && this.isClient() && !this.isOutOfStock();
  });

  readonly shouldShowAddToCart = computed(() => {
    // Show "Add to Cart" only for authenticated clients with available stock
    return this.isAuthenticated() && this.isClient();
  });

  readonly shouldShowCheckout = computed(() => {
    // Show "Checkout" for visitors
    return !this.isAuthenticated();
  });

  readonly stockStatusInfo = computed(() => {
    const product = this.product();
    if (product.stock <= 0) {
      return {
        text: 'Out of Stock',
        class: 'bg-red-100 text-red-800 border border-red-200',
        icon: '🚫',
        urgent: true
      };
    } else if (this.isLowStock()) {
      return {
        text: `Only ${product.stock} left`,
        class: 'bg-orange-100 text-orange-800 border border-orange-200',
        icon: '⚡',
        urgent: true
      };
    } else {
      return {
        text: 'In Stock',
        class: 'bg-green-100 text-green-800 border border-green-200',
        icon: '✅',
        urgent: false
      };
    }
  });

  constructor() {
    // Watch for stock updates and refresh product data
    effect(() => {
      const productId = this.product()?.id;
      if (productId) {
        this.subscription.add(
          this.stockService.stockUpdated$.subscribe(update => {
            if (update && update.productId === productId) {
              // Product stock was updated, could trigger UI refresh here
              console.log(`Stock updated for ${productId}: ${update.newStock} (${update.operation})`);
            }
          })
        );
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to real-time stock updates
    const productId = this.product().id;
    if (productId) {
      this.subscription.add(
        this.stockService.stockUpdated$.subscribe(update => {
          if (update && update.productId === productId) {
            if (update.operation === 'REDUCED') {
              this.toastService.warning(`Stock updated: ${update.newStock} available`);
            } else {
              this.toastService.success(`Stock updated: ${update.newStock} available`);
            }
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Enhanced add to cart with better stock validation and UX
   */
  addToCart(): void {
    if (!this.isAuthenticated()) {
      this.handleVisitorCheckout();
      return;
    }

    if (!this.isClient()) {
      this.toastService.warning('Only clients can add products to cart');
      return;
    }

    const product = this.product();
    
    // Enhanced stock validation
    if (this.isOutOfStock()) {
      this.toastService.error(`Sorry, "${product.name}" is currently out of stock`, 4000);
      return;
    }

    // Show stock warning for low stock items
    if (this.isLowStock()) {
      this.toastService.info(`Hurry! Only ${product.stock} items left in stock`, 3000);
    }

    this.cartService.addItem({
      productId: product.id,
      quantity: 1
    }).subscribe({
      next: (cartItem) => {
        // Enhanced success message with stock info
        const successMsg = this.isLowStock() 
          ? `${product.name} added to cart! Only ${product.stock - 1} left.`
          : `${product.name} added to cart!`;
        
        this.toastService.success(successMsg, 3000);
        console.log('✅ Product added to cart:', cartItem);
      },
      error: (error) => {
        console.error('❌ Failed to add product to cart:', error);
        
        // Enhanced error handling with stock-specific messages
        if (error.status === 409) {
          this.toastService.error('This item is no longer available. Stock may have changed.');
        } else if (error.status === 400 && error.error?.message?.includes('stock')) {
          this.toastService.error('Insufficient stock available. Please try a smaller quantity.');
        } else if (error.status === 401 || error.status === 403) {
          this.toastService.error('Please log in again to add items to cart.');
          this.handleVisitorCheckout();
        } else if (error.status === 404) {
          this.toastService.error('Product not found. It may have been discontinued.');
        } else if (error.status >= 500) {
          this.toastService.error('Server error. Please try again in a moment.');
        } else {
          this.toastService.error('Failed to add product to cart. Please try again.');
        }
      }
    });
  }

  /**
   * Enhanced checkout for visitors with stock validation
   */
  handleVisitorCheckout(): void {
    const product = this.product();
    
    if (this.isOutOfStock()) {
      this.toastService.error(`Sorry, "${product.name}" is currently out of stock`, 4000);
      return;
    }

    // Store product info for after login
    sessionStorage.setItem('pendingPurchase', JSON.stringify({
      productId: product.id,
      productName: product.name,
      action: 'checkout',
      timestamp: Date.now()
    }));

    const loginMsg = this.isLowStock() 
      ? `Please log in to purchase "${product.name}" (only ${product.stock} left!)`
      : `Please log in to continue your purchase`;
      
    this.toastService.info(loginMsg, 4000);
    
    // Navigate to login with return URL
    this.router.navigate(['/login'], {
      queryParams: { 
        returnUrl: `/product/${product.id}`,
        message: 'login-to-purchase'
      }
    });
  }

  /**
   * Quick checkout action (for visitors)
   */
  quickCheckout(): void {
    this.handleVisitorCheckout();
  }

  /**
   * Enhanced stock status styling with modern design
   */
  getStockStatusClass(): string {
    return this.stockStatusInfo().class;
  }

  getStockStatusText(): string {
    return this.stockStatusInfo().text;
  }

  getStockStatusIcon(): string {
    return this.stockStatusInfo().icon;
  }

  /**
   * Enhanced action button text with stock awareness
   */
  getActionButtonText(): string {
    if (this.isOutOfStock()) {
      return 'Out of Stock';
    }
    
    if (!this.isAuthenticated()) {
      return this.isLowStock() ? `Buy Now (${this.product().stock} left)` : 'Buy Now';
    }
    if (this.isClient()) {
      return this.isLowStock() ? `Add to Cart (${this.product().stock} left)` : 'Add to Cart';
    }
    return 'View Details';
  }

  /**
   * Enhanced action button classes with stock-based styling
   */
  getActionButtonClasses(): string {
    const baseClasses = 'w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform active:scale-90 shadow-lg';
    
    if (this.isOutOfStock()) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    
    if (!this.isAuthenticated()) {
      // Visitor - checkout button with urgency styling for low stock
      const urgentClass = this.isLowStock() ? 'ring-2 ring-orange-400 ring-opacity-75' : '';
      return `${baseClasses} bg-primary text-white hover:bg-primary-dark ${urgentClass}`;
    }
    
    if (this.isClient()) {
      // Client - add to cart with urgency styling for low stock
      const urgentClass = this.isLowStock() ? 'ring-2 ring-orange-400 ring-opacity-75' : '';
      return `${baseClasses} bg-accent text-dark hover:bg-accent-dark ${urgentClass}`;
    }
    
    // Other roles - view details (neutral)
    return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  }

  /**
   * Handle main action based on user role
   */
  handleMainAction(): void {
    if (!this.isAuthenticated()) {
      this.handleVisitorCheckout();
    } else if (this.isClient()) {
      this.addToCart();
    } else {
      // For other roles, just navigate to product details
      this.router.navigate(['/product', this.product().id]);
    }
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isAuthenticated()) {
      this.toastService.info('Please log in to save favorites');
      this.router.navigate(['/login']);
      return;
    }
    if (this.isTogglingFavorite()) return;
    this.isTogglingFavorite.set(true);
    this.favoriteService.toggleProduct(this.product().id).subscribe({
      next: (result) => {
        this.isTogglingFavorite.set(false);
        if (result) {
          this.toastService.success(`${this.product().name} added to favorites ❤️`);
        } else {
          this.toastService.info(`${this.product().name} removed from favorites`);
        }
      },
      error: () => this.isTogglingFavorite.set(false)
    });
  }
}
