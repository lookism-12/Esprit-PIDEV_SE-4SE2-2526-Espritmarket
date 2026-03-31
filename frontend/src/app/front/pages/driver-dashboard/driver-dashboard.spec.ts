import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { signal, runInInjectionContext } from '@angular/core';
import { ApplicationRef, createApplication } from '@angular/platform-browser';
import { DriverDashboardComponent } from './driver-dashboard';
import { DashboardService } from '../../core/dashboard.service';
import { AuthService } from '../../core/auth.service';
import { DashboardData } from '../../models/dashboard.model';
import { User, UserRole } from '../../models/user.model';

let appRef: ApplicationRef | null = null;
async function getApp() {
  if (!appRef) appRef = await createApplication({ providers: [] });
  return appRef;
}

const mockUser: User = {
  id: 'user1', firstName: 'John', lastName: 'Driver',
  email: 'driver@test.com', phone: '', role: UserRole.DRIVER,
  isVerified: true, createdAt: new Date(), updatedAt: new Date(),
};

function makeDashSvc(overrides: any = {}): DashboardService {
  return {
    dashboardData: signal<DashboardData | null>(null),
    isLoadingDashboard: signal(false),
    dashboardError: signal<string | null>(null),
    pendingBookings: signal([]),
    recentActivities: signal([]),
    earningsHistory: signal([]),
    getDashboard: vi.fn(() => of({})),
    acceptBooking: vi.fn(() => of({})),
    declineBooking: vi.fn(() => of({})),
    ...overrides,
  } as unknown as DashboardService;
}

function makeAuthSvc(user: User | null = mockUser): AuthService {
  return { currentUser: signal(user) } as unknown as AuthService;
}

function makeComponent(dashSvc: DashboardService, authSvc: AuthService): DriverDashboardComponent {
  return runInInjectionContext(appRef!.injector, () => {
    const c = new DriverDashboardComponent();
    (c as any).dashboardService = dashSvc;
    (c as any).authService = authSvc;
    (c as any).dashboardData = (dashSvc as any).dashboardData;
    (c as any).isLoading = (dashSvc as any).isLoadingDashboard;
    (c as any).error = (dashSvc as any).dashboardError;
    (c as any).pendingBookings = (dashSvc as any).pendingBookings;
    (c as any).recentActivities = (dashSvc as any).recentActivities;
    (c as any).earningsHistory = (dashSvc as any).earningsHistory;
    return c;
  });
}

describe('DriverDashboardComponent', () => {
  let component: DriverDashboardComponent;
  let dashSvc: DashboardService;

  beforeEach(async () => {
    await getApp();
    dashSvc = makeDashSvc();
    component = makeComponent(dashSvc, makeAuthSvc());
    component.ngOnInit();
  });

  it('calls getDashboard on init with user id', () => {
    expect(dashSvc.getDashboard).toHaveBeenCalledWith('user1');
  });

  it('sets error when user is not logged in', () => {
    const noUserSvc = makeDashSvc();
    const c = makeComponent(noUserSvc, makeAuthSvc(null));
    c.loadDashboard();
    expect(noUserSvc.getDashboard).not.toHaveBeenCalled();
  });

  it('quickActions returns 4 items', () => {
    expect(component.quickActions()).toHaveLength(4);
  });

  it('quickActions Total Rides shows 0 when no data', () => {
    expect(component.quickActions().find(a => a.title === 'Total Rides')?.value).toBe('0');
  });

  it('quickActions Rating shows 0.0 when no data', () => {
    expect(component.quickActions().find(a => a.title === 'Rating')?.value).toBe('0.0');
  });

  it('quickActions Performance shows Basic when not verified', () => {
    expect(component.quickActions().find(a => a.title === 'Performance')?.value).toBe('Basic');
  });

  it('performanceStats returns null when no dashboard data', () => {
    expect(component.performanceStats()).toBeNull();
  });

  it('toggleBookingDetails: sets rideId on first call', () => {
    component.toggleBookingDetails('ride1');
    expect(component.showBookingDetails()).toBe('ride1');
  });

  it('toggleBookingDetails: clears rideId on second call with same id', () => {
    component.toggleBookingDetails('ride1');
    component.toggleBookingDetails('ride1');
    expect(component.showBookingDetails()).toBeNull();
  });

  it('toggleBookingDetails: switches to new rideId', () => {
    component.toggleBookingDetails('ride1');
    component.toggleBookingDetails('ride2');
    expect(component.showBookingDetails()).toBe('ride2');
  });

  it('acceptBooking: calls dashboardService.acceptBooking', () => {
    component.acceptBooking('booking1');
    expect(dashSvc.acceptBooking).toHaveBeenCalledWith('user1', 'booking1');
  });

  it('acceptBooking: reloads dashboard on success', () => {
    component.acceptBooking('booking1');
    expect(dashSvc.getDashboard).toHaveBeenCalledTimes(2);
  });

  it('acceptBooking: sets error on failure', () => {
    (dashSvc.acceptBooking as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => ({ error: { message: 'Booking failed' } }))
    );
    component.acceptBooking('booking1');
    expect((dashSvc as any).dashboardError()).toContain('Failed to accept booking');
  });

  it('declineBooking: calls dashboardService.declineBooking', () => {
    component.declineBooking('booking1');
    expect(dashSvc.declineBooking).toHaveBeenCalledWith('user1', 'booking1');
  });

  it('declineBooking: reloads dashboard on success', () => {
    component.declineBooking('booking1');
    expect(dashSvc.getDashboard).toHaveBeenCalledTimes(2);
  });

  it('refreshDashboard: calls loadDashboard again', () => {
    component.refreshDashboard();
    expect(dashSvc.getDashboard).toHaveBeenCalledTimes(2);
  });

  it('formatCurrency: formats number as TND', () => {
    expect(component.formatCurrency(100)).toContain('100');
  });

  it('formatCurrency: handles zero', () => {
    expect(component.formatCurrency(0)).toContain('0');
  });

  it('formatDate: returns N/A for empty string', () => {
    expect(component.formatDate('')).toBe('N/A');
  });

  it('formatDate: returns formatted string for valid ISO date', () => {
    const result = component.formatDate('2026-04-01T10:00:00');
    expect(result).toBeTruthy();
    expect(result).not.toBe('N/A');
  });
});
