import { Component, signal, computed, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <!-- Month Header -->
      <div class="flex items-center justify-between mb-4">
        <button 
          (click)="previousMonth()"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 class="text-lg font-bold text-dark">
          {{ monthName() }} {{ currentYear() }}
        </h3>
        <button 
          (click)="nextMonth()"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        @for (day of weekDays; track day) {
          <div class="text-center text-xs font-semibold text-gray-500 py-2">
            {{ day }}
          </div>
        }
      </div>

      <!-- Calendar Days -->
      <div class="grid grid-cols-7 gap-1">
        @for (day of calendarDays(); track day.date) {
          <button
            (click)="selectDate(day)"
            [disabled]="day.isDisabled"
            class="aspect-square p-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="{
              'text-gray-300': day.isOtherMonth,
              'text-gray-400 cursor-not-allowed': day.isDisabled && !day.isOtherMonth,
              'hover:bg-primary/10': !day.isDisabled && !day.isSelected,
              'bg-primary text-white font-bold': day.isSelected,
              'bg-gray-100': day.isToday && !day.isSelected,
              'ring-2 ring-primary ring-offset-2': day.isToday && day.isSelected
            }">
            {{ day.day }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BookingCalendarComponent {
  // Input: minimum selectable date (default: today)
  minDate = input<Date>(new Date());
  
  // Input: allowed days of week (e.g., ['MONDAY', 'TUESDAY', 'FRIDAY'])
  allowedDays = input<string[]>([]);
  
  // Output: emits selected date
  dateSelected = output<Date>();

  // Current view state
  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());
  selectedDate = signal<Date | null>(null);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
  private dayNameToNumber: { [key: string]: number } = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6
  };

  monthName = computed(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[this.currentMonth()];
  });

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const days: Array<{
      date: Date;
      day: number;
      isOtherMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Previous month days
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevLastDay.getDate() - i);
      days.push({
        date,
        day: date.getDate(),
        isOtherMonth: true,
        isDisabled: true,
        isSelected: false,
        isToday: false
      });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = this.minDate();
    minDate.setHours(0, 0, 0, 0);
    const allowedDays = this.allowedDays();

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      // Check if date is before minimum date
      const isBeforeMin = date < minDate;
      
      // Check if day of week is allowed
      const dayOfWeek = date.getDay();
      const isAllowedDay = allowedDays.length === 0 || this.isDayAllowed(dayOfWeek, allowedDays);
      
      const isDisabled = isBeforeMin || !isAllowedDay;
      const isToday = date.getTime() === today.getTime();
      const isSelected = this.selectedDate() !== null && 
                        date.getTime() === this.selectedDate()!.getTime();

      days.push({
        date,
        day,
        isOtherMonth: false,
        isDisabled,
        isSelected,
        isToday
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isOtherMonth: true,
        isDisabled: true,
        isSelected: false,
        isToday: false
      });
    }

    return days;
  });
  
  private isDayAllowed(dayOfWeek: number, allowedDays: string[]): boolean {
    return allowedDays.some(dayName => this.dayNameToNumber[dayName] === dayOfWeek);
  }

  selectDate(day: { date: Date; isDisabled: boolean; isOtherMonth: boolean }): void {
    if (day.isDisabled || day.isOtherMonth) return;
    
    this.selectedDate.set(day.date);
    this.dateSelected.emit(day.date);
  }

  previousMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.currentMonth.set(this.currentMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
  }
}
