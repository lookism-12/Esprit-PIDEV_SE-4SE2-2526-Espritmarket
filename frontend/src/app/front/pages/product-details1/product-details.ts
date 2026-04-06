import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { ProductService } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { NegotiationStatus, ProposalStatus } from '../../models/negotiation.model';

interface NegotiationProposal {
  id: string;
  proposedBy: 'buyer' | 'seller';
  amount: number;
  message?: string;
  status: ProposalStatus;
  createdAt: Date;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // State
  product = signal<Product | null>(null);

  images = signal([
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=870&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586528116311-ad86d7c493c8?q=80&w=870&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?q=80&w=870&auto=format&fit=crop'
  ]);

  selectedImage = signal(this.images()[0]);
  quantity = signal(1);
  isAddingToCart = signal(false);
  addedToCart = signal(false);
  activeTab = signal<'description' | 'reviews' | 'negotiation'>('description');

  // Enhanced stock management
  isOutOfStock = computed(() => {
    const product = this.product();
    return !product || product.stock <= 0;
  });
  
  isLowStock = computed(() => {
    const product = this.product();
    return product ? product.stock > 0 && product.stock <= 5 : false;
  });
  
  maxQuantity = computed(() => {
    const product = this.product();
    return product ? Math.min(product.stock, 10) : 0; // Max 10 per purchase
  });
  
  // Enhanced quantity validation
  canIncreaseQuantity = computed(() => this.quantity() < this.maxQuantity());
  canDecreaseQuantity = computed(() => this.quantity() > 1);

  // Stock status information
  stockInfo = computed(() => {
    const product = this.product();
    if (!product) {
      return {
        status: 'loading',
        message: 'Loading product...',
        class: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: '⏳'
      };
    }
    
    const stock = product.stock;
    if (stock <= 0) {
      return {
        status: 'out-of-stock',
        message: 'Currently out of stock',
        class: 'text-red-600 bg-red-50 border-red-200',
        icon: '🚫'
      };
    } else if (stock <= 5) {
      return {
        status: 'low-stock',
        message: `Only ${stock} items left in stock`,
        class: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: '⚡'
      };
    } else {
      return {
        status: 'in-stock',
        message: `${stock} items available`,
        class: 'text-green-600 bg-green-50 border-green-200',
        icon: '✅'
      };
    }
  });

  // Negotiation state
  showNegotiationModal = signal(false);
  negotiationForm!: FormGroup;
  isSubmittingOffer = signal(false);
  hasActiveNegotiation = signal(false);
  negotiationStatus = signal<NegotiationStatus>(NegotiationStatus.PENDING);
  aiSuggestedPrice = signal<number>(105);
  
  negotiationHistory = signal<NegotiationProposal[]>([
    {
      id: '1',
      proposedBy: 'buyer',
      amount: 100,
      message: 'Would you accept 100 TND?',
      status: ProposalStatus.COUNTER_OFFERED,
      createdAt: new Date('2024-02-25T10:30:00')
    },
    {
      id: '2',
      proposedBy: 'seller',
      amount: 110,
      message: 'I can do 110 TND, best I can offer.',
      status: ProposalStatus.PENDING,
      createdAt: new Date('2024-02-25T14:15:00')
    }
  ]);

  // Mock reviews
  reviews = signal([
    {
      id: '1',
      userName: 'Ahmed B.',
      rating: 5,
      comment: 'Excellent quality! Perfect for my MacBook. Highly recommended for fellow students.',
      date: new Date('2024-02-10'),
      verified: true
    },
    {
      id: '2',
      userName: 'Sara M.',
      rating: 4,
      comment: 'Good product, arrived quickly. The seller was very responsive.',
      date: new Date('2024-02-05'),
      verified: true
    },
    {
      id: '3',
      userName: 'Youssef K.',
      rating: 5,
      comment: 'Great value for money. Sturdy build and looks professional.',
      date: new Date('2024-01-28'),
      verified: false
    }
  ]);

