import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass" class="flex flex-col items-center justify-center">
      <div [class]="spinnerClass" class="border-4 border-t-primary rounded-full animate-spin"></div>
      @if (message) {
        <p class="mt-6 text-secondary font-black uppercase tracking-widest text-sm">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class LoadingSpinner {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message: string = '';
  @Input() fullScreen: boolean = false;

  get containerClass(): string {
    return this.fullScreen ? 'min-h-screen' : 'py-32';
  }

  get spinnerClass(): string {
    switch (this.size) {
      case 'sm':
        return 'w-8 h-8 border-primary/20';
      case 'lg':
        return 'w-20 h-20 border-primary/20';
      case 'md':
      default:
        return 'w-16 h-16 border-primary/20';
    }
  }
}
