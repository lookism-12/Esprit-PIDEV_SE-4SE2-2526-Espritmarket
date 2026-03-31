import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { signal, runInInjectionContext } from '@angular/core';
import { ApplicationRef, createApplication } from '@angular/platform-browser';
import { PassengerDashboardComponent } from './passenger-dashboard';
import { CarpoolingService, PassengerDashboardDTO } from '../../core/carpooling.service';
import { AuthService } from '../../core/auth.service';

let appRef: ApplicationRef | null = null;
async function getApp() {
  if (!appRef) appRef = await createApplication({ providers: [] });
  return appRef;
}

const mockDashboard: PassengerDashboardDTO = {
  passengerName: 'Jane Doe', averageRating: 4.2, totalRidesCompleted: 5,
  totalSpent: 42.5, pendingRequests: 2, activeBookings: 1,
  recentBookings: [{
    bookingId: 'b1', rideId: 'r1', passengerProfileId: 'pp1',
    passengerName: 'Jane Doe', numberOfSeats: 1,
    pickupLocation: 'Tunis', dropoffLocation: 'Sfax',
    status: 'CONFIRMED' as any, totalPrice: 5,
  }],
  myRideRequests: [{
    id: 'req1', passengerProfileId: 'pp1', passengerName: 'Jane Doe',
    departureLocation: 'Tunis', destinationLocation: 'Sfax',
    departureTime: '2026-04-01T09:00:00', requestedSeats: 1,
    proposedPrice: 5, status: 'PENDING',
  }],
};

function makeSvc(overrides: any = {}): CarpoolingService {
  return {
    getPassengerDashboard: vi.fn(() => of(mockDashboard)),
    cancelBooking: vi.fn(() => of(undefined)),
    cancelRideRequest: vi.fn(() => of(undefined)),
    ...overrides,
  } as unknown as CarpoolingService;
}

function makeAuthSvc(): AuthService {
  return {} as unknown as AuthService;
}

function makeComponent(svc: CarpoolingService): PassengerDashboardComponent {
  return runInInjectionContext(appRef!.injector, () => {
    const c = new PassengerDashboardComponent();
    (c as any).carpoolingService = svc;
    (c as any).authService = {};
    return c;
  });
}

describe('PassengerDashboardComponent', () => {
  let component: PassengerDashboardComponent;
  let svc: CarpoolingService;

  beforeEach(async () => {
    await getApp();
    svc = makeSvc();
    component = makeComponent(svc);
    component.ngOnInit();
  });

  it('loads dashboard on init', () => {
    expect(svc.getPassengerDashboard).toHaveBeenCalledOnce();
    expect(component.dashboard()).toEqual(mockDashboard);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('sets error when load fails', () => {
    const failSvc = makeSvc({
      getPassengerDashboard: vi.fn(() => throwError(() => ({ message: 'Network error' }))),
    });
    const c = makeComponent(failSvc);
    c.ngOnInit();
    expect(c.error()).toBeTruthy();
    expect(c.isLoading()).toBe(false);
  });

  it('bookings() returns recentBookings from dashboard', () => {
    expect(component.bookings()).toHaveLength(1);
    expect(component.bookings()[0].bookingId).toBe('b1');
  });

  it('requests() returns myRideRequests from dashboard', () => {
    expect(component.requests()).toHaveLength(1);
    expect(component.requests()[0].id).toBe('req1');
  });

  it('bookings() returns empty array when no dashboard loaded', () => {
    const c = makeComponent(makeSvc({ getPassengerDashboard: vi.fn(() => of(null as any)) }));
    c.ngOnInit();
    expect(c.bookings()).toEqual([]);
  });

  it('activeTab defaults to bookings', () => {
    expect(component.activeTab()).toBe('bookings');
  });

  it('activeTab can be switched to requests', () => {
    component.activeTab.set('requests');
    expect(component.activeTab()).toBe('requests');
  });

  it('cancelBooking: calls service and reloads', () => {
    component.cancelBooking('b1');
    expect(svc.cancelBooking).toHaveBeenCalledWith('b1');
    expect(svc.getPassengerDashboard).toHaveBeenCalledTimes(2);
  });

  it('cancelBooking: sets error on failure', () => {
    (svc.cancelBooking as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => ({ error: { message: 'Cannot cancel' } }))
    );
    component.cancelBooking('b1');
    expect(component.error()).toBe('Cannot cancel');
  });

  it('cancelRequest: calls service and reloads', () => {
    component.cancelRequest('req1');
    expect(svc.cancelRideRequest).toHaveBeenCalledWith('req1');
    expect(svc.getPassengerDashboard).toHaveBeenCalledTimes(2);
  });

  it('cancelRequest: sets error on failure', () => {
    (svc.cancelRideRequest as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => ({ error: { message: 'Cannot cancel request' } }))
    );
    component.cancelRequest('req1');
    expect(component.error()).toBe('Cannot cancel request');
  });

  it('formatCurrency: formats TND correctly', () => {
    expect(component.formatCurrency(42.5)).toContain('42');
  });

  it('formatCurrency: handles zero', () => {
    expect(component.formatCurrency(0)).toContain('0');
  });

  it('statusColor: returns green for CONFIRMED', () => {
    expect(component.statusColor('CONFIRMED')).toContain('green');
  });

  it('statusColor: returns yellow for PENDING', () => {
    expect(component.statusColor('PENDING')).toContain('yellow');
  });

  it('statusColor: returns red for CANCELLED', () => {
    expect(component.statusColor('CANCELLED')).toContain('red');
  });

  it('statusColor: returns gray for COMPLETED', () => {
    expect(component.statusColor('COMPLETED')).toContain('gray');
  });

  it('statusColor: returns blue for ACCEPTED', () => {
    expect(component.statusColor('ACCEPTED')).toContain('blue');
  });

  it('statusColor: returns gray for unknown', () => {
    expect(component.statusColor('UNKNOWN')).toContain('gray');
  });
});
