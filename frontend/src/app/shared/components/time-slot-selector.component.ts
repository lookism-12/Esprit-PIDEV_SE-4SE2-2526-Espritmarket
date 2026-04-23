import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSlot } from '../../core/services/booking.service';

@Component({
  selector: 'app-time-slot-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <h3 class="text-lg font-bold text-dark mb-4">Available Time Slots</h3>
      
      @if (isLoading()) {
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        </div>
      } @else if (slots().length === 0) {
        <div class="text-center py-8">
          <div class="text-4xl mb-2">📅</div>
          <p class="text-gray-500 text-sm">No available slots for this date</p>
        </div>
      } @else {
        <div class="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          @for (slot of slots(); track slot.label) {
            <button
              (click)="selectSlot(slot)"
              [disabled]="!slot.available"
              class="p-3 rounded-lg text-sm font-medium transition-all border-2"
              [ngClass]="{
                'border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer': slot.available && !isSelected(slot),
                'border-primary bg-primary text-white font-bold': slot.available && isSelected(slot),
                'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed': !slot.available
              }">
              {{ slot.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TimeSlotSelectorComponent {
  // Inputs
  slots = input<TimeSlot[]>([]);
  isLoading = input<boolean>(false);
  
  // Output
  slotSelected = output<TimeSlot>();
  
  // State
  selectedSlot = signal<TimeSlot | null>(null);

  selectSlot(slot: TimeSlot): void {
    if (!slot.available) return;
    
    this.selectedSlot.set(slot);
    this.slotSelected.emit(slot);
  }

  isSelected(slot: TimeSlot): boolean {
    const selected = this.selectedSlot();
    return selected !== null && selected.label === slot.label;
  }
}
