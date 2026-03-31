import { Component, input, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../models/product';
import { ToastService } from '../../../../core/services/toast.service';
import { FavorisService } from '../../../../core/services/favoris.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard implements OnInit {
  product = input.required<Product>();
  private toast = inject(ToastService);
  private favorisService = inject(FavorisService);
  private authService = inject(AuthService);

  // Favorite state
  isFavorite = signal(false);
  isTogglingFavorite = signal(false);
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  // Generate star array based on rating
  readonly stars = computed(() => {
    const rating = this.product().rating;
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(rating)) return 'full';
      if (i < rating) return 'half';
      return 'empty';
    });
  });

  // Check if product is new (created within last 7 days)
  readonly isNewArrival = computed(() => {
    const product = this.product();
    if (!product.createdAt) return true; // Show as new if no date
    const createdDate = new Date(product.createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  });

  ngOnInit(): void {
    // Check if product is already favorited
    if (this.isAuthenticated() && this.product().id) {
      console.log('🔍 Checking favorite status for product:', this.product().id);
      this.favorisService.isProductFavorited(this.product().id).subscribe({
        next: (isFav) => {
          console.log('✅ Product favorite status:', isFav);
          this.isFavorite.set(isFav);
        },
        error: (err) => {
          console.error('❌ Error checking favorite status:', err);
        }
      });
    }
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isTogglingFavorite()) return;
    
    if (!this.isAuthenticated()) {
      this.toast.error('Please login to add favorites');
      return;
    }
    
    this.isTogglingFavorite.set(true);
    
    console.log('🔄 Toggling favorite for product:', this.product().id, 'Current state:', this.isFavorite());
    
    this.favorisService.toggleProductFavorite(this.product().id).subscribe({
      next: (response) => {
        console.log('✅ Toggle response:', response);
        // If response is null, it means favorite was removed
        const isNowFavorited = response !== null;
        console.log('📍 New favorite state:', isNowFavorited);
        this.isFavorite.set(isNowFavorited);
        this.isTogglingFavorite.set(false);
        
        if (isNowFavorited) {
          this.toast.success('Added to favorites! ❤️');
        } else {
          this.toast.info('Removed from favorites');
        }
      },
      error: (err) => {
        console.error('❌ Error toggling favorite:', err);
        this.isTogglingFavorite.set(false);
        this.toast.error('Failed to update favorite');
      }
    });
  }
}
