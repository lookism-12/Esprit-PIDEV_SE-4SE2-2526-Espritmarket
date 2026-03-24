import { Component, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-password-change-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <!-- Header -->
        <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-dark">Change Password</h2>
          <button (click)="onClose()" class="text-gray-400 hover:text-dark text-2xl">&times;</button>
        </div>

        <!-- Form -->
        <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <!-- Success Message -->
          @if (successMessage()) {
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-green-800 text-sm font-bold">✅ {{ successMessage() }}</p>
            </div>
          }

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-red-800 text-sm font-bold">❌ {{ errorMessage() }}</p>
            </div>
          }

          <!-- Current Password -->
          <div>
            <label class="block text-sm font-bold text-dark mb-2">Current Password</label>
            <div class="relative">
              <input 
                [type]="showCurrentPassword() ? 'text' : 'password'"
                formControlName="currentPassword"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                placeholder="Enter current password">
              <button 
                type="button"
                (click)="toggleShowCurrentPassword()"
                class="absolute right-3 top-2.5 text-gray-400 hover:text-dark">
                {{ showCurrentPassword() ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            @if (isFieldInvalid('currentPassword')) {
              <p class="text-red-500 text-xs mt-1">{{ getFieldError('currentPassword') }}</p>
            }
          </div>

          <!-- New Password -->
          <div>
            <label class="block text-sm font-bold text-dark mb-2">New Password</label>
            <div class="relative">
              <input 
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="newPassword"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                placeholder="Enter new password (min 8 characters)">
              <button 
                type="button"
                (click)="toggleShowNewPassword()"
                class="absolute right-3 top-2.5 text-gray-400 hover:text-dark">
                {{ showNewPassword() ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            @if (isFieldInvalid('newPassword')) {
              <p class="text-red-500 text-xs mt-1">{{ getFieldError('newPassword') }}</p>
            }

            <!-- Password Strength Indicator -->
            @if (passwordForm.get('newPassword')?.value) {
              <div class="mt-2 space-y-1">
                <div class="flex gap-1">
                  <div [class.bg-green-500]="passwordStrength() >= 1" [class.bg-gray-200]="passwordStrength() < 1" class="flex-1 h-1 rounded"></div>
                  <div [class.bg-green-500]="passwordStrength() >= 2" [class.bg-gray-200]="passwordStrength() < 2" class="flex-1 h-1 rounded"></div>
                  <div [class.bg-green-500]="passwordStrength() >= 3" [class.bg-gray-200]="passwordStrength() < 3" class="flex-1 h-1 rounded"></div>
                </div>
                <p class="text-xs font-bold" [ngClass]="{
                  'text-red-600': passwordStrength() === 1,
                  'text-yellow-600': passwordStrength() === 2,
                  'text-green-600': passwordStrength() === 3
                }">
                  {{ passwordStrengthLabel() }}
                </p>
              </div>
            }
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-bold text-dark mb-2">Confirm Password</label>
            <div class="relative">
              <input 
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                placeholder="Confirm new password">
              <button 
                type="button"
                (click)="toggleShowConfirmPassword()"
                class="absolute right-3 top-2.5 text-gray-400 hover:text-dark">
                {{ showConfirmPassword() ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            @if (isFieldInvalid('confirmPassword')) {
              <p class="text-red-500 text-xs mt-1">{{ getFieldError('confirmPassword') }}</p>
            }
          </div>

          <!-- Password Requirements -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-bold text-blue-900 mb-2">Password Requirements:</p>
            <ul class="text-xs text-blue-800 space-y-1">
              <li [class.line-through]="!requirementsNotMet().minLength" [class.text-green-600]="!requirementsNotMet().minLength">
                ✓ At least 8 characters
              </li>
              <li [class.line-through]="!requirementsNotMet().hasUpperCase" [class.text-green-600]="!requirementsNotMet().hasUpperCase">
                ✓ One uppercase letter (A-Z)
              </li>
              <li [class.line-through]="!requirementsNotMet().hasNumber" [class.text-green-600]="!requirementsNotMet().hasNumber">
                ✓ One number (0-9)
              </li>
              <li [class.line-through]="!requirementsNotMet().hasSpecialChar" [class.text-green-600]="!requirementsNotMet().hasSpecialChar">
                ✓ One special character (!@#$%^&*)
              </li>
            </ul>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              (click)="onClose()"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold text-dark hover:bg-gray-50">
              Cancel
            </button>
            <button 
              type="submit"
              [disabled]="isChanging() || passwordForm.invalid"
              class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
              {{ isChanging() ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class PasswordChangeModal {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  @Input() onClose: () => void = () => {};
  @Input() onChangeComplete: () => void = () => {};

  passwordForm: FormGroup;
  isChanging = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  toggleShowCurrentPassword(): void {
    this.showCurrentPassword.update(v => !v);
  }

  toggleShowNewPassword(): void {
    this.showNewPassword.update(v => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  constructor() {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordStrength() {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    return Math.min(3, Math.ceil(strength / 1.5));
  }

  passwordStrengthLabel() {
    const strength = this.passwordStrength();
    if (strength === 1) return '🔴 Weak';
    if (strength === 2) return '🟡 Medium';
    return '🟢 Strong';
  }

  requirementsNotMet() {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return {
      minLength: password.length < 8,
      hasUpperCase: !/[A-Z]/.test(password),
      hasNumber: !/[0-9]/.test(password),
      hasSpecialChar: !/[!@#$%^&*]/.test(password)
    };
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value || '';
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (!hasUpperCase || !hasNumber || !hasSpecialChar) {
      return { weakPassword: true };
    }
    return null;
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.errorMessage.set('Please fix all errors before continuing');
      return;
    }

    this.isChanging.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        console.log('✅ Password changed successfully');
        this.successMessage.set('Password changed successfully! ✅');
        this.isChanging.set(false);
        this.passwordForm.reset();
        
        setTimeout(() => {
          this.onChangeComplete();
          this.onClose();
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Password change failed:', error);
        this.errorMessage.set(error.error?.message || 'Failed to change password. Please try again.');
        this.isChanging.set(false);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (!field?.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['weakPassword']) return 'Password must contain uppercase, number, and special character';
    if (field.errors['passwordMismatch']) return 'Passwords do not match';
    
    return 'Invalid input';
  }
}
