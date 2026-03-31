import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty toasts array', () => {
      expect(service.toasts()).toEqual([]);
    });
  });

  describe('Success Toast', () => {
    it('should show success toast with correct message', () => {
      service.success('Operation successful');

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0]).toMatchObject({
        type: 'success',
        message: 'Operation successful'
      });
    });

    it('should auto-remove success toast after 5 seconds', () => {
      service.success('Test message');
      expect(service.toasts().length).toBe(1);

      vi.advanceTimersByTime(5000);
      expect(service.toasts().length).toBe(0);
    });
  });

  describe('Error Toast', () => {
    it('should show error toast with correct message', () => {
      service.error('Operation failed');

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0]).toMatchObject({
        type: 'error',
        message: 'Operation failed'
      });
    });

    it('should auto-remove error toast after 5 seconds', () => {
      service.error('Error message');
      expect(service.toasts().length).toBe(1);

      vi.advanceTimersByTime(5000);
      expect(service.toasts().length).toBe(0);
    });
  });

  describe('Info Toast', () => {
    it('should show info toast with correct message', () => {
      service.info('Information message');

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0]).toMatchObject({
        type: 'info',
        message: 'Information message'
      });
    });
  });

  describe('Warning Toast', () => {
    it('should show warning toast with correct message', () => {
      service.warning('Warning message');

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning message'
      });
    });
  });

  describe('Multiple Toasts', () => {
    it('should handle multiple toasts', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.info('Message 3');

      expect(service.toasts().length).toBe(3);
    });

    it('should remove toasts independently', () => {
      service.success('Success', 3000); // 3s timeout
      service.error('Error', 5000);     // 5s timeout

      expect(service.toasts().length).toBe(2);

      vi.advanceTimersByTime(3000);
      expect(service.toasts().length).toBe(1);
      expect(service.toasts()[0].type).toBe('error');

      vi.advanceTimersByTime(2000);
      expect(service.toasts().length).toBe(0);
    });
  });

  describe('Manual Toast Removal', () => {
    it('should remove toast by id', () => {
      service.success('Message 1');
      service.success('Message 2');

      const toastId = service.toasts()[0].id;
      service.remove(toastId);

      expect(service.toasts().length).toBe(1);
      expect(service.toasts()[0].id).not.toBe(toastId);
    });

    it('should handle removing non-existent toast', () => {
      service.success('Message');
      const initialLength = service.toasts().length;

      service.remove('non-existent-id');

      expect(service.toasts().length).toBe(initialLength);
    });
  });

  describe('Clear All Toasts', () => {
    it('should clear all toasts', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.info('Message 3');

      expect(service.toasts().length).toBe(3);

      service.clear();

      expect(service.toasts().length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      service.success('');

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      service.success(longMessage);

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe(longMessage);
    });

    it('should generate unique ids for each toast', () => {
      service.success('Message 1');
      service.success('Message 2');
      service.success('Message 3');

      const ids = service.toasts().map(t => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });
});
