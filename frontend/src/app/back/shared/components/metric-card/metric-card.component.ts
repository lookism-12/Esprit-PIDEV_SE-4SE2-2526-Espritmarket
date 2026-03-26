import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-[#F8F9FA] rounded-[10px] border border-[#7D0408] flex items-center h-24 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <!-- Colored Left Strip -->
      <div class="w-1.5 h-full opacity-80" [ngClass]="getBgColorClass()"></div>
      
      <!-- Icon Container -->
      <div class="w-16 flex items-center justify-center shrink-0">
        <span class="text-3xl" [ngClass]="getTextColorClass()">{{ data.icon }}</span>
      </div>
      
      <!-- Vertical Divider -->
      <div class="h-10 w-px bg-gray-300"></div>
      
      <!-- Text Container -->
      <div class="flex-1 flex flex-col justify-center items-center">
        <p class="text-[12px] text-gray-500 font-medium mb-1">{{ data.label }}</p>
        <h3 class="text-[24px] font-bold text-gray-900 leading-none">{{ data.value }}</h3>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class MetricCardComponent {
  @Input() data: any;

  getBgColorClass(): string {
    const colors: Record<string, string> = {
      blue: 'bg-cyan-600',
      green: 'bg-teal-500',
      purple: 'bg-indigo-500',
      orange: 'bg-amber-500',
      red: 'bg-red-500'
    };
    return colors[this.data.color] || 'bg-gray-400';
  }

  getTextColorClass(): string {
    const colors: Record<string, string> = {
      blue: 'text-cyan-600',
      green: 'text-teal-500',
      purple: 'text-indigo-500',
      orange: 'text-amber-500',
      red: 'text-red-500'
    };
    return colors[this.data.color] || 'text-gray-400';
  }
}
