import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { signal, runInInjectionContext } from '@angular/core';
import { ApplicationRef, createApplication } from '@angular/platform-browser';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Carpooling } from './carpooling';
import { CarpoolingService, RideResponseDTO, RideRequestResponseDTO } from '../../core/carpooling.service';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';

let appRef: ApplicationRef | null = null;
async function getApp() {
  if (!appRef) appRef = await createApplication({ providers: [] });
  return appRef;
}

const mockRide: RideResponseDTO = {
  rideId: 'r1', driverProfileId: 'dp1', driverName: 'John', vehicleId: 'v1',
  departureLocation: 'Tunis', destinationLocation: 'Sfax',
  departureTime: '2026-04-01T10:00:00', availableSeats: 3, pricePerSeat: 5, status: 'CONFIRMED',
};

const mockRequest: RideRequestResponseDTO = {
  id: 'req1', passengerProfileId: 'pp1', passengerName: 'Alice',
  departureLocation: 'Tunis', destinationLocation: 'Sfax',
  departureTime: '2026-04-01T09:00:00', requestedSeats: 1, proposedPrice: 5, status: 'PENDING',
};

function makeCarpoolingSvc(overrides: any = {}): CarpoolingService {
  return {
    isLoading: signal(false), error: signal<string | null>(null),
    availableRideRequests: signal<RideRequestResponseDTO[]>([mockRequest]),
    getAllRides: vi.fn(() => of([mockRide])),
    getPassengerProfile: vi.fn(() => of({ id: 'pp1' })),
    getDriverProfile: vi.fn(() => throwError(() => ({ status: 404 }))),
    getDriverProfileByUserId: vi.fn(() => throwError(() => ({ status: 404 }))),
    getMyDriverStats: vi.fn(() => of({})),
    getMyVehicles: vi.fn(() => of([])),
    getMyRides: vi.fn(() => of([])),
    getAvailableRideRequests: vi.fn(() => of([mockRequest])),
    searchRides: vi.fn(() => of([mockRide])),
    createBooking: vi.fn(() => of({ bookingId: 'b1' })),
    createRideRequest: vi.fn(() => of({ id: 'req2' })),
    cancelRideRequest: vi.fn(() => of(undefined)),
    registerAsPassenger: vi.fn(() => of({ id: 'pp1' })),
    acceptRideRequest: vi.fn(() => of({ id: 'req1', status: 'ACCEPTED' })),
    counterPrice: vi.fn(() => of({ id: 'req1', counterPrice: 10 })),
    getBookingsForRide: vi.fn(() => of([])),
    acceptBooking: vi.fn(() => of({})),
    rejectBooking: vi.fn(() => of({})),
    registerAsDriver: vi.fn(() => of({ id: 'dp1' })),
    addVehicle: vi.fn(() => of({ id: 'v1' })),
    createRide: vi.fn(() => of({ rideId: 'r1' })),
    ...overrides,
  } as unknown as CarpoolingService;
}

function makeAuthSvc(role: UserRole = UserRole.PASSENGER): AuthService {
  return {
    userRole: signal(role), userId: signal('user1'), currentUser: signal({ id: 'user1', role }),
  } as unknown as AuthService;
}

function makeComponent(svc: CarpoolingService, auth: AuthService, queryParams: any = {}): Carpooling {
  return runInInjectionContext(appRef!.injector, () => {
    const c = new Carpooling();
    (c as any).carpoolingService = svc;
    (c as any).auth = auth;
    (c as any).fb = new FormBuilder();
    (c as any).route = { queryParams: of(queryParams) };
    return c;
  });
}

