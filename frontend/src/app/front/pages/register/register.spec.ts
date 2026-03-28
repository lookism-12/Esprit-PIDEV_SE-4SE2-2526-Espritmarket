import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

if (!getTestBed().platform) {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
}
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Register } from './register';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';


describe('Register Component', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authService: any;
  let router: any;

  beforeEach(async () => {
    const authServiceMock = {
      register: vi.fn(),
      isAuthenticated: signal(false)
    };
    const routerMock = {
      navigate: vi.fn()
    };

    TestBed.overrideComponent(Register, {
      set: {
        template: '<div>Mock Template</div>', // Simple template for tests
        styles: [],
        imports: [ReactiveFormsModule, CommonModule]
      }
    });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Step Management', () => {
    it('should start at step 1', () => {
      expect(component.currentStep()).toBe(1);
    });

    it('should go to step 2 when role selected', () => {
      component.selectRoleGroup('client');
      component.goToStep2();
      expect(component.currentStep()).toBe(2);
    });

    it('should not go to step 2 if no role selected', () => {
      component.goToStep2();
      expect(component.currentStep()).toBe(1);
    });
  });

  describe('Form Validation - Role Based', () => {
    beforeEach(() => {
      component.selectRoleGroup('provider'); // Step 2 fields depend on role
    });

    it('should require businessName for provider', () => {
      const control = component.registerForm.get('businessName');
      control?.setValue('');
      expect(control?.errors?.['required']).toBeTruthy();
      
      control?.setValue('My Shop');
      expect(control?.errors).toBeNull();
    });

    it('should require taxId for provider', () => {
      const control = component.registerForm.get('taxId');
      control?.setValue('123'); // too short (minLength 5)
      expect(control?.errors?.['minlength']).toBeTruthy();
    });

    it('should validate password match', () => {
      component.registerForm.get('password')?.setValue('pass1234');
      component.registerForm.get('confirmPassword')?.setValue('different');
      
      expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();
      expect(component.registerForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTruthy();
    });
  });

  describe('onSubmit', () => {
    it('should build correct payload and call authService.register', () => {
      component.selectRoleGroup('client');
      component.registerForm.patchValue({
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '12345678',
        address: 'Tunis'
      });
      
      authService.register.mockReturnValue(of({ success: true }));

      component.onSubmit();

      expect(authService.register).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@example.com',
        role: UserRole.CLIENT,
        address: 'Tunis'
      }));
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle registration error', () => {
      component.selectRoleGroup('client');
      component.registerForm.patchValue({
        email: 'error@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Error',
        lastName: 'User',
        phone: '12345678'
      });
      
      const errorResponse = { status: 409, error: { message: 'Email exists' } };
      authService.register.mockReturnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Email exists');
      expect(component.isSubmitting()).toBe(false);
    });
  });
});
