import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
      <!-- Icon -->
      <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
        @if (icon === 'products') {
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        } @else if (icon === 'search') {
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        } @else if (icon === 'category') {
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        } @else if (icon === 'shop') {
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        } @else {
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        }
      </div>

      <!-- Title -->
      <h3 class="text-3xl font-black text-dark mb-4 tracking-tighter">{{ title }}</h3>

      <!-- Description -->
      <p class="text-secondary font-bold max-w-sm mb-10">{{ description }}</p>

      <!-- Action Button -->
      @if (actionLabel) {
        <button 
          (click)="action.emit()"
          class="px-10 py-5 bg-dark text-white rounded-2xl font-black hover:bg-black transition-all uppercase tracking-widest text-xs">
          {{ actionLabel }}
        </button>
      }
    </div>
  `
})
export class EmptyState {
  @Input() icon: 'products' | 'search' | 'category' | 'shop' | 'default' = 'default';
  @Input() title: string = 'No items found';
  @Input() description: string = 'There are no items to display at the moment.';
  @Input() actionLabel: string = '';
  @Output() action = new EventEmitter<void>();
}
