import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4"
         [ngClass]="getBorderColor()">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-gray-600 text-sm font-medium">{{ data.label }}</p>
          <h3 class="text-3xl font-bold mt-2 text-gray-800">{{ data.value }}</h3>
          <p class="text-sm text-gray-500 mt-2">{{ data.subtitle }}</p>
        </div>
        <div [ngClass]="getIconBgClass()" 
             class="w-12 h-12 rounded-full flex items-center justify-center text-2xl">
          {{ data.icon }}
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between" *ngIf="data.change">
        <span [ngClass]="data.trend === 'up' ? 'text-green-600' : 'text-red-600'" 
              class="text-sm font-medium flex items-center">
          <span class="mr-1">{{ data.trend === 'up' ? '↑' : '↓' }}</span>
          {{ data.change }}
        </span>
        <span *ngIf="data.progress" class="text-xs text-gray-400">
           {{ data.progress }}% Goal
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MetricCardComponent {
  @Input() data: any;

  getBorderColor(): string {
    const colors: Record<string, string> = {
      blue: 'border-blue-500',
      green: 'border-green-500',
      purple: 'border-purple-500',
      orange: 'border-orange-500',
      red: 'border-red-500'
    };
    return colors[this.data.color] || 'border-gray-300';
  }

  getIconBgClass(): string {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      orange: 'bg-orange-100',
      red: 'bg-red-100'
    };
    return colors[this.data.color] || 'bg-gray-100';
  }
}
