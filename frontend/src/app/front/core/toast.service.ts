import { Injectable, signal, computed } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastIdCounter = 0;
  
  // Reactive state
  readonly toasts = signal<Toast[]>([]);
  
  // Computed values
  readonly hasToasts = computed(() => this.toasts().length > 0);

  /**
   * Show a success toast
   */
  success(message: string, duration = 4000): string {
    return this.show({
      message,
      type: 'success',
      duration,
      icon: '✅'
    });
  }

  /**
   * Show an error toast
   */
  error(message: string, duration = 6000): string {
    return this.show({
      message,
      type: 'error',
      duration,
      icon: '❌'
    });
  }

  /**
   * Show an info toast
   */
  info(message: string, duration = 4000): string {
    return this.show({
      message,
      type: 'info',
      duration,
      icon: 'ℹ️'
    });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration = 5000): string {
    return this.show({
      message,
      type: 'warning',
      duration,
      icon: '⚠️'
    });
  }

  /**
   * Show a toast with action button
   */
  withAction(message: string, actionLabel: string, actionHandler: () => void, type: Toast['type'] = 'info'): string {
    return this.show({
      message,
      type,
      duration: 8000,
      action: {
        label: actionLabel,
        handler: actionHandler
      }
    });
  }

  /**
   * Show a custom toast
   */
  show(toastConfig: Omit<Toast, 'id'>): string {
    const id = `toast-${++this.toastIdCounter}`;
    const toast: Toast = {
      id,
      ...toastConfig
    };

    // Add to toasts array
    this.toasts.update(current => [...current, toast]);

    // Auto-remove after duration (if specified)
    if (toast.duration && toast.duration > 0) {
      const destroySubject = new Subject<void>();
      
      timer(toast.duration)
        .pipe(takeUntil(destroySubject))
        .subscribe(() => {
          this.remove(id);
          destroySubject.complete();
        });
    }

    return id;
  }

  /**
   * Remove a specific toast
   */
  remove(id: string): void {
    this.toasts.update(current => current.filter(toast => toast.id !== id));
  }

  /**
   * Remove all toasts
   */
  clear(): void {
    this.toasts.set([]);
  }

  /**
   * Get CSS classes for toast type
   */
  getToastClasses(type: Toast['type']): string {
    const baseClasses = 'rounded-2xl shadow-2xl border p-4 flex items-start gap-3 transform transition-all duration-300 ease-in-out';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`;
    }
  }

  /**
   * Get button classes for toast action
   */
  getActionClasses(type: Toast['type']): string {
    const baseClasses = 'px-3 py-1 rounded-lg text-sm font-semibold transition-colors';
    
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-700 hover:bg-green-100`;
      case 'error':
        return `${baseClasses} text-red-700 hover:bg-red-100`;
      case 'warning':
        return `${baseClasses} text-yellow-700 hover:bg-yellow-100`;
      case 'info':
        return `${baseClasses} text-blue-700 hover:bg-blue-100`;
      default:
        return `${baseClasses} text-gray-700 hover:bg-gray-100`;
    }
  }
}