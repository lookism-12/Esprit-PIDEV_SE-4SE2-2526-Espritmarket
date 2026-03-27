import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService, RegisterRequest } from '../../core/auth.service';
import { UserRole, RoleGroup } from '../../models/user.model';

interface RoleCard {
  id: RoleGroup;
  title: string;
  description: string;
  icon: string;
  subRoles?: { value: string; label: string }[];
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  // Step management
  // Step management
  currentStep = signal<1 | 2 | 3 | 4>(1);
  
  // Role selection
  selectedRoleGroup = signal<RoleGroup | null>(null);
  selectedSubRole = signal<string | null>(null);
  
  // Form
  registerForm: FormGroup;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Role cards configuration
  readonly roleCards: RoleCard[] = [
    {
      id: 'client',
      title: 'Client',
      description: 'Buy products, book rides, and manage your marketplace activities.',
      icon: '🛒'
    },
    {
      id: 'provider',
      title: 'Provider',
      description: 'Sell products or services and manage your business.',
      icon: '🏪'
    },
    {
      id: 'logistics',
      title: 'Logistics',
      description: 'Offer transportation or delivery services.',
      icon: '🚚'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      phone: ['12345678'], // Default for testing to avoid UI complexity in this task
      firstName: [''], // Will be derived from 'name'
      lastName: ['']
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  nextStep(): void {
    const current = this.currentStep();
    
    // Step 2 validation before moving to Step 3
    if (current === 2) {
      const nameField = this.registerForm.get('name');
      const emailField = this.registerForm.get('email');
      if (nameField?.invalid || emailField?.invalid) {
        nameField?.markAsTouched();
        emailField?.markAsTouched();
        return;
      }
    }
    
    // Step 3 validation before moving to Step 4
    if (current === 3) {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        return;
      }
    }

    if (current < 4) {
      this.currentStep.set((current + 1) as 1 | 2 | 3 | 4);
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set((current - 1) as 1 | 2 | 3 | 4);
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }
  
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['passwordMismatch']) return 'Passwords do not match';
    
    return 'Invalid input';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  finalBackendRole = computed(() => {
    const group = this.selectedRoleGroup();
    if (group === 'provider') return UserRole.PROVIDER;
    if (group === 'logistics') return UserRole.DRIVER;
    return UserRole.CLIENT;
  });

  isLoading = signal(false);

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    
    const formValue = this.registerForm.value;
    const nameParts = formValue.name.split(' ');
    
    const payload: RegisterRequest = {
      email: formValue.email,
      password: formValue.password,
      firstName: nameParts[0] || 'User',
      lastName: nameParts.slice(1).join(' ') || 'Esprit',
      phone: formValue.phone,
      role: this.finalBackendRole()
    };
    
    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message || 'Registration failed.');
      }
    });
  }

  loginWithGoogle(): void {
    console.log('Google registration initiated');
  }

  loginWithGithub(): void {
    console.log('GitHub registration initiated');
  }

  loginWithFacebook(): void {
    console.log('Facebook registration initiated');
  }
}
