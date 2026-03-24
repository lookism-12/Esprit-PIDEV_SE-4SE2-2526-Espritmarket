import { Component, signal, inject, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profile-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-white">
          <h2 class="text-2xl font-bold text-dark">Edit Profile</h2>
          <button (click)="onClose()" class="text-gray-400 hover:text-dark text-2xl">&times;</button>
        </div>

        <!-- Form -->
        <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-bold text-dark mb-2">First Name</label>
            <input 
              type="text" 
              formControlName="firstName"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter first name">
            @if (isFieldInvalid('firstName')) {
              <p class="text-red-500 text-xs mt-1">{{ getFieldError('firstName') }}</p>
            }
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-bold text-dark mb-2">Last Name</label>
            <input 
              type="text" 
              formControlName="lastName"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter last name">
            @if (isFieldInvalid('lastName')) {
              <p class="text-red-500 text-xs mt-1">{{ getFieldError('lastName') }}</p>
            }
          </div>

          <!-- Email (Read-only) -->
          <div>
            <label class="block text-sm font-bold text-dark mb-2">Email</label>
            <input 
              type="email" 
              [value]="currentEmail()"
              disabled
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              placeholder="Email cannot be changed">
            <p class="text-xs text-gray-500 mt-1">📧 Email cannot be changed. Contact support if needed.</p>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-bold text-dark mb-2">Phone</label>
            <input 
              type="tel" 
              formControlName="phone"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter phone number">
            @if (isFieldInvalid('phone')) {
              <p class="text-red-500 text-xs mt-1">{{ getFieldError('phone') }}</p>
            }
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
              [disabled]="isSaving() || editForm.invalid"
              class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
              {{ isSaving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileEditModal {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  @Input() onClose: () => void = () => {};
  @Input() onSave: (data: any) => void = () => {};

  editForm: FormGroup;
  isSaving = signal(false);
  
  currentEmail = computed(() => this.authService.userEmail() || '');

  constructor() {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern(/^[0-9]{8,15}$|^$/)]]
    });
    
    // Pre-fill with current user data
    const firstName = this.authService.userFirstName();
    const lastName = this.authService.userLastName();
    const phone = this.authService.currentUser()?.phone || '';
    
    if (firstName) this.editForm.get('firstName')?.setValue(firstName);
    if (lastName) this.editForm.get('lastName')?.setValue(lastName);
    if (phone) this.editForm.get('phone')?.setValue(phone);
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      console.error('❌ Form is invalid');
      return;
    }

    // Check if at least one field has a value (prevent empty submit)
    const formValue = this.editForm.value;
    const hasData = formValue.firstName?.trim() || formValue.lastName?.trim() || formValue.phone?.trim();
    
    if (!hasData) {
      console.error('❌ At least one field must be filled');
      return;
    }

    this.isSaving.set(true);
    
    // Send only non-empty fields
    const updateData: any = {};
    if (formValue.firstName?.trim()) updateData.firstName = formValue.firstName.trim();
    if (formValue.lastName?.trim()) updateData.lastName = formValue.lastName.trim();
    if (formValue.phone?.trim()) updateData.phone = formValue.phone.trim();

    this.userService.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Profile updated successfully');
        this.authService.userFirstName.set(updatedUser.firstName);
        this.authService.userLastName.set(updatedUser.lastName);
        if (updatedUser.phone) {
          // Update phone in signals if needed
        }
        this.isSaving.set(false);
        this.onSave(updatedUser);
      },
      error: (error) => {
        console.error('❌ Failed to update profile:', error.status, error.error?.message || error.message);
        this.isSaving.set(false);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field?.errors) return '';
    
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['pattern']) return 'Invalid format (must be 8-15 digits for phone)';
    
    return 'Invalid input';
  }
}
