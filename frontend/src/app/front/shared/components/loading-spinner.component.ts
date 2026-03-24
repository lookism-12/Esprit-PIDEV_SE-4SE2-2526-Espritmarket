import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'secondary' | 'white' | 'gray';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses" role="status" aria-label="Loading">
      <svg 
        [class]="spinnerClasses" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          class="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          stroke-width="4"
        ></circle>
        <path 
          class="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      @if (text()) {
        <span [class]="textClasses">{{ text() }}</span>
      }
      <span class="sr-only">Loading...</span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class LoadingSpinnerComponent {
  // Inputs
  readonly size = input<SpinnerSize>('md');
  readonly color = input<SpinnerColor>('primary');
  readonly text = input<string>('');
  readonly fullScreen = input<boolean>(false);
  readonly overlay = input<boolean>(false);

  get containerClasses(): string {
    let classes = 'inline-flex items-center justify-center';
    
    if (this.fullScreen()) {
      classes = 'fixed inset-0 flex items-center justify-center';
    }
    
    if (this.overlay()) {
      classes += ' bg-white bg-opacity-75 z-50';
    }
    
    return classes;
  }

  get spinnerClasses(): string {
    const sizeClasses: Record<SpinnerSize, string> = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12'
    };

    const colorClasses: Record<SpinnerColor, string> = {
      primary: 'text-blue-600',
      secondary: 'text-gray-600',
      white: 'text-white',
      gray: 'text-gray-400'
    };

    return `animate-spin ${sizeClasses[this.size()]} ${colorClasses[this.color()]}`;
  }

  get textClasses(): string {
    const colorClasses: Record<SpinnerColor, string> = {
      primary: 'text-blue-600',
      secondary: 'text-gray-600',
      white: 'text-white',
      gray: 'text-gray-500'
    };

    const sizeClasses: Record<SpinnerSize, string> = {
      xs: 'text-xs ml-1',
      sm: 'text-sm ml-2',
      md: 'text-base ml-2',
      lg: 'text-lg ml-3',
      xl: 'text-xl ml-4'
    };

    return `${colorClasses[this.color()]} ${sizeClasses[this.size()]}`;
  }
}
