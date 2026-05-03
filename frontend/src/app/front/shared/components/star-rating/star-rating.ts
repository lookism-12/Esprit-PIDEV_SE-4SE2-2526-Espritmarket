import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1">
      @for (star of stars; track star) {
        <button
          type="button"
          (click)="!readonly && onStarClick(star)"
          (mouseenter)="!readonly && (hovered = star)"
          (mouseleave)="!readonly && (hovered = 0)"
          [class]="starClass(star)"
          [disabled]="readonly">
          ★
        </button>
      }
      @if (showLabel && value > 0) {
        <span class="ml-2 text-sm font-bold" [class]="labelClass()">
          {{ label() }}
        </span>
      }
    </div>
  `,
  styles: [`
    button { background: none; border: none; padding: 0; cursor: pointer; line-height: 1; }
    button:disabled { cursor: default; }
  `]
})
export class StarRating {
  @Input() value = 0;
  @Input() readonly = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showLabel = false;
  @Output() valueChange = new EventEmitter<number>();

  stars = [1, 2, 3, 4, 5];
  hovered = 0;

  onStarClick(star: number): void {
    this.value = star;
    this.valueChange.emit(star);
  }

  starClass(star: number): string {
    const active = this.hovered > 0 ? star <= this.hovered : star <= this.value;
    const sizeMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
    return `${sizeMap[this.size]} transition-all ${active ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-amber-200'}`;
  }

  label(): string {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[this.value] ?? '';
  }

  labelClass(): string {
    if (this.value >= 5) return 'text-amber-500';
    if (this.value >= 4) return 'text-green-500';
    if (this.value >= 3) return 'text-blue-500';
    return 'text-red-400';
  }
}
