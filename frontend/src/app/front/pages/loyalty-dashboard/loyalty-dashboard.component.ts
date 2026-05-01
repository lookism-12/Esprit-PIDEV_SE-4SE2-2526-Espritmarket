import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoyaltyService } from '../../core/loyalty.service';

@Component({
  selector: 'app-loyalty-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loyalty-dashboard.component.html',
  styleUrls: ['./loyalty-dashboard.component.scss']
})
export class LoyaltyDashboardComponent implements OnInit {
  dashboard: any = null;
  loading = false;
  error: string | null = null;
  
  // For reward conversion modal
  showConversionModal = false;
  selectedReward: any = null;
  converting = false;

  constructor(
    private loyaltyService: LoyaltyService,
    public router: Router
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = null;
    
    this.loyaltyService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
        console.log('📊 Dashboard loaded:', data);
      },
      error: (err) => {
        console.error('❌ Failed to load dashboard:', err);
        this.error = 'Failed to load loyalty dashboard. Please try again.';
        this.loading = false;
      }
    });
  }

  // Open conversion modal
  openConversionModal(reward: any) {
    this.selectedReward = reward;
    this.showConversionModal = true;
  }

  // Close conversion modal
  closeConversionModal() {
    this.showConversionModal = false;
    this.selectedReward = null;
  }

  // Convert points to reward
  convertToReward() {
    if (!this.selectedReward) return;
    
    this.converting = true;
    
    this.loyaltyService.convertPointsToReward(this.selectedReward.id).subscribe({
      next: (reward) => {
        console.log('✅ Reward converted:', reward);
        alert(`Success! Your coupon code is: ${reward.couponCode}\n\nValid for ${reward.daysUntilExpiry} days in your top shops.`);
        this.closeConversionModal();
        this.loadDashboard(); // Refresh dashboard
      },
      error: (err) => {
        console.error('❌ Conversion failed:', err);
        alert(err.error?.message || 'Failed to convert points. Please try again.');
        this.converting = false;
      }
    });
  }

  // Copy coupon code to clipboard
  copyCouponCode(couponCode: string) {
    navigator.clipboard.writeText(couponCode).then(() => {
      alert('Coupon code copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  // Navigate to shop
  goToShop(shopId: string) {
    this.router.navigate(['/shop', shopId]);
  }

  // Get boost tier badge color
  getBoostBadgeClass(): string {
    if (!this.dashboard) return 'boost-none';
    
    switch (this.dashboard.boostTier) {
      case 'HIGH': return 'boost-high';
      case 'MEDIUM': return 'boost-medium';
      default: return 'boost-none';
    }
  }

  // Get level badge color
  getLevelBadgeClass(): string {
    if (!this.dashboard) return 'level-bronze';
    
    switch (this.dashboard.loyaltyLevel) {
      case 'PLATINUM': return 'level-platinum';
      case 'GOLD': return 'level-gold';
      case 'SILVER': return 'level-silver';
      default: return 'level-bronze';
    }
  }

  // Get reward type display
  getRewardTypeDisplay(reward: any): string {
    if (reward.rewardType === 'PERCENTAGE_DISCOUNT') {
      return `${reward.rewardValue}% OFF`;
    } else {
      return `${reward.rewardValue} TND OFF`;
    }
  }

  // Check if user can afford reward
  canAffordReward(reward: any): boolean {
    return this.dashboard && this.dashboard.totalPoints >= reward.pointsRequired;
  }

  // Get days until expiry color
  getExpiryColorClass(daysUntilExpiry: number): string {
    if (daysUntilExpiry <= 3) return 'expiry-urgent';
    if (daysUntilExpiry <= 7) return 'expiry-warning';
    return 'expiry-normal';
  }
}
