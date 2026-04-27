import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product, StockStatus, ProductCondition, ProductStatus } from '../../models/product';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../core/cart.service';
import { NegotiationService } from '../../core/negotiation.service';
import { AuthService } from '../../core/auth.service';
import { ShopService } from '../../core/shop.service';
import { NegotiationStatus, NegotiationResponse, ProposalStatus } from '../../models/negotiation.model';
import { ImageUrlHelper } from '../../../shared/utils/image-url.helper';
import { Subscription } from 'rxjs';
import { catchError, of } from 'rxjs';
import { SavService } from '../../../back/core/services/sav.service';

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
export class ProductDetails implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private negotiationService = inject(NegotiationService);
  private authService = inject(AuthService);
  private shopService = inject(ShopService);
  private savService = inject(SavService);
  private fb = inject(FormBuilder);
  private wsSub?: Subscription;

  // my shop id (set if current user is a provider)
  private myShopId = signal<string | null>(null);

  // State
  product = signal<Product | null>(null);
  isLoadingProduct = signal(true);
  productNotFound = signal(false);

  // Computed for safe access
  safeProduct = computed(() => this.product() || {} as Product);
  hasProduct = computed(() => this.product() !== null);

  images = signal<string[]>([]);
  selectedImage = signal<string>('');
  quantity = signal(1);
  isAddingToCart = signal(false);
  addedToCart = signal(false);
  activeTab = signal<'description' | 'reviews' | 'negotiation'>('description');

  // Favorites
  isFavorite = signal(false);
  isTogglingFavorite = signal(false);
  
  // Roles
  isAdmin = computed(() => this.authService.userRole() === 'ADMIN');

  // True when the logged-in provider owns the shop that sells this product
  isOwnProduct = computed(() => {
    const shopId = this.myShopId();
    const product = this.product();
    if (!shopId || !product) return false;
    return (product as any).sellerId === shopId || (product as any).shopId === shopId;
  });
  showNegotiationModal = signal(false);
  negotiationForm!: FormGroup;
  isSubmittingOffer = signal(false);
  hasActiveNegotiation = signal(false);
  negotiationStatus = signal<NegotiationStatus>(NegotiationStatus.PENDING);
  aiSuggestedPrice = signal<number>(0);
  activeNegotiation = signal<NegotiationResponse | null>(null);
  negotiationError = signal<string | null>(null);
  error = signal<string | null>(null);

  // Reviews data (loaded from API)
  reviews = signal<any[]>([]);
  reviewsCount = computed(() => this.reviews().length);
  averageRating = computed(() => {
    const revs = this.reviews();
    if (revs.length === 0) return 0.0;
    const sum = revs.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Number((sum / revs.length).toFixed(1));
  });

  // Related products from MongoDB
  relatedProducts = signal<Product[]>([]);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
    this.initNegotiationForm();
    // Load provider's shop so we can block self-negotiation
    const role = this.authService.userRole();
    if (role === 'PROVIDER' || role === 'SELLER') {
      this.shopService.getMyShop().pipe(catchError(() => of(null))).subscribe(shop => {
        if (shop?.id) this.myShopId.set(shop.id);
      });
    }
  }

  private initNegotiationForm(): void {
    const price = this.product()?.price ?? 0;
    this.negotiationForm = this.fb.group({
      proposedPrice: [
        Math.floor(price * 0.9) || null,
        [
          Validators.min(0)
        ]
      ],
      quantity: [1, [Validators.required, Validators.min(1)]],
      message: ['', [Validators.maxLength(500)]],
      isExchange: [false],
      exchangeImage: [null]
    });

    // Handle conditional validation
    this.negotiationForm.get('isExchange')?.valueChanges.subscribe(isExchange => {
      const priceControl = this.negotiationForm.get('proposedPrice');
      if (isExchange) {
        priceControl?.clearValidators();
      } else {
        priceControl?.setValidators([Validators.required, Validators.min(1), Validators.max(price > 0 ? price - 0.01 : 999999)]);
      }
      priceControl?.updateValueAndValidity();
    });
  }

  private loadProduct(id: string): void {
    console.log('🔍 Loading product:', id);
    this.isLoadingProduct.set(true);
    this.productNotFound.set(false);
    
    this.productService.getById(id).subscribe({
      next: (data) => {
        console.log('✅ Product loaded:', data);
        
        // Map product data
        const product: Product = {
          id: (data as any).id || (data as any)._id,
          name: data.name,
          description: data.description,
          price: data.price,
          categoryIds: (data as any).categoryIds,
          category: data.category || 'Others',
          imageUrl: ImageUrlHelper.toAbsoluteUrl(((data as any).images && (data as any).images.length > 0) ? (data as any).images[0].url || (data as any).images[0] : null),
          images: (data as any).images?.map((img: any) => ImageUrlHelper.toAbsoluteUrl(img.url || img)) || [],
          sellerId: (data as any).shopId || 'Unknown',
          sellerName: (data as any).sellerName || 'Marketplace Seller',
          rating: 4.5,
          reviewsCount: 12,
          stock: data.stock || 0,
          stockStatus: data.stock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
          condition: (data.condition as ProductCondition) || ProductCondition.NEW,
          isNegotiable: (data as any).isNegotiable || false,
          status: data.status || ProductStatus.APPROVED,
          // ✅ TRUST & REPUTATION FIELDS
          trustScore: (data as any).trustScore,
          trustBadge: (data as any).trustBadge
        };
        
        this.product.set(product);
        
        // Set images
        const productImages = product.images && product.images.length > 0 
          ? product.images 
          : [product.imageUrl];
        this.images.set(productImages);
        this.selectedImage.set(productImages[0]);
        
        // Load related products (same category)
        this.loadRelatedProducts(product.category);
        
        // Load reviews (SAV Feedbacks)
        this.loadFeedbacks(product.id);
        
        this.isLoadingProduct.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load product:', err);
        this.productNotFound.set(true);
        this.isLoadingProduct.set(false);
      }
    });
  }

  private loadFeedbacks(productId: string): void {
    this.savService.getFeedbacksByProductId(productId).subscribe({
      next: (feedbacks) => {
        // Map SavFeedback to our reviews array format
        const mappedReviews = feedbacks.map(fb => ({
          id: fb.id,
          userName: (fb as any).userName || 'Anonymous Customer',
          rating: fb.rating,
          date: fb.creationDate,
          comment: fb.message,
          verified: true, // It's from a cart item, so it's verified
          imageUrls: fb.imageUrls || []
        }));
        this.reviews.set(mappedReviews);
      },
      error: (err) => {
        console.error('❌ Failed to load feedbacks:', err);
      }
    });
  }

  archiveReview(reviewId: string): void {
    if (!confirm('Are you sure you want to archive this review?')) return;
    
    this.savService.updateFeedbackStatus(reviewId, 'ARCHIVED').subscribe({
      next: () => {
        // Remove from list or update status
        this.reviews.update(reviews => reviews.filter(r => r.id !== reviewId));
      },
      error: (err) => {
        console.error('❌ Failed to archive review:', err);
        alert('Failed to archive review.');
      }
    });
  }

  private loadRelatedProducts(category: string): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        // Filter by category and take first 4 products, excluding current product
        const related = products
          .filter(p => (p as any).category === category && (p as any).id !== this.product()?.id)
          .slice(0, 4)
          .map((p: any) => ({
            id: p.id || p._id,
            name: p.name,
            description: p.description,
            price: p.price,
            categoryIds: p.categoryIds,
            category: p.category || category,
            imageUrl: ImageUrlHelper.toAbsoluteUrl((p.images && p.images.length > 0) ? (p.images[0].url || p.images[0]) : null),
            sellerId: p.shopId || 'Unknown',
            sellerName: 'Marketplace Seller',
            rating: 4.5,
            reviewsCount: 10,
            stock: p.stock || 0,
            stockStatus: p.stock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
            condition: (p.condition as ProductCondition) || ProductCondition.NEW,
            isNegotiable: p.isNegotiable || false,
            status: p.status || ProductStatus.APPROVED
          }));
        
        this.relatedProducts.set(related);
      },
      error: (err) => {
        console.error('❌ Failed to load related products:', err);
      }
    });
  }

  selectImage(img: string): void {
    this.selectedImage.set(img);
  }

  increaseQuantity(): void {
    const product = this.product();
    if (!product) return;
    const max = product.stock || 10;
    this.quantity.update(q => Math.min(max, q + 1));
  }

  decreaseQuantity(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product || product.stockStatus === StockStatus.OUT_OF_STOCK) return;

    this.isAddingToCart.set(true);
    this.cartService.addItem({
      productId: product.id,
      quantity: this.quantity()
    }).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        this.addedToCart.set(true);
        setTimeout(() => this.addedToCart.set(false), 2000);
      },
      error: (err) => {
        this.isAddingToCart.set(false);
        this.error.set(err.error?.message || err.error?.fieldErrors
          ? JSON.stringify(err.error?.fieldErrors)
          : 'Failed to add to cart. Please try again.');
        console.error('❌ addToCart error:', err);
      }
    });
  }

  buyNow(): void {
    const product = this.product();
    if (!product || product.stockStatus === StockStatus.OUT_OF_STOCK) return;

    this.isAddingToCart.set(true);
    this.cartService.addItem({
      productId: product.id,
      quantity: this.quantity()
    }).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        this.router.navigate(['/cart'], { queryParams: { step: 'PLACE_ORDER' } });
      },
      error: (err) => {
        this.isAddingToCart.set(false);
        this.error.set(err.error?.message || 'Failed to add to cart.');
        console.error('❌ buyNow error:', err);
      }
    });
  }

  toggleFavorite(): void {
    const product = this.product();
    if (!product) return;
    
    this.isTogglingFavorite.set(true);
    
    // TODO: Call API to toggle favorite
    // For now, just toggle locally
    setTimeout(() => {
      this.isFavorite.update(v => !v);
      this.isTogglingFavorite.set(false);
    }, 300);
  }

  setActiveTab(tab: 'description' | 'reviews' | 'negotiation'): void {
    this.activeTab.set(tab);
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  hasDiscount(): boolean {
    const p = this.product();
    if (!p) return false;
    return !!p.originalPrice && p.originalPrice > p.price;
  }

  discountPercentage(): number {
    const p = this.product();
    if (!p || !p.originalPrice || p.originalPrice <= 0) return 0;
    return ((p.originalPrice - p.price) / p.originalPrice) * 100;
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.negotiationService.disconnect();
  }

  contactSeller(): void {
    this.openNegotiationModal();
  }

  // Negotiation methods
  openNegotiationModal(): void {
    const product = this.product();
    if (!product) return;
    if (this.isOwnProduct()) {
      this.error.set('You cannot negotiate on your own product.');
      return;
    }
    this.negotiationError.set(null);
    this.initNegotiationForm();
    this.showNegotiationModal.set(true);
  }

  closeNegotiationModal(): void {
    this.showNegotiationModal.set(false);
    this.negotiationForm.reset();
    this.negotiationError.set(null);
  }

  submitOffer(): void {
    if (this.negotiationForm.invalid) {
      this.negotiationForm.markAllAsTouched();
      return;
    }

    const product = this.product();
    if (!product) return;

    this.isSubmittingOffer.set(true);
    this.negotiationError.set(null);
    this.isUploadingExchangeImage.set(false);

    const { proposedPrice, message, quantity, isExchange, exchangeImage } = this.negotiationForm.value;
    const existing = this.activeNegotiation();

    if (existing && existing.status === NegotiationStatus.IN_PROGRESS) {
      // Add a counter-proposal to existing negotiation
      this.negotiationService.submitCounterProposal({
        negotiationId: existing.id,
        amount: isExchange ? 0 : proposedPrice,
        quantity,
        isExchange,
        exchangeImage,
        message: message || undefined
      }).subscribe({
        next: (updated) => {
          this.activeNegotiation.set(updated);
          this.isSubmittingOffer.set(false);
          this.closeNegotiationModal();
        },
        error: (err) => {
          this.negotiationError.set(err.error?.message || 'Failed to submit offer. Please try again.');
          this.isSubmittingOffer.set(false);
        }
      });
    } else {
      // Create a new negotiation
      this.negotiationService.create({
        productId: product.id,
        proposedPrice: isExchange ? 0 : proposedPrice,
        amount: isExchange ? 0 : proposedPrice,
        quantity,
        isExchange,
        exchangeImage,
        message: message || undefined
      }).subscribe({
        next: (created) => {
          this.activeNegotiation.set(created);
          this.hasActiveNegotiation.set(true);
          // Subscribe to real-time updates
          this.wsSub?.unsubscribe();
          this.wsSub = this.negotiationService.connectToNegotiation(created.id).subscribe(updated => {
            this.activeNegotiation.set(updated);
          });
          this.isSubmittingOffer.set(false);
          this.closeNegotiationModal();
        },
        error: (err) => {
          this.negotiationError.set(err.error?.message || 'Failed to create negotiation. Please try again.');
          this.isSubmittingOffer.set(false);
        }
      });
    }
  }

  acceptOffer(proposalId: string): void {
    const neg = this.activeNegotiation();
    if (!neg) return;
    this.negotiationService.accept(neg.id).subscribe({
      next: (updated) => {
        this.activeNegotiation.set(updated);
        // Use the product ID from the loaded product (most reliable source)
        const productId = this.product()?.id
          || updated.productId
          || updated.serviceId;
        const negotiatedPrice = updated.proposals.length > 0
          ? updated.proposals[updated.proposals.length - 1].amount
          : undefined;
        if (productId) {
          this.cartService.addItem({ productId, quantity: 1, negotiatedPrice }).subscribe({
            next: () => this.router.navigate(['/cart']),
            error: (err) => {
              console.error('Failed to add negotiated item to cart:', err);
              this.router.navigate(['/cart']);
            }
          });
        }
      },
      error: () => {}
    });
  }

  rejectOffer(proposalId: string): void {
    const neg = this.activeNegotiation();
    if (!neg) return;
    this.negotiationService.reject(neg.id).subscribe({
      next: (updated) => this.activeNegotiation.set(updated),
      error: () => {}
    });
  }

  useAiSuggestedPrice(): void {
    const price = this.product()?.price ?? 0;
    const suggested = Math.floor(price * 0.85);
    this.negotiationForm.patchValue({ proposedPrice: suggested });
  }

  get suggestedPrice(): number {
    return Math.floor((this.product()?.price ?? 0) * 0.85);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.negotiationForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  getFieldError(field: string): string {
    const c = this.negotiationForm.get(field);
    if (!c?.errors) return '';
    if (c.errors['required']) return 'This field is required';
    if (c.errors['min']) return 'Price must be at least 1 TND';
    if (c.errors['max']) return `Your offer must be lower than the listed price (${this.product()?.price} TND)`;
    if (c.errors['maxlength']) return `Maximum ${c.errors['maxlength'].requiredLength} characters`;
    return 'Invalid value';
  }

  isUploadingExchangeImage = signal(false);
  exchangeImagePreview = signal<string | null>(null);

  onExchangeFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.negotiationError.set('Image size must be less than 2MB');
      return;
    }

    this.isUploadingExchangeImage.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.negotiationForm.patchValue({ exchangeImage: base64 });
      this.exchangeImagePreview.set(base64);
      this.isUploadingExchangeImage.set(false);
    };
    reader.onerror = () => {
      this.negotiationError.set('Failed to read image');
      this.isUploadingExchangeImage.set(false);
    };
    reader.readAsDataURL(file);
  }

  removeExchangeImage(): void {
    this.negotiationForm.patchValue({ exchangeImage: null });
    this.exchangeImagePreview.set(null);
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

  getConditionText(condition: ProductCondition | undefined): string {
    if (!condition) return 'Unknown';
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

  // ========================================
  // TRUST & REPUTATION HELPER METHODS
  // ========================================

  /**
   * Get color class for trust score
   */
  getTrustScoreColorClass(score: number): string {
    if (score < 30) return 'text-gray-600';
    if (score < 60) return 'text-blue-600';
    if (score < 80) return 'text-green-600';
    return 'text-yellow-600';
  }

  /**
   * Get badge styling class
   */
  getTrustBadgeClass(badge: string): string {
    switch (badge) {
      case 'NEW_SELLER':
        return 'bg-gray-100 text-gray-700';
      case 'GROWING_SELLER':
        return 'bg-blue-100 text-blue-700';
      case 'TRUSTED_SELLER':
        return 'bg-green-100 text-green-700';
      case 'TOP_SELLER':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  /**
   * Format trust badge for display
   */
  formatTrustBadge(badge: string): string {
    if (!badge) return '';
    return badge.replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get icon for trust badge
   */
  getTrustBadgeIcon(badge: string): string {
    switch (badge) {
      case 'NEW_SELLER':
        return '🌱';
      case 'GROWING_SELLER':
        return '📈';
      case 'TRUSTED_SELLER':
        return '✅';
      case 'TOP_SELLER':
        return '⭐';
      default:
        return '🏷️';
    }
  }
}
