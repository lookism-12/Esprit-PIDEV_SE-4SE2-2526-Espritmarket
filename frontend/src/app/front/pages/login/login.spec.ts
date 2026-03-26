import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../core/auth.service';
import { User, UserRole } from '../../models/user.model';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: '<form [formGroup]="loginForm"></form>'
})
class MockLogin extends Login {}

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: any;
  let router: any;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLIENT,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const authServiceMock = {
      login: vi.fn(),
      isAuthenticated: signal(false)
    };
    const routerMock = {
      navigate: vi.fn()
    };

    TestBed.overrideComponent(Login, {
      set: {
        template: '<form [formGroup]="loginForm"></form>',
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

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
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
      const email = component.loginForm.controls['email'];
      email.setValue('invalid-email');
      expect(email.errors?.['email']).toBeTruthy();
      
      email.setValue('test@example.com');
      expect(email.errors).toBeNull();
    });

    it('should require password', () => {
      const password = component.loginForm.controls['password'];
      password.setValue('');
      expect(password.errors?.['required']).toBeTruthy();
    });
  });

  describe('onSubmit', () => {
    it('should call authService.login on valid submit', () => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });
      authService.login.mockReturnValue(of(mockUser));

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(component.isLoading()).toBe(false);
    });

    it('should handle login error', () => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'wrong-password',
        rememberMe: false
      });
      authService.login.mockReturnValue(throwError(() => ({ status: 401 })));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Invalid email or password. Please try again.');
      expect(component.isLoading()).toBe(false);
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
  });

  describe('UI helpers', () => {
    it('should toggle password visibility', () => {
      expect(component.showPassword()).toBe(false);
      component.togglePassword();
      expect(component.showPassword()).toBe(true);
    });
  });
});
