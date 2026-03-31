import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { ProductService } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { NegotiationService } from '../../core/negotiation.service';
import { Negotiation, NegotiationStatus, ProposalStatus, NegotiationProposal } from '../../models/negotiation.model';

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
  private negotiationService = inject(NegotiationService);
  private fb = inject(FormBuilder);
  protected readonly ProposalStatus = ProposalStatus;

  // State
  product = signal<Product>({
    id: '1',
    name: 'Modern Laptop Stand',
    description: 'Elevate your workspace with this ergonomic aluminum laptop stand. Designed to improve posture and cooling, this stand is perfect for long study sessions. Features adjustable height and non-slip rubber pads.',
    price: 120,
    originalPrice: 150,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=870&auto=format&fit=crop',
    sellerId: 'seller1',
    sellerName: 'Amine K.',
    rating: 4.8,
    reviewsCount: 12,
    stock: 5,
    stockStatus: StockStatus.IN_STOCK,
    condition: ProductCondition.NEW,
    isNegotiable: true,
    isFavorite: false,
    viewCount: 234
  });

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

  // Negotiation state
  showNegotiationModal = signal(false);
  negotiationForm!: FormGroup;
  isSubmittingOffer = signal(false);
  submitError = signal<string | null>(null);
  activeNegotiationId = signal<string | null>(null);
  currentProductId = signal<string | null>(null);
  hasActiveNegotiation = signal(false);
  negotiationStatus = signal<NegotiationStatus>(NegotiationStatus.PENDING);
  aiSuggestedPrice = signal<number>(105);
  negotiationHistory = signal<NegotiationProposal[]>([]);

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
      this.currentProductId.set(productId);
      this.loadProduct(productId);
      this.loadNegotiation(productId);
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
    if (this.isObjectId(id)) {
      this.productService.getById(id).subscribe({
        next: (loaded) => {
          this.product.set(loaded);
          if (loaded.images && loaded.images.length > 0) {
            this.images.set(loaded.images);
            this.selectedImage.set(loaded.images[0]);
          } else {
            this.images.set([loaded.imageUrl]);
            this.selectedImage.set(loaded.imageUrl);
          }
        },
        error: (err) => console.warn('Failed to load product details:', err)
      });
      return;
    }

    // Demo route fallback: load first real product so negotiation can be tested.
    this.productService.getAll().subscribe({
      next: (products) => {
        this.productService.products.set(products);
        const firstReal = products.find((p) => this.isObjectId(p.id));
        if (firstReal) {
          this.currentProductId.set(firstReal.id);
          this.product.set(firstReal);
          if (firstReal.images && firstReal.images.length > 0) {
            this.images.set(firstReal.images);
            this.selectedImage.set(firstReal.images[0]);
          } else {
            this.images.set([firstReal.imageUrl]);
            this.selectedImage.set(firstReal.imageUrl);
          }
          this.loadNegotiation(firstReal.id);
        }
      },
      error: (err) => console.warn('Failed to load products:', err)
    });
  }

  private loadNegotiation(productId: string): void {
    this.negotiationService.getByProduct(productId).subscribe({
      next: (negotiations) => {
        if (negotiations && negotiations.length > 0) {
          const neg = negotiations[0];
          this.activeNegotiationId.set(neg.id);
          this.hasActiveNegotiation.set(true);
          this.negotiationStatus.set(neg.status as NegotiationStatus);
          this.mapNegotiationToHistory(neg);
        }
      },
      error: (err) => console.error('Failed to load negotiation:', err)
    });
  }

  private mapNegotiationToHistory(neg: Negotiation): void {
    if (!neg.proposals) return;
    
    const history: NegotiationProposal[] = neg.proposals.map((p: any) => ({
      senderId: p.senderId ?? 'buyer',
      senderFullName: p.senderFullName,
      amount: p.amount ?? p.proposedPrice,
      message: p.message,
      status: (p.status ?? (p.accepted ? ProposalStatus.ACCEPTED : ProposalStatus.PENDING)) as ProposalStatus,
      type: p.type,
      createdAt: p.createdAt // Keep as string to match NegotiationProposal interface
    }));
    
    this.negotiationHistory.set(history);
  }

  selectImage(img: string): void {
    this.selectedImage.set(img);
  }

  increaseQuantity(): void {
    const max = this.product().stock || 10;
    this.quantity.update(q => Math.min(max, q + 1));
  }

  decreaseQuantity(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart(): void {
    if (this.product().stockStatus === StockStatus.OUT_OF_STOCK) return;
    
    this.isAddingToCart.set(true);
    setTimeout(() => {
      console.log('Adding to cart:', this.product(), 'Quantity:', this.quantity());
      this.isAddingToCart.set(false);
      this.addedToCart.set(true);
      setTimeout(() => this.addedToCart.set(false), 2000);
    }, 500);
  }

  buyNow(): void {
    if (this.product().stockStatus === StockStatus.OUT_OF_STOCK) return;
    this.addToCart();
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 600);
  }

  toggleFavorite(): void {
    this.product.update(p => ({ ...p, isFavorite: !p.isFavorite }));
  }

  setActiveTab(tab: 'description' | 'reviews' | 'negotiation'): void {
    this.activeTab.set(tab);
  }

  getStarArray(rating: number | undefined): boolean[] {
    const r = rating ?? 0;
    return Array(5).fill(false).map((_, i) => i < Math.floor(r));
  }

  hasDiscount(): boolean {
    const p = this.product();
    return !!p.originalPrice && p.originalPrice > p.price;
  }

  discountPercentage(): number {
    const p = this.product();
    if (!p.originalPrice || p.originalPrice <= 0) return 0;
    return ((p.originalPrice - p.price) / p.originalPrice) * 100;
  }

  contactSeller(): void {
    this.router.navigate(['/chat'], { queryParams: { sellerId: this.product().sellerId } });
  }

  // Negotiation methods
  openNegotiationModal(): void {
    this.showNegotiationModal.set(true);
    this.negotiationForm.patchValue({
      proposedPrice: Math.floor(this.product().price * 0.9)
    });
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
    this.submitError.set(null);
    const { proposedPrice, message } = this.negotiationForm.value;
    const requestedId = this.currentProductId() ?? this.product().id;
    const productId = this.isObjectId(requestedId) ? requestedId : this.getFallbackNegotiationItemId();
    if (!productId) {
      this.submitError.set('No valid product was found. Please create products first, then retry.');
      this.isSubmittingOffer.set(false);
      return;
    }
    this.currentProductId.set(productId);

    if (!this.hasActiveNegotiation()) {
      this.negotiationService.create({
        serviceId: productId,
        amount: proposedPrice,
        message: message
      }).subscribe({
        next: (neg) => {
          this.activeNegotiationId.set(neg.id);
          this.hasActiveNegotiation.set(true);
          this.mapNegotiationToHistory(neg);
          this.isSubmittingOffer.set(false);
          this.closeNegotiationModal();
        },
        error: (err) => {
          console.error('Failed to create negotiation:', err);
          this.submitError.set(this.getApiErrorMessage(err, 'Offer submission failed.'));
          this.isSubmittingOffer.set(false);
        }
      });
    } else {
      this.negotiationService.submitCounterProposal({
        negotiationId: this.activeNegotiationId()!,
        amount: proposedPrice,
        message: message
      }).subscribe({
        next: (neg) => {
          this.mapNegotiationToHistory(neg);
          this.isSubmittingOffer.set(false);
          this.closeNegotiationModal();
        },
        error: (err) => {
          console.error('Failed to submit proposal:', err);
          this.submitError.set(this.getApiErrorMessage(err, 'Counter offer submission failed.'));
          this.isSubmittingOffer.set(false);
        }
      });
    }
  }

  acceptOffer(): void {
    const negId = this.activeNegotiationId();
    if (!negId) return;

    this.negotiationService.accept(negId).subscribe({
      next: (neg) => {
        this.negotiationStatus.set(NegotiationStatus.ACCEPTED);
        this.mapNegotiationToHistory(neg);
      },
      error: (err) => console.error('Failed to accept offer:', err)
    });
  }

  rejectOffer(): void {
    const negId = this.activeNegotiationId();
    if (!negId) return;

    this.negotiationService.reject(negId).subscribe({
      next: (neg) => {
        this.negotiationStatus.set(NegotiationStatus.REJECTED);
        this.mapNegotiationToHistory(neg);
      },
      error: (err) => console.error('Failed to reject offer:', err)
    });
  }

  useAiSuggestedPrice(): void {
    this.negotiationForm.patchValue({
      proposedPrice: this.aiSuggestedPrice()
    });
  }

  // Stock status helpers
  getStockStatusClass(status: StockStatus | undefined): string {
    if (!status) return 'text-green-600 bg-green-50 border-green-200';
    switch (status) {
      case StockStatus.IN_STOCK: return 'text-green-600 bg-green-50 border-green-200';
      case StockStatus.LOW_STOCK: return 'text-orange-600 bg-orange-50 border-orange-200';
      case StockStatus.OUT_OF_STOCK: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  getStockStatusText(status: StockStatus | undefined): string {
    if (!status) return 'In Stock';
    switch (status) {
      case StockStatus.IN_STOCK: return 'In Stock';
      case StockStatus.LOW_STOCK: return 'Low Stock';
      case StockStatus.OUT_OF_STOCK: return 'Out of Stock';
      default: return 'Unknown';
    }
  }

  getConditionText(condition: ProductCondition | undefined): string {
    if (!condition) return 'New';
    return condition.replace('_', ' ');
  }

  getNegotiationStatusClass(status: NegotiationStatus): string {
    switch (status) {
      case NegotiationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case NegotiationStatus.ACCEPTED: return 'bg-green-100 text-green-800';
      case NegotiationStatus.REJECTED: return 'bg-red-100 text-red-800';
      case NegotiationStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  getProposalStatusClass(status: ProposalStatus): string {
    switch (status) {
      case ProposalStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case ProposalStatus.ACCEPTED: return 'bg-green-100 text-green-700';
      case ProposalStatus.REJECTED: return 'bg-red-100 text-red-700';
      case ProposalStatus.COUNTERED: return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  private isObjectId(value: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(value);
  }

  private getFallbackNegotiationItemId(): string | null {
    // Use the first loaded product id when this screen is opened from mock/demo routes.
    const loadedProducts = this.productService.products();
    const candidate = loadedProducts.find((p) => this.isObjectId(p.id));
    return candidate?.id ?? null;
  }

  private getApiErrorMessage(err: any, fallback: string): string {
    return (
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      `${fallback} (HTTP ${err?.status ?? 'unknown'})`
    );
  }
}
