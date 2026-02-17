import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="w-full h-64">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        [type]="chartType">
      </canvas>
    </div>
  `
})
export class ChartComponent {
  @Input() chartData: ChartConfiguration['data'] = { datasets: [] };
  @Input() chartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };
  @Input() chartType: ChartType = 'line';
}
