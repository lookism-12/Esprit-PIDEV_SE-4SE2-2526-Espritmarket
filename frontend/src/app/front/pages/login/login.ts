import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `<div>Temporary Mock Template</div>`,
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
