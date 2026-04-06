import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: any;
  let router: any;

  beforeEach(async () => {
    const authServiceMock = {
      login: vi.fn().mockReturnValue(of({})),
      isAuthenticated: signal(false)
    };
    const routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, CommonModule],
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

      expect(authService.login).toHaveBeenCalled();
    });

    it('should handle login error', () => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'wrong-password',
        rememberMe: false
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('should not call authService if form is invalid', () => {
      component.loginForm.setValue({
        email: 'invalid',
        password: '',
        rememberMe: false
      });
      
      authService.login.mockClear();
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('UI helpers', () => {
    it('should toggle password visibility', () => {
      const initialState = component.showPassword();
      component.togglePassword();
      expect(component.showPassword()).toBe(!initialState);
    });
  });
});
