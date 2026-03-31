import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';
import { AdminAuthService } from '../core';
import { ProductService } from '../../core/services/product.service';
import { Product, ProductStatus } from '../../front/models/product';
import { ProductModal } from '../../front/pages/profile/product-modal';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Main Container -->
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Page Header -->
      <div class="relative bg-white rounded-2xl p-8 mb-8 overflow-hidden shadow-soft group">
        <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-primary/10"></div>
        <div class="relative z-10">
          <h1 class="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Profile Settings</h1>
          <p class="text-gray-500">Manage your account information and preferences</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-xl shadow-sm mb-6 border border-gray-100">
        <div class="flex border-b border-gray-200">
          <button 
            (click)="setActiveTab('overview')"
            [class]="activeTab() === 'overview' 
              ? 'flex-1 px-6 py-4 text-sm font-bold text-primary border-b-2 border-primary bg-primary/5 transition-all' 
              : 'flex-1 px-6 py-4 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 transition-all'">
            <span class="mr-2">👤</span> Overview
          </button>
          <button 
            (click)="setActiveTab('edit')"
            [class]="activeTab() === 'edit' 
              ? 'flex-1 px-6 py-4 text-sm font-bold text-primary border-b-2 border-primary bg-primary/5 transition-all' 
              : 'flex-1 px-6 py-4 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 transition-all'">
            <span class="mr-2">✏️</span> Edit Profile
          </button>
          <button 
            (click)="setActiveTab('password')"
            [class]="activeTab() === 'password' 
              ? 'flex-1 px-6 py-4 text-sm font-bold text-primary border-b-2 border-primary bg-primary/5 transition-all' 
              : 'flex-1 px-6 py-4 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 transition-all'">
            <span class="mr-2">🔒</span> Change Password
          </button>
        </div>
      </div>

      <!-- Overview Tab -->
      @if (activeTab() === 'overview') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Profile Card -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div class="flex flex-col items-center">
                <!-- Avatar -->
                <div class="relative group mb-4">
                  @if (profile()?.avatarUrl) {
                    <img [src]="profile()!.avatarUrl" alt="Avatar" class="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg">
                  } @else {
                    <div class="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center border-4 border-gray-100 shadow-lg">
                      <span class="text-4xl font-bold text-white">{{ getInitials() }}</span>
                    </div>
                  }
                  <button 
                    (click)="setActiveTab('edit')"
                    class="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    ✏️
                  </button>
                </div>

                <!-- Name & Email -->
                <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
                <p class="text-sm text-gray-500 mb-4">{{ profile()?.email }}</p>

                <!-- Role Badge -->
                <div class="flex gap-2 flex-wrap justify-center mb-4">
                  @for (role of profile()?.roles; track role) {
                    <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                      {{ role }}
                    </span>
                  }
                </div>

                <!-- Stats -->
                <div class="w-full border-t border-gray-200 pt-4 mt-4 space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Phone</span>
                    <span class="text-sm font-semibold text-gray-900">{{ profile()?.phone || 'Not set' }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">User ID</span>
                    <span class="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">{{ profile()?.id?.substring(0, 8) || 'N/A' }}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Information Cards -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Account Information -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span class="mr-2">📋</span> Account Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">First Name</p>
                  <p class="text-base font-semibold text-gray-900">{{ profile()?.firstName }}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last Name</p>
                  <p class="text-base font-semibold text-gray-900">{{ profile()?.lastName }}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
                  <p class="text-base font-semibold text-gray-900">{{ profile()?.email }}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                  <p class="text-base font-semibold text-gray-900">{{ profile()?.phone || 'Not set' }}</p>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span class="mr-2">⚡</span> Quick Actions
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  (click)="setActiveTab('edit')"
                  class="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                  <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform">
                    ✏️
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-bold text-gray-900">Edit Profile</p>
                    <p class="text-xs text-gray-600">Update your information</p>
                  </div>
                </button>
                <button 
                  (click)="setActiveTab('password')"
                  class="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                  <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform">
                    🔒
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-bold text-gray-900">Change Password</p>
                    <p class="text-xs text-gray-600">Update your password</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Edit Profile Tab -->
      @if (activeTab() === 'edit') {
        <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
            <!-- Avatar Upload Section -->
            <div class="mb-8 pb-8 border-b border-gray-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span class="mr-2">📷</span> Profile Picture
              </h3>
              <div class="flex items-center gap-6">
                @if (previewUrl) {
                  <img [src]="previewUrl" alt="Preview" class="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg">
                } @else if (profile()?.avatarUrl) {
                  <img [src]="profile()!.avatarUrl" alt="Avatar" class="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg">
                } @else {
                  <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center border-4 border-gray-100 shadow-lg">
                    <span class="text-3xl font-bold text-white">{{ getInitials() }}</span>
                  </div>
                }
                <div class="flex-1">
                  <input 
                    type="file" 
                    (change)="onFileSelected($event)" 
                    accept="image/*"
                    #fileInput
                    class="hidden">
                  <button 
                    type="button"
                    (click)="fileInput.click()"
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors mb-2">
                    Choose Image
                  </button>
                  @if (selectedFile) {
                    <button 
                      type="button"
                      (click)="uploadAvatar()"
                      [disabled]="isUpdatingProfile()"
                      class="ml-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                      {{ isUpdatingProfile() ? 'Uploading...' : 'Upload' }}
                    </button>
                  }
                  <p class="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-bold text-gray-700 mb-2">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input 
                  id="firstName"
                  formControlName="firstName"
                  type="text"
                  [class]="isFieldInvalid(profileForm, 'firstName')
                    ? 'w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-400/30 transition-all'
                    : 'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'"
                  placeholder="Enter first name">
                @if (isFieldInvalid(profileForm, 'firstName')) {
                  <p class="text-red-500 text-xs font-semibold mt-1">{{ getFieldError(profileForm, 'firstName') }}</p>
                }
              </div>

              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-bold text-gray-700 mb-2">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input 
                  id="lastName"
                  formControlName="lastName"
                  type="text"
                  [class]="isFieldInvalid(profileForm, 'lastName')
                    ? 'w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-400/30 transition-all'
                    : 'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'"
                  placeholder="Enter last name">
                @if (isFieldInvalid(profileForm, 'lastName')) {
                  <p class="text-red-500 text-xs font-semibold mt-1">{{ getFieldError(profileForm, 'lastName') }}</p>
                }
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-bold text-gray-700 mb-2">
                  Email Address <span class="text-red-500">*</span>
                </label>
                <input 
                  id="email"
                  formControlName="email"
                  type="email"
                  [disabled]="true"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="email@example.com">
                <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <!-- Phone -->
              <div>
                <label for="phone" class="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input 
                  id="phone"
                  formControlName="phone"
                  type="tel"
                  [class]="isFieldInvalid(profileForm, 'phone')
                    ? 'w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-400/30 transition-all'
                    : 'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'"
                  placeholder="12345678">
                @if (isFieldInvalid(profileForm, 'phone')) {
                  <p class="text-red-500 text-xs font-semibold mt-1">{{ getFieldError(profileForm, 'phone') }}</p>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-4 pt-6 border-t border-gray-200">
              <button 
                type="submit"
                [disabled]="isUpdatingProfile() || profileForm.invalid"
                class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                @if (isUpdatingProfile()) {
                  <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                } @else {
                  <span>💾</span>
                  Save Changes
                }
              </button>
              <button 
                type="button"
                (click)="setActiveTab('overview'); loadProfile()"
                class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Change Password Tab -->
      @if (activeTab() === 'password') {
        <div class="max-w-2xl mx-auto">
          <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center">
                <span class="mr-2">🔒</span> Change Password
              </h3>
              <p class="text-sm text-gray-600">Ensure your account stays secure by using a strong password</p>
            </div>

            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="space-y-5">
                <!-- Current Password -->
                <div class="relative">
                  <label for="currentPassword" class="block text-sm font-bold text-gray-700 mb-2">
                    Current Password <span class="text-red-500">*</span>
                  </label>
                  <input 
                    id="currentPassword"
                    formControlName="currentPassword"
                    [type]="showCurrentPassword() ? 'text' : 'password'"
                    [class]="isFieldInvalid(passwordForm, 'currentPassword')
                      ? 'w-full px-4 py-3 pr-12 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-400/30 transition-all'
                      : 'w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'"
                    placeholder="Enter current password">
                  <button 
                    type="button"
                    (click)="togglePassword('current')"
                    class="absolute right-4 top-11 text-gray-500 hover:text-primary transition-colors">
                    {{ showCurrentPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                  @if (isFieldInvalid(passwordForm, 'currentPassword')) {
                    <p class="text-red-500 text-xs font-semibold mt-1">{{ getFieldError(passwordForm, 'currentPassword') }}</p>
                  }
                </div>

                <!-- New Password -->
                <div class="relative">
                  <label for="newPassword" class="block text-sm font-bold text-gray-700 mb-2">
                    New Password <span class="text-red-500">*</span>
                  </label>
                  <input 
                    id="newPassword"
                    formControlName="newPassword"
                    [type]="showNewPassword() ? 'text' : 'password'"
                    [class]="isFieldInvalid(passwordForm, 'newPassword')
                      ? 'w-full px-4 py-3 pr-12 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-400/30 transition-all'
                      : 'w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'"
                    placeholder="Enter new password (min 6 characters)">
                  <button 
                    type="button"
                    (click)="togglePassword('new')"
                    class="absolute right-4 top-11 text-gray-500 hover:text-primary transition-colors">
                    {{ showNewPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                  @if (isFieldInvalid(passwordForm, 'newPassword')) {
                    <p class="text-red-500 text-xs font-semibold mt-1">{{ getFieldError(passwordForm, 'newPassword') }}</p>
                  }
                </div>

                <!-- Confirm Password -->
                <div class="relative">
                  <label for="confirmPassword" class="block text-sm font-bold text-gray-700 mb-2">
                    Confirm New Password <span class="text-red-500">*</span>
                  </label>
                  <input 
                    id="confirmPassword"
                    formControlName="confirmPassword"
                    [type]="showConfirmPassword() ? 'text' : 'password'"
                    [class]="isFieldInvalid(passwordForm, 'confirmPassword')
                      ? 'w-full px-4 py-3 pr-12 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-400/30 transition-all'
                      : 'w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'"
                    placeholder="Re-enter new password">
                  <button 
                    type="button"
                    (click)="togglePassword('confirm')"
                    class="absolute right-4 top-11 text-gray-500 hover:text-primary transition-colors">
                    {{ showConfirmPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                  @if (isFieldInvalid(passwordForm, 'confirmPassword')) {
                    <p class="text-red-500 text-xs font-semibold mt-1">{{ getFieldError(passwordForm, 'confirmPassword') }}</p>
                  }
                </div>

                <!-- Password Requirements -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p class="text-xs font-bold text-blue-900 mb-2">Password Requirements:</p>
                  <ul class="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>At least 6 characters long</li>
                    <li>Both passwords must match</li>
                  </ul>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                <button 
                  type="submit"
                  [disabled]="isChangingPassword() || passwordForm.invalid"
                  class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  @if (isChangingPassword()) {
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Changing...
                  } @else {
                    <span>🔒</span>
                    Change Password
                  }
                </button>
                <button 
                  type="button"
                  (click)="setActiveTab('overview'); passwordForm.reset()"
                  class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminProfileComponent implements OnInit {
  // Signals
  activeTab = signal<'overview' | 'edit' | 'password'>('overview');
  isLoadingProfile = signal(false);
  isUpdatingProfile = signal(false);
  isChangingPassword = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  
  // Profile data
  profile = signal<ProfileData | null>(null);
  
  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  // Avatar upload
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Dependency injection
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private adminAuthService = inject(AdminAuthService);

  constructor() {
    // Initialize profile form
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{8,15}$/)]]
    });

    // Initialize password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoadingProfile.set(true);
    
    this.http.get<ProfileData>(`${environment.apiUrl}/users/me`).subscribe({
      next: (data) => {
        // Convert relative avatar URL to absolute if needed
        if (data.avatarUrl && !data.avatarUrl.startsWith('http')) {
          const backendHost = environment.apiUrl.replace('/api', '');
          data.avatarUrl = backendHost + data.avatarUrl;
          console.log('✓ Avatar URL converted to absolute:', data.avatarUrl);
        }
        
        this.profile.set(data);
        this.profileForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || ''
        });
        this.isLoadingProfile.set(false);
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.isLoadingProfile.set(false);
      }
    });
  }

  setActiveTab(tab: 'overview' | 'edit' | 'password'): void {
    this.activeTab.set(tab);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    this.isUpdatingProfile.set(true);

    console.log('🚀 Starting avatar upload for admin...');
    this.http.post(`${environment.apiUrl}/users/me/avatar`, formData).subscribe({
      next: (response: any) => {
        console.log('✅ Avatar upload successful:', response);
        
        // CRITICAL FIX: Update avatar in AdminAuthService
        // This synchronizes the avatar across all components (sidebar, navbar, profile)
        if (response?.url) {
          this.adminAuthService.updateUserAvatar(response.url);
          console.log('🔄 Avatar synchronized across all components');
        }
        
        alert('Avatar updated successfully');
        this.loadProfile();
        this.selectedFile = null;
        this.previewUrl = null;
        this.isUpdatingProfile.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to upload avatar:', error);
        alert('Failed to upload avatar: ' + (error.error?.message || error.message));
        this.isUpdatingProfile.set(false);
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isUpdatingProfile.set(true);
    const payload = this.profileForm.value;

    this.http.put(`${environment.apiUrl}/users/me`, payload).subscribe({
      next: () => {
        alert('Profile updated successfully');
        this.loadProfile();
        this.setActiveTab('overview');
        this.isUpdatingProfile.set(false);
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        alert(error.error?.message || 'Failed to update profile');
        this.isUpdatingProfile.set(false);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);
    const payload = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.http.post(`${environment.apiUrl}/users/me/password`, payload).subscribe({
      next: () => {
        alert('Password changed successfully');
        this.passwordForm.reset();
        this.setActiveTab('overview');
        this.isChangingPassword.set(false);
      },
      error: (error) => {
        console.error('Failed to change password:', error);
        alert(error.error?.error || 'Failed to change password');
        this.isChangingPassword.set(false);
      }
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Invalid email format';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['pattern']) return 'Invalid format';
    if (field.errors['passwordMismatch']) return 'Passwords do not match';

    return 'Invalid input';
  }

  getInitials(): string {
    const profile = this.profile();
    if (!profile) return 'AU';
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }

  togglePassword(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.showCurrentPassword.update(v => !v);
    } else if (field === 'new') {
      this.showNewPassword.update(v => !v);
    } else {
      this.showConfirmPassword.update(v => !v);
    }
  }
}

@Component({
    selector: 'app-moderation',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Content Moderation</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Review and moderate user-generated content</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Pending Review</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">12</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Approved Today</p>
            <p class="text-2xl font-bold text-green-800 mt-2">45</p>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600 font-medium">Rejected Today</p>
            <p class="text-2xl font-bold text-red-800 mt-2">3</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModerationComponent { }

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, ProductModal],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="relative bg-white rounded-2xl p-8 mb-8 overflow-hidden shadow-soft group">
        <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-primary/10"></div>
        <div class="relative z-10 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Marketplace Management</h1>
            <p class="text-gray-500">Review and moderate product listings</p>
          </div>
          <div class="flex gap-4">
            <button (click)="loadProducts()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all flex items-center gap-2">
              <span>🔄</span> Refresh
            </button>
            <button (click)="openAddModal()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <span>➕</span> Add Product
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
          <p class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Products</p>
          <p class="text-3xl font-black text-gray-900">{{ products().length }}</p>
        </div>
        <div class="bg-yellow-50 p-6 rounded-2xl shadow-soft border border-yellow-100">
          <p class="text-sm font-bold text-yellow-600 uppercase tracking-wider mb-2">Pending</p>
          <p class="text-3xl font-black text-yellow-700">{{ getPendingCount() }}</p>
        </div>
        <div class="bg-green-50 p-6 rounded-2xl shadow-soft border border-green-100">
          <p class="text-sm font-bold text-green-600 uppercase tracking-wider mb-2">Approved</p>
          <p class="text-3xl font-black text-green-700">{{ getApprovedCount() }}</p>
        </div>
        <div class="bg-red-50 p-6 rounded-2xl shadow-soft border border-red-100">
          <p class="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Rejected</p>
          <p class="text-3xl font-black text-red-700">{{ getRejectedCount() }}</p>
        </div>
      </div>

      <!-- Products Table -->
      <div class="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Product</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Category</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Price</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (product of products(); track product.id) {
                <tr class="hover:bg-gray-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                        <img [src]="product.imageUrl || 'assets/placeholder.png'" class="w-full h-full object-cover">
                      </div>
                      <div>
                        <p class="font-bold text-gray-900 group-hover:text-primary transition-colors">{{ product.name }}</p>
                        <p class="text-xs text-gray-500 truncate max-w-[200px]">{{ product.description }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                      {{ product.category }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-black text-gray-900">{{ product.price }} TND</td>
                  <td class="px-6 py-4">
                    <span [class]="getStatusClass(product.status)">
                      {{ product.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      @if (product.status === 'PENDING') {
                        <button (click)="approve(product.id)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all shadow-sm" title="Approve">
                          ✔️
                        </button>
                        <button (click)="reject(product.id)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-sm" title="Reject">
                          ✖️
                        </button>
                      }
                      <button (click)="openEditModal(product)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm" title="Edit">
                        ✏️
                      </button>
                      <button (click)="deleteProduct(product.id)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm" title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <span class="text-4xl opacity-20">📦</span>
                      <p class="text-gray-400 font-medium">No products found in the marketplace</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Modal -->
      @if (showModal()) {
        <app-product-modal 
          [mode]="modalMode"
          [product]="selectedProduct"
          [onClose]="closeModal"
          [onSave]="onModalSave">
        </app-product-modal>
      }
    </div>
  `,
  styles: [`
    .shadow-soft {
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.04);
    }
  `]
})
export class MarketplaceComponent implements OnInit {
  private productService = inject(ProductService);
  
  products = signal<Product[]>([]);
  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  selectedProduct = signal<Product | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllAdmin().subscribe({
      next: (data) => {
        this.products.set(data.map(p => this.mapProduct(p)));
      },
      error: (err) => console.error('Failed to load products', err)
    });
  }

  private mapProduct(product: any): Product {
    return {
      id: product.id || product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category || (product.categoryIds && product.categoryIds[0]) || 'Others',
      imageUrl: (product.images && product.images.length > 0) ? product.images[0].url || product.images[0] : 'assets/placeholder.png',
      sellerId: product.shopId || 'Unknown',
      sellerName: 'Marketplace Seller',
      rating: 4.5,
      reviewsCount: 12,
      stock: product.stock || 0,
      stockStatus: (product.stock || 0) > 0 ? 'IN_STOCK' as any : 'OUT_OF_STOCK' as any,
      condition: product.condition || 'NEW' as any,
      isNegotiable: product.isNegotiable || false,
      status: product.status || 'PENDING' as any
    };
  }

  getStatusClass(status: ProductStatus): string {
    const base = 'px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ';
    switch (status) {
      case 'APPROVED': return base + 'bg-green-100 text-green-600';
      case 'PENDING': return base + 'bg-yellow-100 text-yellow-600';
      case 'REJECTED': return base + 'bg-red-100 text-red-600';
      default: return base + 'bg-gray-100 text-gray-600';
    }
  }

  getPendingCount() { return this.products().filter(p => p.status === 'PENDING').length; }
  getApprovedCount() { return this.products().filter(p => p.status === 'APPROVED').length; }
  getRejectedCount() { return this.products().filter(p => p.status === 'REJECTED').length; }

  approve(id: string): void {
    this.productService.approveProduct(id).subscribe(() => this.loadProducts());
  }

  reject(id: string): void {
    this.productService.rejectProduct(id).subscribe(() => this.loadProducts());
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }

  openAddModal(): void {
    this.modalMode.set('add');
    this.selectedProduct.set(null);
    this.showModal.set(true);
  }

  openEditModal(product: Product): void {
    this.modalMode.set('edit');
    this.selectedProduct.set(product);
    this.showModal.set(true);
  }

  closeModal = () => { this.showModal.set(false); };
  onModalSave = () => { this.loadProducts(); };
}

@Component({
    selector: 'app-mobility',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Smart Mobility</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Track rides and manage vehicles</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Active Rides</p>
            <p class="text-2xl font-bold text-green-800 mt-2">23</p>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Available Vehicles</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">67</p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-sm text-purple-600 font-medium">Rides Today</p>
            <p class="text-2xl font-bold text-purple-800 mt-2">145</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MobilityComponent { }

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Orders & Transactions</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Manage orders and transactions</p>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Pending Orders</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">18</p>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Processing</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">34</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Completed Today</p>
            <p class="text-2xl font-bold text-green-800 mt-2">89</p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-sm text-purple-600 font-medium">Revenue Today</p>
            <p class="text-2xl font-bold text-purple-800 mt-2">$4.2K</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrdersComponent { }

@Component({
    selector: 'app-community',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Community Oversight</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Monitor community health and user reports</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600 font-medium">Open Reports</p>
            <p class="text-2xl font-bold text-red-800 mt-2">7</p>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Under Review</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">12</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Resolved Today</p>
            <p class="text-2xl font-bold text-green-800 mt-2">25</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CommunityComponent { }

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Notification Center</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Manage system notifications and announcements</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Sent Today</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">234</p>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Scheduled</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">15</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Delivery Rate</p>
            <p class="text-2xl font-bold text-green-800 mt-2">98.5%</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsComponent { }

@Component({
    selector: 'app-analytics',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Analytics & Reports</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">View analytics and generate reports</p>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Total Users</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">8,542</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Active Users</p>
            <p class="text-2xl font-bold text-green-800 mt-2">6,234</p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-sm text-purple-600 font-medium">Total Revenue</p>
            <p class="text-2xl font-bold text-purple-800 mt-2">$125.4K</p>
          </div>
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p class="text-sm text-orange-600 font-medium">Growth Rate</p>
            <p class="text-2xl font-bold text-orange-800 mt-2">+12.5%</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent { }

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">System Settings</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Configure system settings and preferences</p>
        <div class="space-y-4">
          <div class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">General Settings</h3>
            <p class="text-sm text-gray-600">Platform name, timezone, language preferences</p>
          </div>
          <div class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Security Settings</h3>
            <p class="text-sm text-gray-600">Authentication, password policies, session management</p>
          </div>
          <div class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Email Configuration</h3>
            <p class="text-sm text-gray-600">SMTP settings, email templates, notification preferences</p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">API Settings</h3>
            <p class="text-sm text-gray-600">API keys, rate limiting, webhook configurations</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent { }
