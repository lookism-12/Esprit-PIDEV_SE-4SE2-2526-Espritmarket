import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { CarpoolingService } from './carpooling.service';
import { ApplicationRef, createApplication } from '@angular/platform-browser';
import { runInInjectionContext } from '@angular/core';

let appRef: ApplicationRef | null = null;

async function getApp(): Promise<ApplicationRef> {
  if (!appRef) {
    appRef = await createApplication({ providers: [] });
  }
  return appRef;
}

function makeHttp() {
  return {
    get: vi.fn(() => of([])),
    post: vi.fn(() => of({})),
    patch: vi.fn(() => of({})),
    delete: vi.fn(() => of(null)),
  };
}

describe('CarpoolingService', () => {
  let service: CarpoolingService;
  let http: ReturnType<typeof makeHttp>;

  beforeEach(async () => {
    http = makeHttp();
    const app = await getApp();
    service = runInInjectionContext(app.injector, () => {
      const s = new CarpoolingService();
      (s as any).http = http;
      return s;
    });
  });

  it('getAllRides: calls GET /api/rides', () => {
    http.get = vi.fn(() => of([{ rideId: 'r1' }]));
    let result: any;
    service.getAllRides().subscribe(r => (result = r));
    expect(http.get).toHaveBeenCalledWith('/api/rides');
    expect(result).toHaveLength(1);
  });

  it('getMyBookings: calls GET /api/bookings/my', () => {
    service.getMyBookings().subscribe();
    expect(http.get).toHaveBeenCalledWith('/api/bookings/my');
  });

  it('getMyRides: calls GET /api/rides/my', () => {
    service.getMyRides().subscribe();
    expect(http.get).toHaveBeenCalledWith('/api/rides/my');
  });

  it('getPassengerDashboard: calls GET /api/passenger/dashboard', () => {
    const mock = { passengerName: 'Jane', totalRidesCompleted: 3 };
    http.get = vi.fn(() => of(mock));
    let result: any;
    service.getPassengerDashboard().subscribe(d => (result = d));
    expect(http.get).toHaveBeenCalledWith('/api/passenger/dashboard');
    expect(result.passengerName).toBe('Jane');
  });

  it('getPassengerProfile: calls GET /api/passenger-profiles/me', () => {
    service.getPassengerProfile().subscribe();
    expect(http.get).toHaveBeenCalledWith('/api/passenger-profiles/me');
  });

  it('registerAsPassenger: calls POST /api/passenger-profiles', () => {
    service.registerAsPassenger().subscribe();
    expect(http.post).toHaveBeenCalledWith('/api/passenger-profiles', {});
  });

  it('cancelBooking: calls DELETE /api/bookings/:id', () => {
    service.cancelBooking('b1').subscribe();
    expect(http.delete).toHaveBeenCalledWith('/api/bookings/b1');
  });

  it('cancelRideRequest: calls DELETE /api/ride-requests/:id', () => {
    service.cancelRideRequest('req1').subscribe();
    expect(http.delete).toHaveBeenCalledWith('/api/ride-requests/req1');
  });

  it('getAvailableRideRequests: updates availableRideRequests signal', () => {
    const reqs = [{ id: 'req1', passengerName: 'Alice', status: 'PENDING' }];
    http.get = vi.fn(() => of(reqs));
    service.getAvailableRideRequests().subscribe();
    expect(service.availableRideRequests()).toHaveLength(1);
    expect(service.availableRideRequests()[0].passengerName).toBe('Alice');
  });

  it('createBooking: isLoading resets to false after emit', () => {
    http.post = vi.fn(() => of({ bookingId: 'b1' }));
    let loadingAfter = true;
    service.createBooking({ rideId: 'r1', numberOfSeats: 1, pickupLocation: 'A', dropoffLocation: 'B' })
      .subscribe(() => { loadingAfter = service.isLoading(); });
    expect(loadingAfter).toBe(false);
  });

  it('createRideRequest: calls POST /api/ride-requests', () => {
    http.post = vi.fn(() => of({ id: 'req2' }));
    service.createRideRequest({ departureLocation: 'Tunis', destinationLocation: 'Sfax' }).subscribe();
    expect(http.post).toHaveBeenCalledWith('/api/ride-requests', expect.any(Object));
  });

  it('acceptRideRequest: calls POST with vehicleId in body', () => {
    http.post = vi.fn(() => of({ id: 'req1', status: 'ACCEPTED' }));
    service.acceptRideRequest('req1', 'v1').subscribe();
    expect(http.post).toHaveBeenCalledWith(
      '/api/ride-requests/req1/accept',
      { vehicleId: 'v1' }
    );
  });

  it('counterPrice: calls PATCH with price param', () => {
    http.patch = vi.fn(() => of({ id: 'req1', counterPrice: 10 }));
    service.counterPrice('req1', 10, 'final').subscribe();
    const [url] = (http.patch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/ride-requests/req1/counter');
  });

  it('searchRides: calls GET /api/rides/search', () => {
    service.searchRides('Tunis', 'Sfax', undefined, 2).subscribe();
    expect(http.get).toHaveBeenCalledWith('/api/rides/search', expect.any(Object));
  });
});
