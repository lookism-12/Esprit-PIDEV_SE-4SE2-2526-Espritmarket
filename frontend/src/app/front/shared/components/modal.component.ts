import { Component, input, output, signal, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        (click)="onBackdropClick($event)"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div 
            #modalContent
            class="relative w-full transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
            [class]="modalSizeClass"
            (click)="$event.stopPropagation()"
          >
            <!-- Header -->
            @if (showHeader()) {
              <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ title() }}
                </h3>
                @if (showCloseButton()) {
                  <button
                    type="button"
                    class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    (click)="close()"
                  >
                    <span class="sr-only">Close</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }
              </div>
            }

            <!-- Body -->
            <div class="px-6 py-4">
              <ng-content select="[modal-body]"></ng-content>
              <ng-content></ng-content>
            </div>

            <!-- Footer -->
            @if (showFooter()) {
              <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
                <ng-content select="[modal-footer]"></ng-content>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ModalComponent implements OnDestroy {
  @ViewChild('modalContent') modalContent!: ElementRef;

  // Inputs
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  readonly showHeader = input<boolean>(true);
  readonly showFooter = input<boolean>(true);
  readonly showCloseButton = input<boolean>(true);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);

  // Outputs
  readonly opened = output<void>();
  readonly closed = output<void>();

  // State
  readonly isOpen = signal<boolean>(false);

  private escapeListener: ((e: KeyboardEvent) => void) | null = null;

  get modalSizeClass(): string {
    const sizeClasses: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4'
    };
    return sizeClasses[this.size()] || sizeClasses['md'];
  }

  /**
   * Open the modal
   */
  open(): void {
    this.isOpen.set(true);
    this.opened.emit();
    
    // Add escape key listener
    if (this.closeOnEscape()) {
      this.escapeListener = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escapeListener);
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the modal
   */
  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
    this.cleanup();
  }

  /**
   * Toggle modal state
   */
  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }

  private cleanup(): void {
    // Remove escape listener
    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
      this.escapeListener = null;
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
