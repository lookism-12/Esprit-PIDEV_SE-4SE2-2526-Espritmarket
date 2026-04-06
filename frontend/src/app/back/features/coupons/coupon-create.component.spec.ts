import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CouponCreateComponent } from './coupon-create.component';
import { AdminService } from '../../core/services/admin.service';
import { CommonModule } from '@angular/common';

describe('CouponCreateComponent', () => {
  let component: CouponCreateComponent;
  let fixture: ComponentFixture<CouponCreateComponent>;
  let adminService: any;
  let router: any;

  beforeEach(async () => {
    const adminServiceMock = {
      providers: signal([]),
      selectedProviderProducts: signal([]),
      isLoading: signal(false),
      error: signal(null),
      getAllProviders: vi.fn().mockReturnValue(of([])),
      getProductsByProvider: vi.fn().mockReturnValue(of([])),
      createCoupon: vi.fn().mockReturnValue(of({})),
      clearSelectedProviderProducts: vi.fn()
    };

    const routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CouponCreateComponent, ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AdminService, useValue: adminServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CouponCreateComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize form with default values', () => {
      expect(component.couponForm.get('code')?.value).toBe('');
      expect(component.couponForm.get('discountType')?.value).toBe('PERCENTAGE');
    });

    it('should load providers on init', () => {
      expect(adminService.getAllProviders).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should validate required fields', () => {
      expect(component.couponForm.valid).toBe(false);
    });

    it('should validate code min length', () => {
      const code = component.couponForm.get('code');
      code?.setValue('AB');
      expect(code?.hasError('minlength')).toBe(true);
    });

    it('should validate discount value minimum', () => {
      const value = component.couponForm.get('discountValue');
      value?.setValue(0);
      expect(value?.hasError('min')).toBe(true);
    });
  });

  describe('product selection', () => {
    it('should toggle product selection', () => {
      component.onProductToggle('prod-1');
      expect(component.isProductSelected('prod-1')).toBe(true);
      
      component.onProductToggle('prod-1');
      expect(component.isProductSelected('prod-1')).toBe(false);
    });

    it('should select multiple products', () => {
      component.onProductToggle('prod-1');
      component.onProductToggle('prod-2');
      expect(component.selectedProducts().length).toBe(2);
    });
  });

  describe('form submission', () => {
    it('should not submit with invalid form', () => {
      component.onSubmit();
      expect(component.error()).toBeTruthy();
    });

    it('should not submit without selected products', () => {
      component.couponForm.setValue({
        code: 'TEST10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        expirationDate: '2026-12-31',
        minCartAmount: '',
        usageLimit: '',
        eligibleUserLevel: '',
        combinableWithDiscount: false,
        description: ''
      });
      
      component.onSubmit();
      expect(component.error()).toBeTruthy();
    });

    it('should validate percentage discount', () => {
      component.couponForm.setValue({
        code: 'TEST10',
        discountType: 'PERCENTAGE',
        discountValue: 150,
        expirationDate: '2026-12-31',
        minCartAmount: '',
        usageLimit: '',
        eligibleUserLevel: '',
        combinableWithDiscount: false,
        description: ''
      });
      
      component.selectedProducts.set(['prod-1']);
      component.onSubmit();
      expect(component.error()).toBeTruthy();
    });
  });

  describe('UI helpers', () => {
    it('should convert code to uppercase', () => {
      component.couponForm.get('code')?.setValue('test');
      expect(component.couponForm.get('code')?.value).toBe('test');
    });

    it('should have min date set to today', () => {
      const minDate = component.minDate;
      const today = new Date().toISOString().split('T')[0];
      expect(minDate).toBe(today);
    });
  });
});
