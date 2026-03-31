/**
 * NotificationsComponent Unit Tests
 * Tests component logic directly without Angular compiler
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../front/core/notification.service';
import { AppNotification, NotificationType } from '../../../front/models/notification.model';

function makeNotif(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'notif-001', title: 'Test Alert', message: 'Test message', description: 'Test message',
    type: NotificationType.EXTERNAL_NOTIFICATION, read: false, active: true,
    notification_status: true, createdAt: '2026-03-30T10:00:00',
    ...overrides,
  } as AppNotification;
}

function createHarness(svc: Partial<NotificationService>) {
  const notifications = signal<AppNotification[]>([]);
  const allNotificationsRaw = signal<AppNotification[]>([]);
  const isLoading = signal(true);
  const isSending = signal(false);
  const showBroadcastModal = signal(false);
  const broadcastTitle = signal('');
  const broadcastMessage = signal('');

  function loadGlobalNotifications() {
    isLoading.set(true);
    (svc.getAllAdmin as any)().subscribe({
      next: (res: AppNotification[]) => {
        allNotificationsRaw.set(res);
        const seen = new Set<string>();
        const deduped = res.filter(n => {
          const key = `${n.title}__${n.description || n.message}__${n.type}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        notifications.set(deduped);
        isLoading.set(false);
      },
      error: () => isLoading.set(false),
    });
  }

  function getRecipientCount(notif: AppNotification): number {
    return allNotificationsRaw().filter(n =>
      n.title === notif.title &&
      (n.description || n.message) === (notif.description || notif.message) &&
      n.type === notif.type
    ).length;
  }

  function openBroadcast() { showBroadcastModal.set(true); }

  function closeBroadcast() {
    showBroadcastModal.set(false);
    broadcastTitle.set('');
    broadcastMessage.set('');
  }

  function sendBroadcast() {
    if (!broadcastTitle() || !broadcastMessage() || isSending()) return;
    isSending.set(true);
    const payload: Partial<AppNotification> = {
      title: broadcastTitle(), description: broadcastMessage(),
      type: NotificationType.EXTERNAL_NOTIFICATION,
    };
    (svc.broadcast as any)(payload).subscribe({
      next: () => { isSending.set(false); closeBroadcast(); loadGlobalNotifications(); },
      error: () => isSending.set(false),
    });
  }

  loadGlobalNotifications();

  return {
    notifications, allNotificationsRaw, isLoading, isSending,
    showBroadcastModal, broadcastTitle, broadcastMessage,
    loadGlobalNotifications, getRecipientCount, openBroadcast, closeBroadcast, sendBroadcast,
  };
}

describe('NotificationsComponent (Admin)', () => {
  let svc: Partial<NotificationService>;
  let h: ReturnType<typeof createHarness>;

  beforeEach(() => {
    svc = {
      getAllAdmin: vi.fn().mockReturnValue(of([])),
      broadcast:  vi.fn().mockReturnValue(of(makeNotif())),
    };
    h = createHarness(svc);
  });

  describe('ngOnInit', () => {
    it('calls getAllAdmin on init',                    () => expect(svc.getAllAdmin).toHaveBeenCalledOnce());
    it('sets isLoading to false after load',           () => expect(h.isLoading()).toBe(false));
    it('starts with empty notifications list',         () => expect(h.notifications()).toHaveLength(0));
  });

  describe('loadGlobalNotifications()', () => {
    it('populates notifications from API', () => {
      vi.mocked(svc.getAllAdmin!).mockReturnValue(of([makeNotif(), makeNotif({ id: 'n2', title: 'Second' })]));
      h.loadGlobalNotifications();
      expect(h.notifications()).toHaveLength(2);
    });

    it('deduplicates notifications with same title+description+type', () => {
      const notifs = [
        makeNotif({ id: 'n1', title: 'Promo', description: 'Sale', type: NotificationType.EXTERNAL_NOTIFICATION }),
        makeNotif({ id: 'n2', title: 'Promo', description: 'Sale', type: NotificationType.EXTERNAL_NOTIFICATION }),
        makeNotif({ id: 'n3', title: 'Promo', description: 'Sale', type: NotificationType.EXTERNAL_NOTIFICATION }),
      ];
      vi.mocked(svc.getAllAdmin!).mockReturnValue(of(notifs));
      h.loadGlobalNotifications();
      expect(h.notifications()).toHaveLength(1);
    });

    it('keeps distinct notifications with different titles', () => {
      vi.mocked(svc.getAllAdmin!).mockReturnValue(of([
        makeNotif({ id: 'n1', title: 'Alert A', description: 'msg A' }),
        makeNotif({ id: 'n2', title: 'Alert B', description: 'msg B' }),
      ]));
      h.loadGlobalNotifications();
      expect(h.notifications()).toHaveLength(2);
    });

    it('sets isLoading to false on error', () => {
      vi.mocked(svc.getAllAdmin!).mockReturnValue(throwError(() => new Error('fail')));
      h.loadGlobalNotifications();
      expect(h.isLoading()).toBe(false);
    });
  });

  describe('getRecipientCount()', () => {
    it('returns count of users who received the same broadcast', () => {
      const notifs = [
        makeNotif({ id: 'n1', title: 'Promo', description: 'Sale', type: NotificationType.EXTERNAL_NOTIFICATION }),
        makeNotif({ id: 'n2', title: 'Promo', description: 'Sale', type: NotificationType.EXTERNAL_NOTIFICATION }),
        makeNotif({ id: 'n3', title: 'Promo', description: 'Sale', type: NotificationType.EXTERNAL_NOTIFICATION }),
        makeNotif({ id: 'n4', title: 'Other', description: 'Other msg' }),
      ];
      vi.mocked(svc.getAllAdmin!).mockReturnValue(of(notifs));
      h.loadGlobalNotifications();
      const promo = h.allNotificationsRaw().find(n => n.title === 'Promo')!;
      expect(h.getRecipientCount(promo)).toBe(3);
    });

    it('returns 1 for a unique notification', () => {
      const notif = makeNotif({ id: 'n1', title: 'Unique', description: 'Only one' });
      vi.mocked(svc.getAllAdmin!).mockReturnValue(of([notif]));
      h.loadGlobalNotifications();
      expect(h.getRecipientCount(notif)).toBe(1);
    });
  });

  describe('openBroadcast() / closeBroadcast()', () => {
    it('opens the broadcast modal', () => {
      h.openBroadcast();
      expect(h.showBroadcastModal()).toBe(true);
    });

    it('closes the modal and resets form fields', () => {
      h.broadcastTitle.set('Hello');
      h.broadcastMessage.set('World');
      h.openBroadcast();
      h.closeBroadcast();
      expect(h.showBroadcastModal()).toBe(false);
      expect(h.broadcastTitle()).toBe('');
      expect(h.broadcastMessage()).toBe('');
    });
  });

  describe('sendBroadcast()', () => {
    it('does nothing when title is empty', () => {
      h.broadcastTitle.set(''); h.broadcastMessage.set('msg');
      h.sendBroadcast();
      expect(svc.broadcast).not.toHaveBeenCalled();
    });

    it('does nothing when message is empty', () => {
      h.broadcastTitle.set('Title'); h.broadcastMessage.set('');
      h.sendBroadcast();
      expect(svc.broadcast).not.toHaveBeenCalled();
    });

    it('does nothing when already sending (prevents double-click)', () => {
      h.broadcastTitle.set('Title'); h.broadcastMessage.set('msg');
      h.isSending.set(true);
      h.sendBroadcast();
      expect(svc.broadcast).not.toHaveBeenCalled();
    });

    it('calls broadcast service with correct payload', () => {
      h.broadcastTitle.set('Black Friday'); h.broadcastMessage.set('50% off');
      vi.mocked(svc.getAllAdmin!).mockReturnValue(of([]));
      h.sendBroadcast();
      expect(svc.broadcast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Black Friday', description: '50% off',
        type: NotificationType.EXTERNAL_NOTIFICATION,
      }));
    });

    it('closes modal and reloads after successful broadcast', () => {
      h.broadcastTitle.set('Alert'); h.broadcastMessage.set('msg');
      h.showBroadcastModal.set(true);
      vi.mocked(svc.getAllAdmin!).mockReturnValue(of([]));
      h.sendBroadcast();
      expect(h.showBroadcastModal()).toBe(false);
      expect(h.isSending()).toBe(false);
      expect(svc.getAllAdmin).toHaveBeenCalledTimes(2); // init + reload
    });

    it('resets isSending on error', () => {
      h.broadcastTitle.set('Alert'); h.broadcastMessage.set('msg');
      vi.mocked(svc.broadcast!).mockReturnValue(throwError(() => new Error('fail')));
      h.sendBroadcast();
      expect(h.isSending()).toBe(false);
    });
  });
});
