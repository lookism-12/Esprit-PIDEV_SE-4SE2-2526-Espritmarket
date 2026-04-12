import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { UserService } from '../../../core/user.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="rounded-2xl p-6" style="background-color:var(--card-bg);border:1px solid var(--border)">
      <h2 class="text-xl font-black mb-5" style="color:var(--text-color)">👤 Account Settings</h2>

      <!-- Profile Information -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Profile Information</h3>
        <form [formGroup]="profileForm" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">First Name</label>
            <input type="text" formControlName="firstName" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Last Name</label>
            <input type="text" formControlName="lastName" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Email</label>
            <input type="email" formControlName="email" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Phone</label>
            <input type="tel" formControlName="phone" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <button type="button" (click)="saveProfile()" [disabled]="isSaving()"
            class="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all disabled:opacity-50">
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>

      <!-- Change Password -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Change Password</h3>
        <button (click)="openPasswordChange()" 
          class="px-6 py-2 font-bold rounded-xl transition-all"
          style="background-color:var(--subtle);color:var(--text-color)">
          🔐 Change Password
        </button>
      </div>

      <!-- Avatar Upload -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Profile Picture</h3>
        <button (click)="openAvatarUpload()" 
          class="px-6 py-2 font-bold rounded-xl transition-all"
          style="background-color:var(--subtle);color:var(--text-color)">
          📷 Upload Avatar
        </button>
      </div>

      <!-- Danger Zone -->
      <div class="mt-8 pt-6" style="border-top:1px solid var(--border)">
        <h3 class="font-bold text-sm mb-3 text-red-600">Danger Zone</h3>
        <div class="space-y-3">
          <button (click)="deactivateAccount()" 
            class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all">
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfileSettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  isSaving = signal(false);

  profileForm: FormGroup = this.fb.group({
    firstName: [this.authService.userFirstName() || '', [Validators.required, Validators.minLength(2)]],
    lastName: [this.authService.userLastName() || '', [Validators.required, Validators.minLength(2)]],
    email: [this.authService.userEmail() || '', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[0-9]{8,15}$/)]]
  });

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (user: any) => {
        this.authService.userFirstName.set(user.firstName);
        this.authService.userLastName.set(user.lastName);
        this.isSaving.set(false);
        alert('Profile updated successfully!');
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.isSaving.set(false);
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  openPasswordChange(): void {
    alert('Password change modal would open here');
  }

  openAvatarUpload(): void {
    alert('Avatar upload modal would open here');
  }

  deactivateAccount(): void {
    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      alert('Account deactivation would be processed here');
    }
  }
}
