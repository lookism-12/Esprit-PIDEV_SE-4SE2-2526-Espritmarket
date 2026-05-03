import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService, RegisterRequest } from '../../core/auth.service';
import { UserRole, RoleGroup } from '../../models/user.model';
import { ThemeService } from '../../core/theme.service';

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
export class Register implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

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
      icon: '🛒'
      // No sub-roles - all clients have the same CLIENT role
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
  readonly deliveryZones = [
    'Grand Tunis',
    'Ariana',
    'Ben Arous',
    'Manouba',
    'Nabeul',
    'Bizerte',
    'Sousse',
    'Monastir',
    'Mahdia',
    'Sfax',
    'Kairouan',
    'Sidi Bouzid',
    'Kasserine',
    'Gafsa',
    'Gabes',
    'Medenine',
    'Tataouine',
    'Kebili',
    'Tozeur',
    'Beja',
    'Jendouba',
    'Kef',
    'Siliana',
    'Zaghouan'
  ];
  
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
        // All clients have the same CLIENT role
        return UserRole.CLIENT;
      case 'provider':
        return UserRole.PROVIDER;
      case 'logistics':
        return subRole ? UserRole[subRole as keyof typeof UserRole] : UserRole.DRIVER;
      default:
        return null;
    }
  });

  constructor() {
    this.registerForm = this.createBaseForm();
  }

  ngOnInit(): void {
    // Initialize theme if needed
  }

  /**
   * Create the base form with all possible fields
   */
  private createBaseForm(): FormGroup {
    return this.fb.group({
      // Common fields
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],

      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      address: [''],
      
      // Provider fields
      businessName: [''],
      businessType: [''],
      taxId: [''],
      description: [''],
      
      // Logistics fields
      drivingLicenseNumber: [''],
      vehicleType: [''],
      deliveryZone: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // ==================== STEP NAVIGATION ====================

  /**
   * Go back to step 1 (role selection)
   */
  goToStep1(): void {
    this.currentStep.set(1);
    this.errorMessage.set(null);
  }

  /**
   * Go forward to step 2 (form details)
   * Only allowed if a role group is selected
   */
  goToStep2(): void {
    if (!this.selectedRoleGroup()) {
      this.errorMessage.set('Please select a role to continue');
      return;
    }
    
    // Update form validators based on selected role
    this.updateFormValidators();
    
    this.currentStep.set(2);
    this.errorMessage.set(null);
  }

  // ==================== ROLE SELECTION ====================

  /**
   * Select a role group (client, provider, logistics)
   */
  selectRoleGroup(roleId: RoleGroup): void {
    this.selectedRoleGroup.set(roleId);
    
    // Reset sub-role when changing role group
    this.selectedSubRole.set(null);
    
    // Auto-select sub-role if only one option or no sub-roles
    const card = this.roleCards.find(c => c.id === roleId);
    if (card && !card.subRoles) {
      // No sub-roles, use default based on role
      if (roleId === 'client') {
        this.selectedSubRole.set('CLIENT');
      } else if (roleId === 'provider') {
        this.selectedSubRole.set('PROVIDER');
      }
    } else if (card && card.subRoles && card.subRoles.length === 1) {
      // Only one sub-role, auto-select it
      this.selectedSubRole.set(card.subRoles[0].value);
    }
  }

  /**
   * Select a sub-role (CLIENT, PASSENGER, DRIVER, DELIVERY)
   */
  selectSubRole(subRole: string): void {
    this.selectedSubRole.set(subRole);
  }

  // ==================== FORM VALIDATION ====================

  /**
   * Update form validators based on selected role
   */
  private updateFormValidators(): void {
    const group = this.selectedRoleGroup();
    
    // Reset all optional field validators
    this.registerForm.get('businessName')?.clearValidators();
    this.registerForm.get('businessType')?.clearValidators();
    this.registerForm.get('taxId')?.clearValidators();
    this.registerForm.get('drivingLicenseNumber')?.clearValidators();
    this.registerForm.get('vehicleType')?.clearValidators();
    this.registerForm.get('deliveryZone')?.clearValidators();
    
    // Add validators based on role
    if (group === 'provider') {
      this.registerForm.get('businessName')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.registerForm.get('businessType')?.setValidators([Validators.required]);
      this.registerForm.get('taxId')?.setValidators([Validators.required]);
    }
    
    if (group === 'logistics') {
      const subRole = this.selectedSubRole();
      if (subRole === 'DRIVER') {
        this.registerForm.get('drivingLicenseNumber')?.setValidators([Validators.required]);
      }
      if (subRole === 'DELIVERY') {
        this.registerForm.get('deliveryZone')?.setValidators([Validators.required]);
      }
      this.registerForm.get('vehicleType')?.setValidators([Validators.required]);
    }
    
    // Update validity
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * Check if a form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // ==================== PASSWORD VISIBILITY ====================

  /**
   * Toggle password visibility
   */
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  // ==================== FORM SUBMISSION ====================

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Clear previous error
    this.errorMessage.set(null);
    
    // Mark all fields as touched to show validation errors
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
    
    // Check if form is valid
    if (this.registerForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }
    
    // Check if passwords match
    if (this.registerForm.hasError('passwordMismatch')) {
      this.errorMessage.set('Passwords do not match');
      return;
    }
    
    // Check if role is selected
    const role = this.finalBackendRole();
    if (!role) {
      this.errorMessage.set('Please select a role');
      return;
    }
    
    // Prepare registration request
    const formValue = this.registerForm.value;
    const registerRequest: RegisterRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone,

      role: role,
      address: formValue.address || undefined,
      businessName: formValue.businessName || undefined,
      businessType: formValue.businessType || undefined,
      taxId: formValue.taxId || undefined,
      description: formValue.description || undefined,
      drivingLicenseNumber: formValue.drivingLicenseNumber || undefined,
      vehicleType: formValue.vehicleType || undefined,
      deliveryZone: role === UserRole.DELIVERY ? formValue.deliveryZone || undefined : undefined
    };
    
    // Submit registration
    this.isSubmitting.set(true);
    
    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.isSubmitting.set(false);
        
        // Redirect to login or dashboard
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        console.error('❌ Registration failed:', error);
        this.isSubmitting.set(false);
        
        // Display error message
        if (error.status === 409) {
          this.errorMessage.set('Email already exists. Please use a different email.');
        } else if (error.status === 400) {
          this.errorMessage.set(error.error?.message || 'Invalid registration data. Please check your inputs.');
        } else if (error.status === 500) {
          this.errorMessage.set('Server error. Please try again later.');
        } else {
          this.errorMessage.set('Registration failed. Please try again.');
        }
      }
    });
  }
}
