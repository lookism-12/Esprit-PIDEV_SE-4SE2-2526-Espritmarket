import { Component, input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../../core/services/service.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FavorisService } from '../../../../core/services/favoris.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-card.html',
  styleUrl: './service-card.scss',
})
export class ServiceCard implements OnInit {
  service = input.required<Service>();
  private toast = inject(ToastService);
  private favorisService = inject(FavorisService);
  private authService = inject(AuthService);

  // Favorite state
  isFavorite = signal(false);
  isTogglingFavorite = signal(false);

  ngOnInit(): void {
    // Check if service is already favorited
    if (this.authService.isAuthenticated() && this.service().id) {
      console.log('🔍 Checking favorite status for service:', this.service().id);
      this.favorisService.isServiceFavorited(this.service().id).subscribe({
        next: (isFav) => {
          console.log('✅ Service favorite status:', isFav);
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
    
    if (!this.authService.isAuthenticated()) {
      this.toast.error('Please login to add favorites');
      return;
    }
    
    this.isTogglingFavorite.set(true);
    
    console.log('🔄 Toggling favorite for service:', this.service().id, 'Current state:', this.isFavorite());
    
    this.favorisService.toggleServiceFavorite(this.service().id).subscribe({
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
