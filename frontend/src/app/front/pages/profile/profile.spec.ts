import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from './profile';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../../core/user.service';
import { OrderService } from '../../core/order.service';
import { LoyaltyService } from '../../core/loyalty.service';

describe('Profile Component', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let authService: any;
  let userService: any;

  beforeEach(async () => {
    const authServiceMock = {
      userId: signal('user-1'),
      userFirstName: signal('John'),
      userLastName: signal('Doe'),
      userEmail: signal('john@example.com'),
      userAvatar: signal(''),
      userRole: signal('CLIENT'),
      isAuthenticated: signal(true)
    };

    const userServiceMock = {
      updateProfile: vi.fn().mockReturnValue(of({}))
    };

    const orderServiceMock = {
      getMyOrders: vi.fn().mockReturnValue(of([]))
    };

    const loyaltyServiceMock = {
      getAccount: vi.fn().mockReturnValue(of({
        id: 'mock',
        userId: 'user-1',
        points: 0,
        lifetimePoints: 0,
        level: 'BRONZE',
        nextLevelPoints: 1000,
        pointsToNextLevel: 1000,
        benefits: [],
        history: [],
        memberSince: new Date(),
        updatedAt: new Date()
      }))
    };

    const activatedRouteMock = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [Profile, ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: OrderService, useValue: orderServiceMock },
        { provide: LoyaltyService, useValue: loyaltyServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with user data from AuthService', () => {
      expect(component.user().firstName).toBe('John');
      expect(component.user().lastName).toBe('Doe');
      expect(component.user().email).toBe('john@example.com');
    });
  });

  describe('Tab Management', () => {
    it('should change active tab when setActiveTab is called', () => {
      component.setActiveTab('loyalty');
      expect(component.activeTab()).toBe('loyalty');
    });
  });

  describe('Profile Update', () => {
    it('should not save if form is invalid', () => {
      component.profileForm.get('firstName')?.setValue('');
      component.saveProfile();
      expect(userService.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Loyalty Progress', () => {
    it('should calculate loyalty progress correctly', () => {
      const progress = component.loyaltyProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('Status helpers', () => {
    it('should return correct status class', () => {
      const statusClass = component.getStatusClass('PENDING');
      expect(statusClass).toContain('yellow');
    });

    it('should return correct status label', () => {
      const label = component.getStatusLabel('PENDING');
      expect(label).toBe('Pending');
    });
  });

  describe('Loyalty level helpers', () => {
    it('should return correct level badge class', () => {
      const badge = component.getLevelBadgeClass('BRONZE');
      expect(badge).toContain('amber');
    });

    it('should return correct level icon', () => {
      const icon = component.getLevelIcon('BRONZE');
      expect(icon).toBe('🥉');
    });
  });
});
