import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { CommonModule } from '@angular/common';

const activatedRouteMock = {
  queryParams: of({})
};

const routerMock = {
  navigate: vi.fn()
};

const authServiceMock = {
  login: vi.fn().mockReturnValue(of({})),
  isAuthenticated: signal(false)
};

const toastServiceMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: typeof authServiceMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    authServiceMock.login.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it('should validate email format', () => {
      const email = component.loginForm.get('email');
      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);

      email?.setValue('test@example.com');
      expect(email?.hasError('email')).toBe(false);
    });

    it('should require password', () => {
      const password = component.loginForm.get('password');
      password?.setValue('');
      expect(password?.hasError('required')).toBe(true);

      password?.setValue('password123');
      expect(password?.hasError('required')).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should call authService.login on valid submit', () => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should set isLoading to false and errorMessage on login error', () => {
      authServiceMock.login.mockReturnValue(throwError(() => new Error('Unauthorized')));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'wrong-password',
        rememberMe: false
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeTruthy();
    });

    it('should not call authService if form is invalid', () => {
      component.loginForm.setValue({
        email: 'invalid',
        password: '',
        rememberMe: false
      });

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.onSubmit();
      expect(component.loginForm.get('email')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });
  });

  describe('UI helpers', () => {
    it('should toggle password visibility', () => {
      expect(component.showPassword()).toBe(false);
      component.togglePassword();
      expect(component.showPassword()).toBe(true);
      component.togglePassword();
      expect(component.showPassword()).toBe(false);
    });

    it('should return correct field error messages', () => {
      const email = component.loginForm.get('email');
      email?.setValue('');
      email?.markAsTouched();
      expect(component.getFieldError('email')).toBe('This field is required');

      email?.setValue('bad');
      expect(component.getFieldError('email')).toBe('Please enter a valid email');
    });

    it('should return true for isFieldInvalid when field is touched and invalid', () => {
      const email = component.loginForm.get('email');
      email?.setValue('bad');
      email?.markAsTouched();
      expect(component.isFieldInvalid('email')).toBe(true);
    });
  });
});
