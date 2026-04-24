import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environment';

export interface RoutingRequest {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

export interface RoutingResponse {
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  distance: number; // meters
  duration: number; // seconds
  polyline?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/route`;

  /**
   * Fetches real road route from backend
   */
  getRoute(request: RoutingRequest): Observable<RoutingResponse> {
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(res => {
        // If backend returns polyline, decode it
        let coords: [number, number][] = [];
        if (res.polyline) {
          coords = this.decodePolyline(res.polyline);
        } else if (res.coordinates) {
          // ORS returns [lng, lat], convert to [lat, lng] for Leaflet
          coords = res.coordinates.map((c: any) => [c[1], c[0]]);
        }
        
        return {
          coordinates: coords,
          distance: res.distance,
          duration: res.duration,
          polyline: res.polyline
        };
      })
    );
  }

  /**
   * Checks if a point is within threshold distance (km) of any point on the route
   */
  isNearRoute(point: [number, number], routeCoords: [number, number][], thresholdKm: number = 2): boolean {
    if (!routeCoords || routeCoords.length === 0) return false;
    
    // Check distance to each point in route (simple but effective for carpool matching)
    for (const coord of routeCoords) {
      if (this.haversineDistance(point, coord) <= thresholdKm) return true;
    }
    return false;
  }

  private haversineDistance(p1: [number, number], p2: [number, number]): number {
    const R = 6371; // Earth radius in km
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLng = (p2[1] - p1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Decodes Google/ORS encoded polyline
   */
  private decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += ((result & 1) ? ~(result >> 1) : (result >> 1));

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += ((result & 1) ? ~(result >> 1) : (result >> 1));

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  }
}
