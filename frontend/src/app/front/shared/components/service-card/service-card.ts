import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../../core/services/service.service';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <!-- Service Icon -->
      <div class="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-4">
          🔧
        </div>
        <h3 class="text-lg font-black text-dark mb-2 group-hover:text-primary transition-colors">
          {{ service.name }}
        </h3>
        <p class="text-sm text-secondary line-clamp-2">
          {{ service.description }}
        </p>
      </div>

      <!-- Service Details -->
      <div class="p-6 pt-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-gray-100 text-xs font-bold text-secondary rounded-lg uppercase tracking-wider">
              Service
            </span>
            <span class="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                  [class.bg-green-100]="service.status === 'APPROVED'"
                  [class.text-green-700]="service.status === 'APPROVED'"
                  [class.bg-yellow-100]="service.status === 'PENDING'"
                  [class.text-yellow-700]="service.status === 'PENDING'"
                  [class.bg-red-100]="service.status === 'REJECTED'"
                  [class.text-red-700]="service.status === 'REJECTED'">
              {{ service.status }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-2xl font-black text-primary">
            {{ service.price }} <span class="text-sm text-secondary">TND</span>
          </div>
          <button class="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shadow-soft { 
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); 
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ServiceCard {
  @Input({ required: true }) service!: Service;
}