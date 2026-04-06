import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOrdersComponent } from './orders.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

describe('AdminOrdersComponent', () => {
  let component: AdminOrdersComponent;
  let fixture: ComponentFixture<AdminOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrdersComponent, CommonModule, RouterLink]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with orders tab', () => {
      expect(component.activeTab()).toBe('orders');
    });

    it('should have mock orders', () => {
      expect(component.orders().length).toBe(3);
    });

    it('should have mock transactions', () => {
      expect(component.transactions().length).toBe(3);
    });
  });

  describe('tab navigation', () => {
    it('should set active tab to orders', () => {
      component.setActiveTab('orders');
      expect(component.activeTab()).toBe('orders');
    });

    it('should set active tab to transactions', () => {
      component.setActiveTab('transactions');
      expect(component.activeTab()).toBe('transactions');
    });

    it('should set active tab to coupons', () => {
      component.setActiveTab('coupons');
      expect(component.activeTab()).toBe('coupons');
    });
  });

  describe('order statistics', () => {
    it('should calculate total orders', () => {
      expect(component.orderStats().total).toBe(3);
    });

    it('should count pending orders', () => {
      expect(component.orderStats().pending).toBe(1);
    });

    it('should count confirmed orders', () => {
      expect(component.orderStats().confirmed).toBe(1);
    });

    it('should count cancelled orders', () => {
      expect(component.orderStats().cancelled).toBe(1);
    });

    it('should calculate total revenue', () => {
      const revenue = component.orderStats().totalRevenue;
      expect(revenue).toBe(45);
    });
  });

  describe('transaction statistics', () => {
    it('should calculate total transactions', () => {
      expect(component.transactionStats().total).toBe(3);
    });

    it('should count completed transactions', () => {
      expect(component.transactionStats().completed).toBe(2);
    });

    it('should count pending transactions', () => {
      expect(component.transactionStats().pending).toBe(1);
    });

    it('should calculate total processed', () => {
      const total = component.transactionStats().totalProcessed;
      expect(total).toBe(215);
    });
  });

  describe('status badge styling', () => {
    it('should return yellow badge for pending', () => {
      const badge = component.getStatusBadgeClass('PENDING');
      expect(badge).toContain('yellow');
    });

    it('should return green badge for confirmed', () => {
      const badge = component.getStatusBadgeClass('CONFIRMED');
      expect(badge).toContain('green');
    });

    it('should return red badge for cancelled', () => {
      const badge = component.getStatusBadgeClass('CANCELLED');
      expect(badge).toContain('red');
    });
  });

  describe('status icons', () => {
    it('should return hourglass for pending', () => {
      const icon = component.getStatusIcon('PENDING');
      expect(icon).toBe('⏳');
    });

    it('should return checkmark for confirmed', () => {
      const icon = component.getStatusIcon('CONFIRMED');
      expect(icon).toBe('✅');
    });

    it('should return X for cancelled', () => {
      const icon = component.getStatusIcon('CANCELLED');
      expect(icon).toBe('❌');
    });
  });

  describe('formatting', () => {
    it('should format currency correctly', () => {
      const formatted = component.formatCurrency(100.5);
      expect(formatted).toContain('100.50');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-03-30');
      const formatted = component.formatDate(date);
      expect(formatted).toBeTruthy();
    });
  });
});
