import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-3 max-w-md">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          [ngClass]="getToastClasses(toast.type)"
          role="alert"
          [attr.aria-label]="toast.message">
          
          <!-- Icon -->
          @if (toast.icon) {
            <div class="flex-shrink-0 text-lg">
              {{ toast.icon }}
            </div>
          }

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm leading-relaxed">{{ toast.message }}</p>
            
            <!-- Action Button -->
            @if (toast.action) {
              <button 
                (click)="handleActionClick(toast)"
                [ngClass]="getActionClasses(toast.type)"
                class="mt-2">
                {{ toast.action.label }}
              </button>
            }
          </div>

          <!-- Close Button -->
          <button 
            (click)="removeToast(toast.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-black/5"
            aria-label="Close notification">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ToastContainer {
  readonly toastService = inject(ToastService);

  getToastClasses(type: Toast['type']): string {
    return this.toastService.getToastClasses(type);
  }

  getActionClasses(type: Toast['type']): string {
    return this.toastService.getActionClasses(type);
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }

  handleActionClick(toast: Toast): void {
    if (toast.action) {
      toast.action.handler();
      this.toastService.remove(toast.id);
    }
  }
}