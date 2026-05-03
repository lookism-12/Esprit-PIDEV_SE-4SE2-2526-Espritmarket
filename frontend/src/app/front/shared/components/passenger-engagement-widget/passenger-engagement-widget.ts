import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarpoolingService, PassengerEngagementDTO } from '../../../core/carpooling.service';

@Component({
  selector: 'app-passenger-engagement-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './passenger-engagement-widget.html',
  styleUrl: './passenger-engagement-widget.scss',
})
export class PassengerEngagementWidget implements OnInit {
  private readonly carpoolingService = inject(CarpoolingService);

  engagement = signal<PassengerEngagementDTO | null>(null);
  isLoading = signal(true);
  hasNoProfile = signal(false);
  isExpanded = signal(false);

  readonly tierConfig: Record<string, { label: string; emoji: string; color: string; glow: string; bg: string }> = {
    NONE:     { label: 'Explorer',  emoji: '🌱', color: '#9CA3AF', glow: 'rgba(156,163,175,0.4)', bg: 'rgba(156,163,175,0.08)' },
    BRONZE:   { label: 'Bronze',    emoji: '🥉', color: '#CD7F32', glow: 'rgba(205,127,50,0.4)',  bg: 'rgba(205,127,50,0.08)'  },
    SILVER:   { label: 'Silver',    emoji: '🥈', color: '#C0C0C0', glow: 'rgba(192,192,192,0.4)', bg: 'rgba(192,192,192,0.08)' },
    GOLD:     { label: 'Gold',      emoji: '🥇', color: '#E0B84A', glow: 'rgba(224,184,74,0.5)',  bg: 'rgba(224,184,74,0.08)'  },
    PLATINUM: { label: 'Platinum',  emoji: '💎', color: '#A78BFA', glow: 'rgba(167,139,250,0.5)', bg: 'rgba(167,139,250,0.08)' },
  };

  readonly tierOrder = ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

  currentTierConfig = computed(() => {
    const tier = this.engagement()?.engagementTier ?? 'NONE';
    return this.tierConfig[tier] ?? this.tierConfig['NONE'];
  });

  ngOnInit(): void {
    this.carpoolingService.getPassengerEngagement().subscribe({
      next: (data) => {
        this.engagement.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        // 404 = no passenger profile yet → show "start earning" state
        if (err?.status === 404 || err?.status === 400) {
          this.hasNoProfile.set(true);
        } else {
          // Any other error: show the zero-state engagement so the widget is still useful
          this.hasNoProfile.set(true);
        }
      }
    });
  }

  getTierIndex(tier: string): number {
    return this.tierOrder.indexOf(tier);
  }

  isTierUnlocked(tier: string): boolean {
    const current = this.engagement()?.engagementTier ?? 'NONE';
    return this.getTierIndex(tier) <= this.getTierIndex(current);
  }

  isTierCurrent(tier: string): boolean {
    return this.engagement()?.engagementTier === tier;
  }

  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }
}
