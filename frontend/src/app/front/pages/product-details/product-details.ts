import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product, StockStatus, ProductCondition, ProductStatus } from '../../models/product';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../core/cart.service';
import { NegotiationStatus, ProposalStatus } from '../../models/negotiation.model';
import { ImageUrlHelper } from '../../../shared/utils/image-url.helper';

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
  private fb = inject(FormBuilder);

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

  // Negotiation state
  showNegotiationModal = signal(false);
  negotiationForm!: FormGroup;
  isSubmittingOffer = signal(false);
  hasActiveNegotiation = signal(false);
  negotiationStatus = signal<NegotiationStatus>(NegotiationStatus.PENDING);
  aiSuggestedPrice = signal<number>(105);
  
  negotiationHistory = signal<NegotiationProposal[]>([]);

  // Mock reviews (TODO: Load from API)
  reviews = signal<any[]>([]);

  // Related products from MongoDB
  relatedProducts = signal<Product[]>([]);

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
          sellerName: 'Marketplace Seller',
          rating: 4.5,
          reviewsCount: 12,
          stock: data.stock || 0,
          stockStatus: data.stock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
          condition: (data.condition as ProductCondition) || ProductCondition.NEW,
          isNegotiable: (data as any).isNegotiable || false,
          status: data.status || ProductStatus.APPROVED
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
        
        this.isLoadingProduct.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load product:', err);
        this.productNotFound.set(true);
        this.isLoadingProduct.set(false);
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
    setTimeout(() => {
      console.log('Adding to cart:', this.product(), 'Quantity:', this.quantity());
      this.isAddingToCart.set(false);
      this.addedToCart.set(true);
      setTimeout(() => this.addedToCart.set(false), 2000);
    }, 500);
  }

  buyNow(): void {
    const product = this.product();
    if (!product || product.stockStatus === StockStatus.OUT_OF_STOCK) return;
    this.addToCart();
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 600);
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

  contactSeller(): void {
    const product = this.product();
    if (!product) return;
    this.router.navigate(['/chat'], { queryParams: { sellerId: product.sellerId } });
  }

  // Negotiation methods
  openNegotiationModal(): void {
    const product = this.product();
    if (!product) return;
    this.showNegotiationModal.set(true);
    this.negotiationForm.patchValue({
      proposedPrice: Math.floor(product.price * 0.9)
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
}
