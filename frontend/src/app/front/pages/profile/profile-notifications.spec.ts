import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { NotificationService } from '../../core/notification.service';
import { AuthService } from '../../core/auth.service';
import { OrderService } from '../../core/order.service';
import { UserService } from '../../core/user.service';
import { AppNotification, NotificationType } from '../../models/notification.model';
import { of, throwError } from 'rxjs';

describe('Profile Component - External Notifications', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;
  let orderService: jasmine.SpyObj<OrderService>;
  let userService: jasmine.SpyObj<UserService>;

  const mockExternalNotifications: AppNotification[] = [
    {
      id: 'notif1',
      type: NotificationType.EXTERNAL_NOTIFICATION,
      title: 'Important Update',
      message: 'Your order has been updated',
      read: false,
      active: true,
      createdAt: '2024-03-29T10:00:00Z',
      description: 'Your order has been updated'
    },
    {
      id: 'notif2',
      type: NotificationType.EXTERNAL_NOTIFICATION,
      title: 'New Feature Available',
      message: 'Check out our new marketplace features',
      read: true,
      active: true,
      createdAt: '2024-03-28T10:00:00Z',
      description: 'Check out our new marketplace features'
    }
  ];

  const mockInternalNotifications: AppNotification[] = [
    {
      id: 'internal1',
      type: NotificationType.INTERNAL_NOTIFICATION,
      title: 'System Notification',
      message: 'System maintenance scheduled',
      read: false,
      active: true,
      createdAt: '2024-03-27T10:00:00Z',
      description: 'System maintenance scheduled'
    }
  ];

  beforeEach(async () => {
    const notificationServiceSpy = createViSpyObj([
      'getNotifications',
      'markAsRead',
      'deactivate'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      userId: () => 'user1',
      userFirstName: () => 'John',
      userLastName: () => 'Doe',
      userEmail: () => 'john@example.com',
      userAvatar: () => 'avatar.jpg'
    });
    const orderServiceSpy = jasmine.createSpyObj('OrderService', []);
    const userServiceSpy = createViSpyObj(['updateProfile']);

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    orderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
  });

  describe('Notification Tab Navigation', () => {
    it('should initialize with listings tab active', () => {
      expect(component.activeTab()).toBe('listings');
    });

    it('should switch to notifications tab when setActiveTab is called', () => {
      component.setActiveTab('notifications');
      expect(component.activeTab()).toBe('notifications');
    });

    it('should load notifications when notifications tab is activated', (done) => {
      notificationService.getNotifications.and.returnValue(
        of({
          notifications: [...mockExternalNotifications, ...mockInternalNotifications]
        })
      );

      component.setActiveTab('notifications');

      setTimeout(() => {
        // Should only show external notifications
        expect(component.externalNotifications().length).toBe(2);
        expect(component.externalNotifications()[0].type).toBe(NotificationType.EXTERNAL_NOTIFICATION);
        done();
      }, 100);
    });
  });

  describe('Notification Filtering', () => {
    it('should filter notifications to show only EXTERNAL_NOTIFICATION type', (done) => {
      const mixedNotifications = [...mockExternalNotifications, ...mockInternalNotifications];
      notificationService.getNotifications.and.returnValue(
        of({ notifications: mixedNotifications })
      );

      component.setActiveTab('notifications');

      setTimeout(() => {
        expect(component.externalNotifications().length).toBe(2);
        component.externalNotifications().forEach(notif => {
          expect(notif.type).toBe(NotificationType.EXTERNAL_NOTIFICATION);
        });
        done();
      }, 100);
    });
  });

  describe('Mark as Read', () => {
    beforeEach(() => {
      component.externalNotifications.set(mockExternalNotifications);
    });

    it('should mark notification as read', (done) => {
      const updatedNotif = { ...mockExternalNotifications[0], read: true };
      notificationService.markAsRead.and.returnValue(of(updatedNotif));

      component.markNotificationAsRead('notif1');

      setTimeout(() => {
        const notification = component.externalNotifications().find(n => n.id === 'notif1');
        expect(notification?.read).toBe(true);
        done();
      }, 100);
    });

    it('should handle error when marking notification as read fails', (done) => {
      notificationService.markAsRead.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      spyOn(console, 'error');

      component.markNotificationAsRead('notif1');

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to mark notification as read:',
          jasmine.any(Error)
        );
        done();
      }, 100);
    });
  });

  describe('Delete Notification', () => {
    beforeEach(() => {
      component.externalNotifications.set(mockExternalNotifications);
      spyOn(window, 'confirm').and.returnValue(true);
    });

    it('should delete notification', (done) => {
      notificationService.deactivate.and.returnValue(of(undefined));

      component.deleteNotification('notif1');

      setTimeout(() => {
        const notification = component.externalNotifications().find(n => n.id === 'notif1');
        expect(notification).toBeUndefined();
        done();
      }, 100);
    });

    it('should show confirmation dialog before deleting', () => {
      notificationService.deactivate.and.returnValue(of(undefined));

      component.deleteNotification('notif1');

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this notification?');
    });

    it('should not delete if user cancels confirmation', (done) => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      const initialLength = component.externalNotifications().length;

      component.deleteNotification('notif1');

      setTimeout(() => {
        expect(component.externalNotifications().length).toBe(initialLength);
        expect(notificationService.deactivate).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Select Notification', () => {
    beforeEach(() => {
      component.externalNotifications.set(mockExternalNotifications);
    });

    it('should select notification and set it in selectedNotification signal', () => {
      component.selectNotification(mockExternalNotifications[0]);

      expect(component.selectedNotification()).toBe(mockExternalNotifications[0]);
    });

    it('should mark notification as read when selecting an unread notification', (done) => {
      const unreadNotif = mockExternalNotifications[0];
      notificationService.markAsRead.and.returnValue(of({ ...unreadNotif, read: true }));

      component.selectNotification(unreadNotif);

      expect(notificationService.markAsRead).toHaveBeenCalledWith(unreadNotif.id);
      done();
    });

    it('should not mark as read if notification is already read', (done) => {
      const readNotif = mockExternalNotifications[1];

      component.selectNotification(readNotif);

      expect(notificationService.markAsRead).not.toHaveBeenCalled();
      done();
    });
  });

  describe('Notification Icons', () => {
    it('should return correct icon for EXTERNAL_NOTIFICATION', () => {
      const icon = component.getNotificationIcon(NotificationType.EXTERNAL_NOTIFICATION);
      expect(icon).toBe('🔔');
    });

    it('should return correct icon for PROMOTION', () => {
      const icon = component.getNotificationIcon(NotificationType.PROMOTION);
      expect(icon).toBe('🎉');
    });

    it('should return correct icon for ORDER_CONFIRMATION', () => {
      const icon = component.getNotificationIcon(NotificationType.ORDER_CONFIRMATION);
      expect(icon).toBe('📦');
    });

    it('should return default icon for unknown types', () => {
      const icon = component.getNotificationIcon('UNKNOWN_TYPE' as any);
      expect(icon).toBe('📢');
    });
  });

  describe('Loading State', () => {
    it('should set isLoadingNotifications to true when loading starts', () => {
      notificationService.getNotifications.and.returnValue(
        of({ notifications: mockExternalNotifications })
      );

      component.setActiveTab('notifications');
      expect(component.isLoadingNotifications()).toBe(true);
    });

    it('should set isLoadingNotifications to false when loading completes', (done) => {
      notificationService.getNotifications.and.returnValue(
        of({ notifications: mockExternalNotifications })
      );

      component.setActiveTab('notifications');

      setTimeout(() => {
        expect(component.isLoadingNotifications()).toBe(false);
        done();
      }, 100);
    });

    it('should handle loading error gracefully', (done) => {
      notificationService.getNotifications.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      spyOn(console, 'error');

      component.setActiveTab('notifications');

      setTimeout(() => {
        expect(component.isLoadingNotifications()).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Failed to load notifications:', jasmine.any(Error));
        done();
      }, 100);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no external notifications exist', () => {
      component.externalNotifications.set([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No Notifications Yet');
    });
  });
});

