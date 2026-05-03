import {
  Component,
  input,
  inject,
  signal,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  RecommendationService,
  RecommendedProduct,
} from '../../../../core/services/recommendation.service';
import { AuthService } from '../../../core/auth.service';
import { CartService } from '../../../core/cart.service';
import { ToastService } from '../../../core/toast.service';
import { ImageUrlHelper } from '../../../../shared/utils/image-url.helper';

@Component({
  selector: 'app-recommendation-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recommendation-widget.html',
  styleUrl: './recommendation-widget.scss',
})
export class RecommendationWidget implements OnInit, OnChanges {
  userId      = input<string | null>(null);
  limit       = input<number>(4);
  title       = input<string>('Recommended For You');
  showInfoCard = input<boolean>(true);

  private recommendationService = inject(RecommendationService);
  private authService  = inject(AuthService);
  private cartService  = inject(CartService);
  private toastService = inject(ToastService);
  private router       = inject(Router);

  readonly isLoading        = signal(false);
  readonly enrichedProducts = signal<EnrichedRecommendation[]>([]);
  readonly error            = signal<string | null>(null);
  readonly algorithmLabel   = signal('AI-powered');

  /** productId → loading state for add-to-cart button */
  readonly addingToCart = signal<Record<string, boolean>>({});

  readonly hasRecommendations = computed(() => this.enrichedProducts().length > 0);
  readonly isAuthenticated    = computed(() => this.authService.isAuthenticated());
  readonly isClient           = computed(() => this.authService.userRole() === 'CLIENT');

  ngOnInit(): void { this.load(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) this.load();
  }

  private load(): void {
    const uid = this.userId() ?? this.authService.currentUser()?.id ?? null;
    if (!uid) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.recommendationService.getRecommendations(uid).subscribe({
      next: (resp) => {
        const recs = resp.recommendations.slice(0, this.limit());
        this.algorithmLabel.set(this.formatAlgorithm(resp.algorithm_used));

        const enriched: EnrichedRecommendation[] = recs.map(rec => ({
          ...rec,
          imageUrl: rec.image_url ? ImageUrlHelper.toAbsoluteUrl(rec.image_url) : null,
          stock:        rec.in_stock ? 1 : 0,
          isNegotiable: rec.is_negotiable ?? false,
          sellerName:   'Marketplace Seller',
          found:        true,
        }));

        this.enrichedProducts.set(enriched.filter(e => e.name && e.name.trim() !== ''));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Could not load recommendations');
      },
    });
  }

  // ── Cart actions ──────────────────────────────────────────────────────────

  addToCart(rec: EnrichedRecommendation, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/product/${rec.product_id}` } });
      return;
    }
    if (!this.isClient()) {
      this.toastService.warning('Only clients can add products to cart');
      return;
    }
    if (rec.stock <= 0) {
      this.toastService.error('This product is out of stock');
      return;
    }

    this.addingToCart.update(s => ({ ...s, [rec.product_id]: true }));

    this.cartService.addItem({ productId: rec.product_id, quantity: 1 }).subscribe({
      next: () => {
        this.toastService.success(`${rec.name} added to cart!`, 3000);
        this.addingToCart.update(s => ({ ...s, [rec.product_id]: false }));
        this.trackView(rec.product_id);
      },
      error: () => {
        this.toastService.error('Failed to add to cart.');
        this.addingToCart.update(s => ({ ...s, [rec.product_id]: false }));
      },
    });
  }

  buyNow(rec: EnrichedRecommendation, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/product/${rec.product_id}` } });
      return;
    }
    if (rec.stock <= 0) {
      this.toastService.error('This product is out of stock');
      return;
    }

    this.cartService.addItem({ productId: rec.product_id, quantity: 1 }).subscribe({
      next: () => {
        this.router.navigate(['/cart'], { queryParams: { step: 'PLACE_ORDER' } });
      },
      error: () => this.toastService.error('Could not proceed to checkout.'),
    });
  }

  isAddingToCart(productId: string): boolean {
    return this.addingToCart()[productId] ?? false;
  }

  // ── Tracking ──────────────────────────────────────────────────────────────

  trackView(productId: string): void {
    const uid = this.userId() ?? this.authService.currentUser()?.id ?? null;
    if (uid) this.recommendationService.trackInteraction(uid, productId, 'view').subscribe();
  }

  reload(): void { this.load(); }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private formatAlgorithm(algo: string): string {
    if (!algo) return 'AI-powered';
    if (algo.includes('collaborative')) return 'Collaborative Filtering';
    if (algo.includes('popularity'))    return 'Popularity-based';
    if (algo.includes('mock'))          return 'Curated';
    return 'AI-powered';
  }

  getScorePercent(score: number): number { return Math.round(score * 100); }

  getReasonIcon(reason: string): string {
    if (!reason) return '✨';
    const r = reason.toLowerCase();
    if (r.includes('similar') || r.includes('taste'))    return '👥';
    if (r.includes('interest') || r.includes('category')) return '🎯';
    if (r.includes('popular') || r.includes('trending'))  return '🔥';
    if (r.includes('purchase') || r.includes('bought'))   return '🛒';
    return '✨';
  }
}

export interface EnrichedRecommendation extends RecommendedProduct {
  imageUrl:     string | null;
  stock:        number;
  isNegotiable: boolean;
  sellerName:   string;
  found:        boolean;
}
