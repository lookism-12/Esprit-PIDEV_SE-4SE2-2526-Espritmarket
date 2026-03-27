import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environment';

export interface Ride {
  id: string;
  driver: string;
  driverRating: number;
  from: string;
  to: string;
  date: Date;
  price: number;
  seats: number;
  availableSeats: number;
  vehicleType: string;
  status: 'active' | 'full' | 'completed' | 'cancelled';
}

export interface RideFilter {
  departureLocation?: string;
  destinationLocation?: string;
  departureTime?: string;
  availableSeats?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private readonly apiUrl = `${environment.apiUrl}/rides`;

  // State
  readonly rides = signal<Ride[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  private mapRide(r: any): Ride {
    return {
      id: r.rideId || r.id,
      driver: r.driverName || 'Driver',
      driverRating: 4.8, // Fallback
      from: r.departureLocation,
      to: r.destinationLocation,
      date: new Date(r.departureTime),
      price: r.pricePerSeat,
      seats: r.availableSeats + 2, // Mock total seats
      availableSeats: r.availableSeats,
      vehicleType: r.vehicleMake || 'Car',
      status: (r.status || 'ACTIVE').toLowerCase() as any
    };
  }

  getAll(filter?: RideFilter): Observable<Ride[]> {
    let params = new HttpParams();
    if (filter?.departureLocation) params = params.set('departureLocation', filter.departureLocation);
    if (filter?.destinationLocation) params = params.set('destinationLocation', filter.destinationLocation);
    if (filter?.departureTime) params = params.set('departureTime', filter.departureTime);
    if (filter?.availableSeats) params = params.set('availableSeats', filter.availableSeats.toString());
    if (filter?.status) params = params.set('status', filter.status);

    this.isLoading.set(true);
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(rides => rides.map(r => this.mapRide(r))),
      tap(rides => {
        this.rides.set(rides);
        this.isLoading.set(false);
      })
    );
  }

  getById(id: string): Observable<Ride> {
    return this.http.get<Ride>(`${this.apiUrl}/${id}`);
  }

  getMyRides(): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.apiUrl}/my`);
  }

  create(data: any): Observable<Ride> {
    return this.http.post<Ride>(this.apiUrl, data);
  }

  cancel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
