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
  styleUrl: './register.scss', // v2 dark design
})
export class Register {
  // Step management
  currentStep = signal<1 | 2>(1);
  
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
      icon: '🛒',
      subRoles: [
        { value: 'CLIENT', label: 'Marketplace Buyer' },
        { value: 'PASSENGER', label: 'Ride Passenger' }
      ]
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
      icon: '🚚',
      subRoles: [
        { value: 'DRIVER', label: 'Driver' },
        { value: 'DELIVERY', label: 'Delivery Agent' }
      ]
    }
  ];

  // Vehicle types for driver/delivery
  readonly vehicleTypes = ['Car', 'Motorcycle', 'Bicycle', 'Van', 'Truck'];
  
  // Business types for provider
  readonly businessTypes = ['Retail', 'Wholesale', 'Services', 'Food & Beverage', 'Electronics', 'Fashion', 'Other'];

  // Computed: get current role card
  currentRoleCard = computed(() => {
    const group = this.selectedRoleGroup();
    return this.roleCards.find(card => card.id === group) || null;
  });

  // Computed: determine final backend role
  finalBackendRole = computed((): UserRole | null => {
    const group = this.selectedRoleGroup();
    const subRole = this.selectedSubRole();
    
    if (!group) return null;
    
    switch (group) {
      case 'client':
        return subRole ? UserRole[subRole as keyof typeof UserRole] : UserRole.CLIENT;
      case 'provider':
        return UserRole.PROVIDER;
      case 'logistics':
        return subRole ? UserRole[subRole as keyof typeof UserRole] : UserRole.DRIVER;
      default:
        return null;
    }
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.createBaseForm();
  }

  private createBaseForm(): FormGroup {
    return this.fb.group({
      // Common fields
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      
      // Client fields
      address: [''],
      
      // Provider fields
      businessName: [''],
      businessType: [''],
      taxId: [''],
      description: [''],
      
      // Driver fields
      drivingLicenseNumber: [''],
      
      // Logistics fields (shared)
      vehicleType: [''],
      
      // Delivery fields
      deliveryZone: ['']
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

  selectRoleGroup(roleGroup: RoleGroup): void {
    this.selectedRoleGroup.set(roleGroup);
    
    // Set default sub-role if available
    const card = this.roleCards.find(c => c.id === roleGroup);
    if (card?.subRoles && card.subRoles.length > 0) {
      this.selectedSubRole.set(card.subRoles[0].value);
    } else {
      this.selectedSubRole.set(null);
    }
    
    // Update form validators based on role
    this.updateFormValidators();
  }

  selectSubRole(subRole: string): void {
    this.selectedSubRole.set(subRole);
    this.updateFormValidators();
  }

  private updateFormValidators(): void {
    const group = this.selectedRoleGroup();
    const subRole = this.selectedSubRole();
    
    // Reset all role-specific validators
    this.registerForm.get('address')?.clearValidators();
    this.registerForm.get('businessName')?.clearValidators();
    this.registerForm.get('businessType')?.clearValidators();
    this.registerForm.get('taxId')?.clearValidators();
    this.registerForm.get('drivingLicenseNumber')?.clearValidators();
    this.registerForm.get('vehicleType')?.clearValidators();
    this.registerForm.get('deliveryZone')?.clearValidators();
    
    // Apply validators based on role
    switch (group) {
      case 'client':
        // Address is optional for clients
        break;
        
      case 'provider':
        this.registerForm.get('businessName')?.setValidators([Validators.required, Validators.minLength(2)]);
        this.registerForm.get('businessType')?.setValidators([Validators.required]);
        this.registerForm.get('taxId')?.setValidators([Validators.required, Validators.minLength(5)]);
        break;
        
      case 'logistics':
        this.registerForm.get('vehicleType')?.setValidators([Validators.required]);
        if (subRole === 'DRIVER') {
          this.registerForm.get('drivingLicenseNumber')?.setValidators([Validators.required, Validators.minLength(5)]);
        } else if (subRole === 'DELIVERY') {
          this.registerForm.get('deliveryZone')?.setValidators([Validators.required]);
        }
        break;
    }
    
    // Update validity
    this.registerForm.get('address')?.updateValueAndValidity();
    this.registerForm.get('businessName')?.updateValueAndValidity();
    this.registerForm.get('businessType')?.updateValueAndValidity();
    this.registerForm.get('taxId')?.updateValueAndValidity();
    this.registerForm.get('drivingLicenseNumber')?.updateValueAndValidity();
    this.registerForm.get('vehicleType')?.updateValueAndValidity();
    this.registerForm.get('deliveryZone')?.updateValueAndValidity();
  }

  goToStep2(): void {
    if (this.selectedRoleGroup()) {
      this.currentStep.set(2);
    }
  }

  goToStep1(): void {
    this.currentStep.set(1);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    if (field.errors['pattern']) return 'Invalid format';
    if (field.errors['passwordMismatch']) return 'Passwords do not match';
    
    return 'Invalid input';
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.finalBackendRole()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    
    const formValue = this.registerForm.value;
    const backendRole = this.finalBackendRole()!;
    
    // Build payload based on role
    const payload: RegisterRequest = this.buildPayload(formValue, backendRole);
    
    console.log('Registration payload:', payload);
    
    this.authService.register(payload).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.isSubmitting.set(false);
        this.errorMessage.set(null);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('❌ Registration failed:', error);
        this.isSubmitting.set(false);
        
        // Extract error message from backend response
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else if (error.error?.fieldErrors) {
          // Handle validation errors
          const fieldErrors = error.error.fieldErrors;
          const errorMsg = Object.values(fieldErrors).join(', ');
          this.errorMessage.set(errorMsg as string);
        } else if (error.status === 409) {
          this.errorMessage.set('This email is already registered. Please use a different email or login.');
        } else if (error.status === 400) {
          this.errorMessage.set('Invalid registration data. Please check your input.');
        } else {
          this.errorMessage.set('Registration failed. Please try again.');
        }
      }
    });
  }

  private buildPayload(formValue: any, role: UserRole): RegisterRequest {
    const base = {
      email: formValue.email,
      password: formValue.password,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
      role: role
    };

    switch (role) {
      case UserRole.CLIENT:
      case UserRole.PASSENGER:
        return { ...base, address: formValue.address || undefined };
        
      case UserRole.PROVIDER:
        return {
          ...base,
          businessName: formValue.businessName,
          businessType: formValue.businessType,
          taxId: formValue.taxId,
          description: formValue.description || undefined
        };
        
      case UserRole.DRIVER:
        return {
          ...base,
          drivingLicenseNumber: formValue.drivingLicenseNumber,
          vehicleType: formValue.vehicleType
        };
        
      case UserRole.DELIVERY:
        return {
          ...base,
          vehicleType: formValue.vehicleType,
          deliveryZone: formValue.deliveryZone
        };
        
      default:
        return base as RegisterRequest;
    }
  }
}
