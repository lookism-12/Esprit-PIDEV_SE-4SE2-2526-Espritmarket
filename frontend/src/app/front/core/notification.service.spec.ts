import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { AppNotification, NotificationResponse, NotificationType } from '../models/notification.model';
import { environment } from '../../../environment';

const BASE = `${environment.apiUrl}/legacy/notifications`;

function makeNotifResponse(overrides: Partial<NotificationResponse> = {}): NotificationResponse {
  return {
    id: 'notif-001', title: 'Test Notification', message: 'Test body',
    type: NotificationType.INTERNAL_NOTIFICATION, read: false, active: true,
    createdAt: '2026-03-30T10:00:00', ...overrides,
  } as NotificationResponse;
}

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    if (!getTestBed().platform) {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [NotificationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('getMy()', () => {
    it('GETs /legacy/notifications/my', () => {
      service.getMy().subscribe();
      const req = http.expectOne(`${BASE}/my`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
    it('returns list of notifications', () => {
      service.getMy().subscribe(r => expect(r).toHaveLength(2));
      http.expectOne(`${BASE}/my`).flush([makeNotifResponse(), makeNotifResponse({ id: 'notif-002' })]);
    });
  });

  describe('getNotifications()', () => {
    it('wraps getMy() result in { notifications }', () => {
      service.getNotifications().subscribe(r => expect(r.notifications).toHaveLength(1));
      http.expectOne(`${BASE}/my`).flush([makeNotifResponse()]);
    });
    it('maps backend description field to message', () => {
      const raw = { ...makeNotifResponse(), description: 'Backend description', message: undefined };
      service.getNotifications().subscribe(r => expect(r.notifications[0].message).toBe('Backend description'));
      http.expectOne(`${BASE}/my`).flush([raw]);
    });
    it('maps notification_status to active', () => {
      const raw = { ...makeNotifResponse(), notification_status: false, active: undefined };
      service.getNotifications().subscribe(r => expect(r.notifications[0].active).toBe(false));
      http.expectOne(`${BASE}/my`).flush([raw]);
    });
  });

  describe('getAllAdmin()', () => {
    it('GETs /legacy/notifications', () => {
      service.getAllAdmin().subscribe();
      const req = http.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
    it('returns mapped AppNotification array', () => {
      service.getAllAdmin().subscribe(r => expect(r).toHaveLength(2));
      http.expectOne(BASE).flush([makeNotifResponse(), makeNotifResponse({ id: 'n2' })]);
    });
  });

  describe('markAsRead()', () => {
    it('PATCHes /legacy/notifications/:id/read with null body', () => {
      service.markAsRead('notif-001').subscribe();
      const req = http.expectOne(`${BASE}/notif-001/read`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBeNull();
      req.flush(makeNotifResponse({ read: true }));
    });
  });

  describe('deactivate()', () => {
    it('DELETEs /legacy/notifications/:id', () => {
      service.deactivate('notif-001').subscribe();
      const req = http.expectOne(`${BASE}/notif-001`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('broadcast()', () => {
    it('POSTs to /legacy/notifications/broadcast', () => {
      const payload: Partial<AppNotification> = {
        title: 'Black Friday', description: '50% off', type: NotificationType.EXTERNAL_NOTIFICATION,
      };
      service.broadcast(payload).subscribe();
      const req = http.expectOne(`${BASE}/broadcast`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(makeNotifResponse());
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all unread notifications as read', () => {
      const unread1 = makeNotifResponse({ id: 'n1', read: false });
      const unread2 = makeNotifResponse({ id: 'n2', read: false });
      const alreadyRead = makeNotifResponse({ id: 'n3', read: true });
      service.markAllAsRead().subscribe(r => expect(r.success).toBe(true));
      http.expectOne(`${BASE}/my`).flush([unread1, unread2, alreadyRead]);
      http.expectOne(`${BASE}/n1/read`).flush({ ...unread1, read: true });
      http.expectOne(`${BASE}/n2/read`).flush({ ...unread2, read: true });
    });
    it('returns success immediately when all notifications are already read', () => {
      service.markAllAsRead().subscribe(r => expect(r.success).toBe(true));
      http.expectOne(`${BASE}/my`).flush([makeNotifResponse({ id: 'n1', read: true })]);
      http.expectNone(`${BASE}/n1/read`);
    });
    it('returns success when there are no notifications', () => {
      service.markAllAsRead().subscribe(r => expect(r.success).toBe(true));
      http.expectOne(`${BASE}/my`).flush([]);
    });
  });

  describe('toAppNotifications mapping', () => {
    it('falls back to empty string when both description and message are missing', () => {
      const raw = { ...makeNotifResponse(), description: undefined, message: undefined };
      service.getNotifications().subscribe(r => expect(r.notifications[0].message).toBe(''));
      http.expectOne(`${BASE}/my`).flush([raw]);
    });
    it('prefers description over message when both present', () => {
      const raw = { ...makeNotifResponse(), description: 'from backend', message: 'old message' };
      service.getNotifications().subscribe(r => expect(r.notifications[0].message).toBe('from backend'));
      http.expectOne(`${BASE}/my`).flush([raw]);
    });
  });
});
