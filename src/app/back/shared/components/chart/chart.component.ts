import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-64 flex items-center justify-center bg-gray-50 rounded-xl">
      <p class="text-gray-400">📊 Chart visualization coming soon</p>
    </div>
  `
})
export class ChartComponent {
  @Input() chartData: any = { datasets: [] };
  @Input() chartOptions: any = { responsive: true, maintainAspectRatio: false };
  @Input() chartType: string = 'line';
}
