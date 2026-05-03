import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Service } from '../../../../core/services/service.service';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
      <!-- Service Icon / Header -->
      <div class="p-6 bg-gradient-to-br from-primary/5 to-accent/5 relative">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-4">
          🔧
        </div>
        <h3 class="text-lg font-black text-dark mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {{ service.name }}
        </h3>
        <p class="text-sm text-secondary line-clamp-2 mb-3">
          {{ service.description }}
        </p>

        <!-- Provider info -->
        <div class="flex items-center gap-2 mt-2">
          @if (service.providerAvatar) {
            <img [src]="service.providerAvatar" alt="provider"
                 class="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"
                 (error)="onAvatarError($event)">
          } @else {
            <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border-2 border-white shadow-sm">
              {{ (service.providerName || 'P').charAt(0).toUpperCase() }}
            </div>
          }
          <div class="flex flex-col leading-tight">
            <span class="text-xs font-bold text-dark truncate max-w-[140px]">
              {{ service.providerName || 'Provider' }}
            </span>
            @if (service.shopName) {
              <span class="text-[10px] text-secondary truncate max-w-[140px]">{{ service.shopName }}</span>
            }
          </div>
        </div>
      </div>

      <!-- Service Details -->
      <div class="p-5 pt-4 flex flex-col flex-1">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 flex-wrap">
            @if (service.durationMinutes) {
              <span class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg flex items-center gap-1">
                ⏱ {{ service.durationMinutes }} min
              </span>
            }
            <span class="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  [class.bg-green-100]="service.status === 'APPROVED' || service.status === 'AVAILABLE'"
                  [class.text-green-700]="service.status === 'APPROVED' || service.status === 'AVAILABLE'"
                  [class.bg-yellow-100]="service.status === 'PENDING' || service.status === 'PARTIALLY_BOOKED'"
                  [class.text-yellow-700]="service.status === 'PENDING' || service.status === 'PARTIALLY_BOOKED'"
                  [class.bg-red-100]="service.status === 'REJECTED' || service.status === 'FULLY_BOOKED'"
                  [class.text-red-700]="service.status === 'REJECTED' || service.status === 'FULLY_BOOKED'"
                  [class.bg-gray-100]="service.status === 'UNAVAILABLE'"
                  [class.text-gray-600]="service.status === 'UNAVAILABLE'">
              {{ statusLabel(service.status) }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between mt-auto">
          <div class="text-2xl font-black text-primary">
            {{ service.price }} <span class="text-sm text-secondary font-medium">TND</span>
          </div>
          <a [routerLink]="['/service', service.id]"
             class="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all text-sm shadow-sm hover:shadow-md">
            View Details
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }
    .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
    .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  `]
})
export class ServiceCard {
  @Input({ required: true }) service!: Service;

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'Approved', AVAILABLE: 'Available', PENDING: 'Pending',
      PARTIALLY_BOOKED: 'Partially Booked', FULLY_BOOKED: 'Fully Booked',
      REJECTED: 'Rejected', UNAVAILABLE: 'Unavailable'
    };
    return map[status] ?? status;
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}