import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationSettingsService } from '../../../core/notification-settings.service';
import { NotificationSettingsComponent } from '../../notifications/notification-settings.component';

@Component({
  selector: 'app-profile-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificationSettingsComponent],
  template: `
    <div class="rounded-2xl p-6" style="background-color:var(--card-bg);border:1px solid var(--border)">
      <h2 class="text-xl font-black mb-5" style="color:var(--text-color)">⚙️ Preferences</h2>

      <!-- Notification Preferences — powered by real backend settings -->
      <div class="mb-6">
        <app-notification-settings />
      </div>

      <!-- Theme Preference -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Theme</h3>
        <div class="grid grid-cols-3 gap-3">
          @for (theme of themes; track theme.value) {
            <button (click)="setTheme(theme.value)"
              class="p-3 rounded-lg font-semibold text-sm transition-all"
              [class.ring-2]="currentTheme() === theme.value"
              [class.ring-primary]="currentTheme() === theme.value"
              style="background-color:var(--subtle);color:var(--text-color)">
              {{ theme.icon }} {{ theme.label }}
            </button>
          }
        </div>
      </div>

      <!-- Academic Interests -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Academic Interests</h3>
        <div class="flex flex-wrap gap-2">
          @for (interest of availableInterests; track interest) {
            <button (click)="toggleInterest(interest)"
              class="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              [class.bg-primary]="selectedInterests().includes(interest)"
              [class.text-white]="selectedInterests().includes(interest)"
              [style.background-color]="!selectedInterests().includes(interest) ? 'var(--subtle)' : ''"
              [style.color]="!selectedInterests().includes(interest) ? 'var(--text-color)' : ''">
              {{ interest }}
            </button>
          }
        </div>
      </div>

      <!-- Product Categories -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Preferred Categories</h3>
        <div class="flex flex-wrap gap-2">
          @for (category of availableCategories; track category) {
            <button (click)="toggleCategory(category)"
              class="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              [class.bg-primary]="selectedCategories().includes(category)"
              [class.text-white]="selectedCategories().includes(category)"
              [style.background-color]="!selectedCategories().includes(category) ? 'var(--subtle)' : ''"
              [style.color]="!selectedCategories().includes(category) ? 'var(--text-color)' : ''">
              {{ category }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ProfilePreferencesComponent {
  currentTheme = signal<'light' | 'dark' | 'system'>('light');
  selectedInterests = signal<string[]>(['Software Engineering', 'Data Science']);
  selectedCategories = signal<string[]>(['Electronics', 'Books']);

  availableInterests = [
    'Software Engineering', 'Data Science', 'Mobile Development',
    'Web Development', 'AI/ML', 'Cybersecurity', 'DevOps', 'Cloud Computing'
  ];

  availableCategories = [
    'Electronics', 'Books', 'Gaming', 'Furniture',
    'Services', 'Sports', 'Clothing', 'Food'
  ];

  themes = [
    { value: 'light' as const, label: 'Light', icon: '☀️' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙' },
    { value: 'system' as const, label: 'System', icon: '💻' }
  ];

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.currentTheme.set(theme);
  }

  toggleInterest(interest: string): void {
    this.selectedInterests.update(list =>
      list.includes(interest) ? list.filter(i => i !== interest) : [...list, interest]
    );
  }

  toggleCategory(category: string): void {
    this.selectedCategories.update(list =>
      list.includes(category) ? list.filter(c => c !== category) : [...list, category]
    );
  }
}
