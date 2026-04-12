import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="rounded-2xl p-6" style="background-color:var(--card-bg);border:1px solid var(--border)">
      <h2 class="text-xl font-black mb-5" style="color:var(--text-color)">⚙️ Preferences</h2>

      <!-- Notification Preferences -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Notifications</h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors" style="background-color:var(--subtle)">
            <span class="font-semibold text-sm" style="color:var(--text-color)">Email Notifications</span>
            <input type="checkbox" [checked]="preferences().notifications.email" (change)="toggleNotification('email')" class="w-5 h-5 text-primary rounded">
          </label>
          <label class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors" style="background-color:var(--subtle)">
            <span class="font-semibold text-sm" style="color:var(--text-color)">Push Notifications</span>
            <input type="checkbox" [checked]="preferences().notifications.push" (change)="toggleNotification('push')" class="w-5 h-5 text-primary rounded">
          </label>
          <label class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors" style="background-color:var(--subtle)">
            <span class="font-semibold text-sm" style="color:var(--text-color)">SMS Notifications</span>
            <input type="checkbox" [checked]="preferences().notifications.sms" (change)="toggleNotification('sms')" class="w-5 h-5 text-primary rounded">
          </label>
        </div>
      </div>

      <!-- Theme Preference -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Theme</h3>
        <div class="grid grid-cols-3 gap-3">
          @for (theme of themes; track theme.value) {
            <button (click)="setTheme(theme.value)" 
              class="p-3 rounded-lg font-semibold text-sm transition-all"
              [class.ring-2]="preferences().theme === theme.value"
              [class.ring-primary]="preferences().theme === theme.value"
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
              [class.bg-primary]="preferences().academicInterests.includes(interest)"
              [class.text-white]="preferences().academicInterests.includes(interest)"
              [style.background-color]="!preferences().academicInterests.includes(interest) ? 'var(--subtle)' : ''"
              [style.color]="!preferences().academicInterests.includes(interest) ? 'var(--text-color)' : ''">
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
              [class.bg-primary]="preferences().preferredCategories.includes(category)"
              [class.text-white]="preferences().preferredCategories.includes(category)"
              [style.background-color]="!preferences().preferredCategories.includes(category) ? 'var(--subtle)' : ''"
              [style.color]="!preferences().preferredCategories.includes(category) ? 'var(--text-color)' : ''">
              {{ category }}
            </button>
          }
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button (click)="savePreferences()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all">
          Save Preferences
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfilePreferencesComponent {
  preferences = signal({
    academicInterests: ['Software Engineering', 'Data Science'],
    preferredCategories: ['Electronics', 'Books'],
    notifications: { email: true, push: true, sms: false },
    theme: 'light' as 'light' | 'dark' | 'system'
  });

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

  toggleNotification(type: 'email' | 'push' | 'sms'): void {
    this.preferences.update(p => ({
      ...p,
      notifications: {
        ...p.notifications,
        [type]: !p.notifications[type]
      }
    }));
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.preferences.update(p => ({ ...p, theme }));
  }

  toggleInterest(interest: string): void {
    this.preferences.update(p => ({
      ...p,
      academicInterests: p.academicInterests.includes(interest)
        ? p.academicInterests.filter(i => i !== interest)
        : [...p.academicInterests, interest]
    }));
  }

  toggleCategory(category: string): void {
    this.preferences.update(p => ({
      ...p,
      preferredCategories: p.preferredCategories.includes(category)
        ? p.preferredCategories.filter(c => c !== category)
        : [...p.preferredCategories, category]
    }));
  }

  savePreferences(): void {
    console.log('Saving preferences:', this.preferences());
    alert('Preferences saved successfully!');
  }
}
