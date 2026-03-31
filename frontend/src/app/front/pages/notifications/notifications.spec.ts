import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Notifications } from './notifications';
import { NotificationService } from '../../core/notification.service';
import { NotificationResponse, NotificationType } from '../../models/notification.model';

describe('Notifications component', () => {
  let component: Notifications;
  let fixture: ComponentFixture<Notifications>;

  // ── Mock data ─────────────────────────────────────────────────────────────
  const mockNotifs: NotificationResponse[] = [
    {
      id: 'n-1',
      type: NotificationType.INTERNAL_NOTIFICATION,
      title: 'Negotiation Update',
      message: 'Your offer was accepted',
      read: false,
      active: true,
      createdAt: '2026-03-29T10:00:00Z'
    },
    {
      id: 'n-2',
      type: NotificationType.EXTERNAL_NOTIFICATION,
      title: 'Promo',
      message: 'Black Friday!',
      read: true,
      active: true,
      createdAt: '2026-03-28T09:00:00Z'
    }
  ];

  // ── Service spy ───────────────────────────────────────────────────────────
  const serviceSpy = {
    getMy: vi.fn().mockReturnValue(of(mockNotifs)),
    getByUser: vi.fn().mockReturnValue(of(mockNotifs)),
    markAsRead: vi.fn().mockReturnValue(of({ ...mockNotifs[0], read: true })),
    deactivate: vi.fn().mockReturnValue(of(void 0))
  };

  beforeEach(async () => {
    Object.values(serviceSpy).forEach(spy => spy.calls.reset());
    serviceSpy.getMy.and.returnValue(of(mockNotifs));
    serviceSpy.getByUser.and.returnValue(of(mockNotifs));
    serviceSpy.markAsRead.and.returnValue(of({ ...mockNotifs[0], read: true }));
    serviceSpy.deactivate.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [Notifications],
      providers: [{ provide: NotificationService, useValue: serviceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation & initialization ─────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init via getMy', () => {
    expect(serviceSpy.getMy).toHaveBeenCalled();
    expect(component.notifications().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('should set userId to "me" on init', () => {
    expect(component.userId()).toBe('me');
  });

  // ── load ──────────────────────────────────────────────────────────────────

  it('should not load if userId is empty', () => {
    serviceSpy.getMy.calls.reset();
    component.load('');
    expect(serviceSpy.getMy).not.toHaveBeenCalled();
  });

  it('should call getMy when userId is "me"', () => {
    serviceSpy.getMy.calls.reset();
    component.load('me');
    expect(serviceSpy.getMy).toHaveBeenCalled();
  });

  it('should call getByUser for specific userId', () => {
    component.load('user-42');
    expect(serviceSpy.getByUser).toHaveBeenCalledWith('user-42');
  });

  it('should handle empty response gracefully', () => {
    serviceSpy.getMy.and.returnValue(of(null));
    component.load('me');
    expect(component.notifications()).toEqual([]);
    expect(component.isLoading()).toBe(false);
  });

  it('should set isLoading to false on error', () => {
    serviceSpy.getMy.and.returnValue(throwError(() => new Error('Network error')));
    component.load('me');
    expect(component.isLoading()).toBe(false);
  });

  // ── markAsRead ────────────────────────────────────────────────────────────

  it('should mark notification as read and update the list', () => {
    component.markAsRead('n-1');

    expect(serviceSpy.markAsRead).toHaveBeenCalledWith('n-1');
    const updated = component.notifications().find(n => n.id === 'n-1');
    expect(updated!.read).toBe(true);
  });

  it('should not affect other notifications when marking one as read', () => {
    component.markAsRead('n-1');

    const other = component.notifications().find(n => n.id === 'n-2');
    expect(other!.read).toBe(true); // was already true
  });

  // ── deleteNotification ────────────────────────────────────────────────────

  it('should remove notification from list after delete', () => {
    component.deleteNotification('n-1');

    expect(serviceSpy.deactivate).toHaveBeenCalledWith('n-1');
    expect(component.notifications().length).toBe(1);
    expect(component.notifications()[0].id).toBe('n-2');
  });

  it('should keep list unchanged if deleting non-existent id', () => {
    component.deleteNotification('non-existent');
    expect(component.notifications().length).toBe(2);
  });

  // ── getIconForType ────────────────────────────────────────────────────────

  it('should return 🤝 for NEGOTIATION_UPDATE', () => {
    expect(component.getIconForType('NEGOTIATION_UPDATE')).toBe('🤝');
  });

  it('should return 🧾 for ORDER_CONFIRMATION', () => {
    expect(component.getIconForType('ORDER_CONFIRMATION')).toBe('🧾');
  });

  it('should return 📣 for PROMOTION', () => {
    expect(component.getIconForType('PROMOTION')).toBe('📣');
  });

  it('should return ⚙️ for SYSTEM', () => {
    expect(component.getIconForType('SYSTEM')).toBe('⚙️');
  });

  it('should return 🔔 for unknown type', () => {
    expect(component.getIconForType('UNKNOWN_TYPE')).toBe('🔔');
  });
});