describe('Carpooling Component — Passenger', () => {
  let component: Carpooling;
  let svc: CarpoolingService;

  beforeEach(async () => {
    await getApp();
    svc = makeCarpoolingSvc();
    component = makeComponent(svc, makeAuthSvc(UserRole.PASSENGER));
    component.ngOnInit();
  });

  it('loads rides on init', () => {
    expect(svc.getAllRides).toHaveBeenCalled();
    expect(component.rides()).toHaveLength(1);
  });

  it('does NOT call getDriverProfile for passenger user', () => {
    expect(svc.getDriverProfile).not.toHaveBeenCalled();
  });

  it('loads available ride requests on init', () => {
    expect(svc.getAvailableRideRequests).toHaveBeenCalled();
  });

  it('activeView defaults to passenger', () => { expect(component.activeView()).toBe('passenger'); });
  it('setView switches to driver', () => { component.setView('driver'); expect(component.activeView()).toBe('driver'); });
  it('passengerTab defaults to rides', () => { expect(component.passengerTab()).toBe('rides'); });
  it('isDriverUser returns false for PASSENGER role', () => { expect(component.isDriverUser()).toBe(false); });

  it('filteredRides: only shows CONFIRMED rides', () => {
    component.rides.set([{ ...mockRide, status: 'CONFIRMED' }, { ...mockRide, rideId: 'r2', status: 'CANCELLED' }]);
    expect(component.filteredRides()).toHaveLength(1);
  });

  it('filteredRides: sorts by cheapest', () => {
    component.rides.set([{ ...mockRide, rideId: 'r1', pricePerSeat: 10, status: 'CONFIRMED' }, { ...mockRide, rideId: 'r2', pricePerSeat: 3, status: 'CONFIRMED' }]);
    component.setSort('cheapest');
    expect(component.filteredRides()[0].pricePerSeat).toBe(3);
  });

  it('filteredRides: sorts by fastest', () => {
    component.rides.set([{ ...mockRide, rideId: 'r1', estimatedDurationMinutes: 90, status: 'CONFIRMED' }, { ...mockRide, rideId: 'r2', estimatedDurationMinutes: 30, status: 'CONFIRMED' }]);
    component.setSort('fastest');
    expect(component.filteredRides()[0].estimatedDurationMinutes).toBe(30);
  });

  it('isRideFull: true when availableSeats is 0', () => { expect(component.isRideFull({ ...mockRide, availableSeats: 0 })).toBe(true); });
  it('isRideFull: false when seats available', () => { expect(component.isRideFull({ ...mockRide, availableSeats: 2 })).toBe(false); });

  it('swapCities: swaps from and to', () => {
    component.searchForm.patchValue({ from: 'Tunis', to: 'Sfax' });
    component.swapCities();
    expect(component.searchForm.get('from')?.value).toBe('Sfax');
    expect(component.searchForm.get('to')?.value).toBe('Tunis');
  });

  it('starsArray: returns 5 booleans', () => { expect(component.starsArray(3)).toHaveLength(5); });
  it('starsArray: first 3 true for rating 3', () => { expect(component.starsArray(3).filter(Boolean)).toHaveLength(3); });
  it('starsArray: all false for rating 0', () => { expect(component.starsArray(0).filter(Boolean)).toHaveLength(0); });
  it('starsArray: all true for rating 5', () => { expect(component.starsArray(5).filter(Boolean)).toHaveLength(5); });

  it('openBookingPanel: opens panel when profile exists', () => {
    component.hasPassengerProfile.set(true);
    component.openBookingPanel('r1');
    expect(component.showBookingPanel()).toBe('r1');
  });

  it('openBookingPanel: calls registerAsPassenger when no profile', () => {
    component.hasPassengerProfile.set(false);
    component.openBookingPanel('r1');
    expect(svc.registerAsPassenger).toHaveBeenCalled();
  });

  it('closeBookingPanel: sets to false', () => { component.showBookingPanel.set('r1'); component.closeBookingPanel(); expect(component.showBookingPanel()).toBe(false); });
  it('openCreateRideRequestModal: sets flag to true', () => { component.openCreateRideRequestModal(); expect(component.showCreateRideRequestModal()).toBe(true); });
  it('closeCreateRideRequestModal: sets flag to false', () => { component.showCreateRideRequestModal.set(true); component.closeCreateRideRequestModal(); expect(component.showCreateRideRequestModal()).toBe(false); });

  it('submitRideRequest: does not call service when form invalid', () => {
    component.createRideRequestForm.reset();
    component.submitRideRequest();
    expect(svc.createRideRequest).not.toHaveBeenCalled();
  });

  it('submitRideRequest: calls service and closes modal on success', () => {
    component.createRideRequestForm.patchValue({ departureLocation: 'Tunis', destinationLocation: 'Sfax', departureTime: '2026-04-01T09:00', requestedSeats: 1, proposedPrice: 5 });
    component.showCreateRideRequestModal.set(true);
    component.submitRideRequest();
    expect(svc.createRideRequest).toHaveBeenCalled();
    expect(component.showCreateRideRequestModal()).toBe(false);
  });

  it('submitRideRequest: sets error on failure', () => {
    (svc.createRideRequest as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => ({ error: { message: 'Request failed' } })));
    component.createRideRequestForm.patchValue({ departureLocation: 'Tunis', destinationLocation: 'Sfax', departureTime: '2026-04-01T09:00', requestedSeats: 1, proposedPrice: 5 });
    component.submitRideRequest();
    expect(component.error()).toBe('Request failed');
  });

  it('joinCoRequest: shows error when PENDING', () => { component.joinCoRequest({ ...mockRequest, status: 'PENDING' }); expect(component.error()).toContain('No driver'); });
  it('joinCoRequest: shows error when CANCELLED', () => { component.joinCoRequest({ ...mockRequest, status: 'CANCELLED' }); expect(component.error()).toContain('cancelled'); });
  it('joinCoRequest: opens booking panel when ACCEPTED with rideId', () => { component.hasPassengerProfile.set(true); component.joinCoRequest({ ...mockRequest, status: 'ACCEPTED', rideId: 'r1' }); expect(component.showBookingPanel()).toBe('r1'); });
  it('joinCoRequest: shows error when ACCEPTED but no rideId', () => { component.joinCoRequest({ ...mockRequest, status: 'ACCEPTED', rideId: undefined }); expect(component.error()).toContain('not available'); });

  it('formatPrice: formats with TND suffix', () => { expect(component.formatPrice(5.5)).toBe('5.5 TND'); });
  it('formatDate: returns formatted date string', () => { expect(component.formatDate('2026-04-01T10:00:00')).toBeTruthy(); });
});

describe('Carpooling Component — Driver', () => {
  let component: Carpooling;
  let svc: CarpoolingService;

  beforeEach(async () => {
    await getApp();
    svc = makeCarpoolingSvc({
      getDriverProfile: vi.fn(() => of({ id: 'dp1', driverName: 'John', isVerified: true })),
      getMyDriverStats: vi.fn(() => of({ totalRidesCompleted: 5, averageRating: 4.5, totalEarnings: 100 })),
    });
    component = makeComponent(svc, makeAuthSvc(UserRole.DRIVER), { view: 'driver' });
    component.ngOnInit();
  });

  it('calls getDriverProfile for driver user', () => { expect(svc.getDriverProfile).toHaveBeenCalled(); });
  it('isDriverUser returns true for DRIVER role', () => { expect(component.isDriverUser()).toBe(true); });
  it('switches to driver view when ?view=driver query param', () => { expect(component.activeView()).toBe('driver'); });
  it('hasDriverProfile returns true when profile loaded', () => { expect(component.hasDriverProfile()).toBe(true); });
  it('driverProfile is set after load', () => { expect(component.driverProfile()).not.toBeNull(); });
});
