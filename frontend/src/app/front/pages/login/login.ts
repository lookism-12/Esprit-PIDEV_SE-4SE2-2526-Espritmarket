import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
<div class="min-h-[calc(100vh-144px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#f8f9fa] via-[#ffffff] to-[#f0f2f5]">
    <div class="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        <div class="w-full lg:w-[520px]">
            <div class="glass-card rounded-[32px] p-6 sm:p-10 bg-white/80 backdrop-blur-xl border border-white/50">
                <div class="relative z-10">
                    <div class="mb-8 text-center lg:text-left">
                        <h1 class="text-2xl sm:text-3xl font-black text-dark mb-3">Welcome Back</h1>
                        <p class="text-secondary font-semibold text-sm">Sign in to continue your journey</p>
                    </div>
                    @if (errorMessage()) {
                        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
                            {{ errorMessage() }}
                        </div>
                    }
                    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
                        <div>
                            <label for="email" class="block text-xs font-bold text-gray-600 uppercase mb-2">Email Address</label>
                            <input id="email" formControlName="email" type="email" placeholder="username@esprit.tn"
                                [class]="isFieldInvalid('email') ? 'w-full h-12 bg-white border-2 border-red-400 rounded-xl px-4' : 'w-full h-12 bg-white/90 border-2 border-transparent rounded-xl px-4 shadow-sm'">
                            @if (isFieldInvalid('email')) {
                                <p class="text-red-500 text-xs font-semibold mt-2">{{ getFieldError('email') }}</p>
                            }
                        </div>
                        <div class="relative">
                            <label for="password" class="block text-xs font-bold text-gray-600 uppercase mb-2">Password</label>
                            <input id="password" formControlName="password" [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                                [class]="isFieldInvalid('password') ? 'w-full h-12 bg-white border-2 border-red-400 rounded-xl px-4' : 'w-full h-12 bg-white/90 border-2 border-transparent rounded-xl px-4 shadow-sm'">
                            <button type="button" (click)="togglePassword()" class="absolute right-4 top-9 text-gray-500 hover:text-primary p-1">
                                {{ showPassword() ? 'Hide' : 'Show' }}
                            </button>
                            @if (isFieldInvalid('password')) {
                                <p class="text-red-500 text-xs font-semibold mt-2">{{ getFieldError('password') }}</p>
                            }
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <div class="flex items-center">
                                <input id="remember-me" formControlName="rememberMe" type="checkbox" class="h-5 w-5 text-primary rounded">
                                <label for="remember-me" class="ml-3 text-sm text-gray-600 font-semibold">Remember me</label>
                            </div>
                        </div>
                        <button type="submit" [disabled]="isLoading()" class="w-full h-12 bg-primary text-white rounded-xl font-black text-lg hover:shadow-xl transition-all disabled:opacity-70">
                            {{ isLoading() ? 'Signing in...' : 'Sign in' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
  `,
  styles: [],
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]], // No minLength for login
      rememberMe: [false]
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field?.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    
    return 'Invalid input';
  }

  onSubmit(): void {
    console.log('🚀 Login form submitted');
    console.log('📝 Form valid:', this.loginForm.valid);
    console.log('📝 Form value:', this.loginForm.value);
    
    if (this.loginForm.invalid) {
      console.warn('⚠️ Form is invalid, marking all fields as touched');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password, rememberMe } = this.loginForm.value;
    
    console.log('📧 Logging in with email:', email);
    console.log('🔒 Password length:', password?.length || 0);

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('✅ Login successful:', response);
        this.isLoading.set(false);
        
        // Store remember me preference if needed
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // ✅ AuthService handles role-based redirection
        // No need to navigate here
      },
      error: (error) => {
        console.error('❌ Login failed:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Invalid email or password. Please try again.');
      }
    });
  }

  loginWithGoogle(): void {
    console.log('Google login initiated');
    // TODO: Implement OAuth
  }

  loginWithGithub(): void {
    console.log('GitHub login initiated');
    // TODO: Implement OAuth
  }

  loginWithFacebook(): void {
    console.log('Facebook login initiated');
    // TODO: Implement OAuth
  }
}
