import { Component, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div 
        [class]="alertClasses"
        role="alert"
      >
        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            @switch (type()) {
              @case ('success') {
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                </svg>
              }
              @case ('error') {
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                </svg>
              }
              @case ('warning') {
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
              }
              @case ('info') {
                <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="ml-3 flex-1">
            @if (title()) {
              <h3 [class]="titleClasses">{{ title() }}</h3>
            }
            <div [class]="messageClasses">
              {{ message() }}
              <ng-content></ng-content>
            </div>
          </div>

          <!-- Dismiss button -->
          @if (dismissible()) {
            <div class="ml-auto pl-3">
              <button
                type="button"
                [class]="dismissButtonClasses"
                (click)="dismiss()"
              >
                <span class="sr-only">Dismiss</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AlertComponent implements OnInit, OnDestroy {
  // Inputs
  readonly type = input<AlertType>('info');
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly dismissible = input<boolean>(true);
  readonly autoDismiss = input<boolean>(false);
  readonly autoDismissDelay = input<number>(5000);

  // Outputs
  readonly dismissed = output<void>();

  // State
  readonly isVisible = signal<boolean>(true);

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  get alertClasses(): string {
    const baseClasses = 'rounded-lg p-4';
    const typeClasses: Record<AlertType, string> = {
      success: 'bg-green-50 border border-green-200',
      error: 'bg-red-50 border border-red-200',
      warning: 'bg-yellow-50 border border-yellow-200',
      info: 'bg-blue-50 border border-blue-200'
    };
    return `${baseClasses} ${typeClasses[this.type()]}`;
  }

  get titleClasses(): string {
    const typeClasses: Record<AlertType, string> = {
      success: 'text-green-800',
      error: 'text-red-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800'
    };
    return `text-sm font-medium ${typeClasses[this.type()]}`;
  }

  get messageClasses(): string {
    const typeClasses: Record<AlertType, string> = {
      success: 'text-green-700',
      error: 'text-red-700',
      warning: 'text-yellow-700',
      info: 'text-blue-700'
    };
    return `text-sm ${typeClasses[this.type()]} ${this.title() ? 'mt-1' : ''}`;
  }

  get dismissButtonClasses(): string {
    const typeClasses: Record<AlertType, string> = {
      success: 'text-green-500 hover:text-green-600 focus:ring-green-600',
      error: 'text-red-500 hover:text-red-600 focus:ring-red-600',
      warning: 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-600',
      info: 'text-blue-500 hover:text-blue-600 focus:ring-blue-600'
    };
    return `inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${typeClasses[this.type()]}`;
  }

  ngOnInit(): void {
    if (this.autoDismiss()) {
      this.dismissTimer = setTimeout(() => {
        this.dismiss();
      }, this.autoDismissDelay());
    }
  }

  ngOnDestroy(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }
  }

  show(): void {
    this.isVisible.set(true);
  }

  dismiss(): void {
    this.isVisible.set(false);
    this.dismissed.emit();
  }
}