  // Related products for AI recommendations
  relatedProducts = signal<Product[]>([
    {
      id: '10',
      name: 'USB-C Hub 7-in-1',
      description: 'All ports you need.',
      price: 65,
      category: 'Electronics',
      imageUrl: 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?q=80&w=870&auto=format&fit=crop',
      sellerId: 'seller2',
      sellerName: 'Sarra M.',
      rating: 4.6,
      reviewsCount: 15,
      stock: 3,
      stockStatus: StockStatus.IN_STOCK,
      condition: ProductCondition.NEW,
      isNegotiable: false
    },
    {
      id: '11',
      name: 'Laptop Sleeve 15"',
      description: 'Premium protection.',
      price: 35,
      category: 'Electronics',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400',
      sellerId: 'seller3',
      sellerName: 'Mehdi B.',
      rating: 4.8,
      reviewsCount: 22,
      stock: 8,
      stockStatus: StockStatus.IN_STOCK,
      condition: ProductCondition.NEW,
      isNegotiable: true
    }
  ]);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
    this.initNegotiationForm();
  }

  private initNegotiationForm(): void {
    this.negotiationForm = this.fb.group({
      proposedPrice: [null, [Validators.required, Validators.min(1)]],
      message: ['', [Validators.maxLength(500)]]
    });
  }

  private loadProduct(id: string): void {
    console.log('Loading product:', id);
    
    // ✅ FIXED: Actually load the product from the backend
    this.productService.getById(id).subscribe({
      next: (product) => {
        console.log('✅ Product loaded from backend:', product);
        this.product.set(product);
        
        // Update images if the product has images
        if (product.imageUrl) {
          const productImages = [product.imageUrl];
          this.images.set(productImages);
          this.selectedImage.set(product.imageUrl);
        }
      },
      error: (error) => {
        console.error('❌ Failed to load product:', error);
        this.toastService.error('Failed to load product details');
        
        // Fallback: Navigate back to products
        this.router.navigate(['/products']);
      }
    });
  }

  selectImage(img: string): void {
    this.selectedImage.set(img);
  }

  // Enhanced quantity management with stock validation
  increaseQuantity(): void {
    const product = this.product();
    if (!product) return;
    
    const maxStock = product.stock;
    this.quantity.update((q: number) => Math.min(maxStock, q + 1));
  }

  decreaseQuantity(): void {
    this.quantity.update((q: number) => Math.max(1, q - 1));
  }

  // Set quantity directly with validation
  setQuantity(newQuantity: number): void {
    const product = this.product();
    if (!product) return;
    
    const maxStock = product.stock;
    this.quantity.set(Math.max(1, Math.min(maxStock, newQuantity)));
  }

  // Enhanced add to cart with stock validation
  addToCart(): void {
    // ✅ CHECK FOR NULL PRODUCT FIRST
    const product = this.product();
    if (!product) {
      this.toastService.error('Product not loaded yet. Please wait...');
      return;
    }
    
    if (this.isOutOfStock()) {
      this.toastService.error('This product is currently out of stock');
      return;
    }
    
    if (this.quantity() > product.stock) {
      this.toastService.warning('Requested quantity exceeds available stock');
      this.setQuantity(product.stock); // Auto-adjust to max available
      return;
    }
    
    // ✅ ENHANCED VALIDATION: Check data before sending
    const productId = product.id;
    const quantity = this.quantity();
    
    console.log('🔍 Pre-validation check:', {
      productId: productId,
      productIdType: typeof productId,
      quantity: quantity,
      quantityType: typeof quantity,
      product: product
    });
    
    if (!productId) {
      this.toastService.error('Product ID is missing');
      console.error('❌ Product ID is null/undefined:', product);
      return;
    }
    
    if (!quantity || quantity <= 0) {
      this.toastService.error('Please select a valid quantity');
      console.error('❌ Invalid quantity:', quantity);
      return;
    }
    
    this.isAddingToCart.set(true);
    
    // FIXED: Call real CartService with validated data
    this.cartService.addItem({
      productId: productId,
      quantity: quantity
    }).subscribe({
      next: (cartItem) => {
        console.log('✅ Product added to cart:', cartItem);
        this.isAddingToCart.set(false);
        this.addedToCart.set(true);
        
        // Enhanced success message with product info
        const currentProduct = this.product();
        const successMsg = currentProduct 
          ? `${currentProduct.name} x${this.quantity()} added to cart!`
          : `Product x${this.quantity()} added to cart!`;
        this.toastService.success(successMsg);
        
        // Show success for longer if low stock
        const successDuration = this.isLowStock() ? 3000 : 2000;
        setTimeout(() => this.addedToCart.set(false), successDuration);
      },
      error: (error) => {
        console.error('❌ Failed to add product to cart:', error);
        this.isAddingToCart.set(false);
        
        // Enhanced error handling with toast notifications
        if (error.status === 409) {
          this.toastService.error('This item is no longer available. Stock may have changed.');
        } else if (error.status === 400 && error.error?.message?.includes('stock')) {
          this.toastService.error('Insufficient stock available. Please try a smaller quantity.');
        } else if (error.status === 401 || error.status === 403) {
          this.toastService.error('Please log in again to add items to cart.');
        } else if (error.status >= 500) {
          this.toastService.error('Server error. Please try again in a moment.');
        } else {
          this.toastService.error('Failed to add product to cart. Please try again.');
        }
      }
    });
  }

  // Enhanced buy now with stock validation
  buyNow(): void {
    // ✅ CHECK FOR NULL PRODUCT FIRST
    const product = this.product();
    if (!product) {
      this.toastService.error('Product not loaded yet. Please wait...');
      return;
    }
    
    if (this.isOutOfStock()) {
      this.toastService.error('This product is currently out of stock');
      return;
    }
    
    if (this.quantity() > product.stock) {
      this.toastService.warning('Requested quantity exceeds available stock');
      this.setQuantity(product.stock);
      return;
    }
    
    this.isAddingToCart.set(true);
    this.toastService.info('Adding to cart and redirecting to checkout...');
    
    // FIXED: Add to cart first, then navigate after success
    this.cartService.addItem({
      productId: product.id,
      quantity: this.quantity()
    }).subscribe({
      next: (cartItem) => {
        console.log('✅ Product added to cart for immediate purchase:', cartItem);
        this.isAddingToCart.set(false);
        this.addedToCart.set(true);
        
        this.toastService.success('Added to cart! Redirecting to checkout...');
        
        // Navigate to cart after successful add
        setTimeout(() => {
          this.router.navigate(['/cart']);
        }, 500);
      },
      error: (error) => {
        console.error('❌ Failed to add product for purchase:', error);
        this.isAddingToCart.set(false);
        
        // Enhanced error handling with toast notifications
        if (error.status === 409) {
          this.toastService.error('This item is no longer available. Stock may have changed.');
        } else if (error.status === 400 && error.error?.message?.includes('stock')) {
          this.toastService.error('Insufficient stock available. Please try a smaller quantity.');
        } else if (error.status === 401 || error.status === 403) {
          this.toastService.error('Please log in again to make purchases.');
        } else if (error.status >= 500) {
          this.toastService.error('Server error. Please try again in a moment.');
        } else {
          this.toastService.error('Failed to add product to cart. Please try again.');
        }
      }
    });
  }

  toggleFavorite(): void {
    this.product.update(p => p ? ({ ...p, isFavorite: !p.isFavorite }) : p);
  }

  setActiveTab(tab: 'description' | 'reviews' | 'negotiation'): void {
    this.activeTab.set(tab);
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  hasDiscount(): boolean {
    const p = this.product();
    return p ? !!p.originalPrice && p.originalPrice > p.price : false;
  }

  discountPercentage(): number {
    const p = this.product();
    if (!p || !p.originalPrice || p.originalPrice <= 0) return 0;
    return ((p.originalPrice - p.price) / p.originalPrice) * 100;
  }

  contactSeller(): void {
    const product = this.product();
    if (product) {
      this.router.navigate(['/chat'], { queryParams: { sellerId: product.sellerId } });
    }
  }

  // Negotiation methods
  openNegotiationModal(): void {
    const product = this.product();
    if (product) {
      this.showNegotiationModal.set(true);
      this.negotiationForm.patchValue({
        proposedPrice: Math.floor(product.price * 0.9)
      });
    }
  }

  closeNegotiationModal(): void {
    this.showNegotiationModal.set(false);
    this.negotiationForm.reset();
  }

  submitOffer(): void {
    if (this.negotiationForm.invalid) {
      this.negotiationForm.markAllAsTouched();
      return;
    }

    this.isSubmittingOffer.set(true);
    const { proposedPrice, message } = this.negotiationForm.value;

    setTimeout(() => {
      this.negotiationHistory.update(history => [
        ...history,
        {
          id: `${history.length + 1}`,
          proposedBy: 'buyer',
          amount: proposedPrice,
          message: message,
          status: ProposalStatus.PENDING,
          createdAt: new Date()
        }
      ]);
      this.hasActiveNegotiation.set(true);
      this.isSubmittingOffer.set(false);
      this.closeNegotiationModal();
    }, 1000);
  }

  acceptOffer(proposalId: string): void {
    this.negotiationHistory.update(history =>
      history.map(p => p.id === proposalId ? { ...p, status: ProposalStatus.ACCEPTED } : p)
    );
    this.negotiationStatus.set(NegotiationStatus.ACCEPTED);
  }

  rejectOffer(proposalId: string): void {
    this.negotiationHistory.update(history =>
      history.map(p => p.id === proposalId ? { ...p, status: ProposalStatus.REJECTED } : p)
    );
  }

  useAiSuggestedPrice(): void {
    this.negotiationForm.patchValue({
      proposedPrice: this.aiSuggestedPrice()
    });
  }

  // Stock status helpers
  getStockStatusClass(status: StockStatus): string {
    switch (status) {
      case StockStatus.IN_STOCK: return 'text-green-600 bg-green-50 border-green-200';
      case StockStatus.LOW_STOCK: return 'text-orange-600 bg-orange-50 border-orange-200';
      case StockStatus.OUT_OF_STOCK: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  getStockStatusText(status: StockStatus): string {
    switch (status) {
      case StockStatus.IN_STOCK: return 'In Stock';
      case StockStatus.LOW_STOCK: return 'Low Stock';
      case StockStatus.OUT_OF_STOCK: return 'Out of Stock';
      default: return 'Unknown';
    }
  }

  getConditionText(condition: ProductCondition): string {
    return condition.replace('_', ' ');
  }

  getNegotiationStatusClass(status: NegotiationStatus): string {
    switch (status) {
      case NegotiationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case NegotiationStatus.ACCEPTED: return 'bg-green-100 text-green-800';
      case NegotiationStatus.REJECTED: return 'bg-red-100 text-red-800';
      case NegotiationStatus.CLOSED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  getProposalStatusClass(status: ProposalStatus): string {
    switch (status) {
      case ProposalStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case ProposalStatus.ACCEPTED: return 'bg-green-100 text-green-700';
      case ProposalStatus.REJECTED: return 'bg-red-100 text-red-700';
      case ProposalStatus.COUNTER_OFFERED: return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
