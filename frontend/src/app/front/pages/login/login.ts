import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb           = inject(FormBuilder);
  private router       = inject(Router);
  private route        = inject(ActivatedRoute);
  private authService  = inject(AuthService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);

  loginForm: FormGroup;
  showPassword      = signal(false);
  isLoading         = signal(false);
  errorMessage      = signal<string | null>(null);
  loginPromptMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // ── Query-param messages ──────────────────────────────────────────────
    this.route.queryParams.subscribe(params => {
      if (params['message'] === 'login-to-purchase') {
        this.loginPromptMessage.set('Please log in to continue with your purchase');
      }
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

    if (field.errors['required'])  return 'This field is required';
    if (field.errors['email'])     return 'Please enter a valid email';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;

    return 'Invalid input';
  }

  onSubmit(): void {
    console.log('🚀 Login form submitted');
    console.log('📝 Form valid:', this.loginForm.valid);

    if (this.loginForm.invalid) {
      console.warn('⚠️ Form is invalid, marking all fields as touched');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password, rememberMe } = this.loginForm.value;

    console.log('📧 Logging in with email:', email);

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('✅ Login successful:', response);
        this.isLoading.set(false);

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        // Handle pending purchase after successful login
        this.handlePostLoginActions();

        this.toastService.success('Welcome back! Login successful');
        // ✅ AuthService handles role-based redirection
      },
      error: (error) => {
        console.error('❌ Login failed:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Invalid email or password. Please try again.');
        this.toastService.error('Login failed. Please check your credentials.');
      }
    });
  }

  /**
   * Handle actions after successful login.
   * Checks for a pending purchase or a returnUrl query param.
   */
  private handlePostLoginActions(): void {
    const pendingPurchase = sessionStorage.getItem('pendingPurchase');
    if (pendingPurchase) {
      try {
        const purchaseData = JSON.parse(pendingPurchase);
        console.log('📦 Found pending purchase:', purchaseData);
        sessionStorage.removeItem('pendingPurchase');
        this.toastService.info(`Redirecting you to ${purchaseData.productName}...`, 3000);
        setTimeout(() => {
          this.router.navigate(['/product', purchaseData.productId]);
        }, 1000);
        return;
      } catch (error) {
        console.error('Error parsing pending purchase:', error);
      }
    }

    this.route.queryParams.subscribe(params => {
      const returnUrl = params['returnUrl'];
      if (returnUrl) {
        console.log('🔄 Redirecting to return URL:', returnUrl);
        setTimeout(() => {
          this.router.navigate([returnUrl]);
        }, 1000);
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
