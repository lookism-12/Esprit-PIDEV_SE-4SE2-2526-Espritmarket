import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit,
  PLATFORM_ID, inject, signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MapRide {
  rideId: string;
  driverName: string;
  driverRating?: number;
  departureLocation: string;
  destinationLocation: string;
  pricePerSeat: number;
  availableSeats: number;
  status: string;
  departureTime?: string;
  estimatedDurationMinutes?: number;
}

@Component({
  selector: 'app-carpooling-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full" style="height:520px;background:#1a1a2e">

      <!-- MAP CONTAINER -->
      <div #mapContainer style="position:absolute;inset:0;z-index:1"></div>

      <!-- TOP SEARCH BAR (InDrive style) -->
      <div class="absolute top-0 left-0 right-0 z-20 p-4 pt-6">
        <div class="max-w-lg mx-auto">
          <div class="rounded-2xl shadow-2xl overflow-hidden" style="background:rgba(255,255,255,0.97);backdrop-filter:blur(20px)">
            <!-- From -->
            <div class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div class="w-3 h-3 rounded-full bg-primary shrink-0"></div>
              <input [(ngModel)]="fromInput" (ngModelChange)="onFromChange($event)"
                placeholder="Departure location..."
                class="flex-1 text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder-gray-400">
              @if (fromInput) {
                <button (click)="fromInput='';fromCoords=null;clearRoute()" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              }
            </div>
            <!-- To -->
            <div class="flex items-center gap-3 px-4 py-3.5">
              <div class="w-3 h-3 rounded-full bg-green-500 shrink-0"></div>
              <input [(ngModel)]="toInput" (ngModelChange)="onToChange($event)"
                placeholder="Destination..."
                class="flex-1 text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder-gray-400">
              @if (toInput) {
                <button (click)="toInput='';toCoords=null;clearRoute()" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              }
            </div>
            <!-- Autocomplete suggestions -->
            @if (suggestions().length > 0) {
              <div class="border-t border-gray-100 max-h-48 overflow-y-auto">
                @for (s of suggestions(); track s.place_id) {
                  <button (click)="selectSuggestion(s)" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                    <span class="text-gray-400 shrink-0">📍</span>
                    <span class="text-sm text-gray-700 truncate">{{ s.display_name }}</span>
                  </button>
                }
              </div>
            }
          </div>
          <!-- Search button -->
          @if (fromInput && toInput) {
            <button (click)="searchRoute()" [disabled]="isGeocoding()"
              class="mt-3 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl text-sm transition-all active:scale-95 shadow-xl disabled:opacity-60 flex items-center justify-center gap-2">
              @if (isGeocoding()) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Finding rides...
              } @else {
                🔍 Find Rides on Route
              }
            </button>
          }
        </div>
      </div>

      <!-- LOADING OVERLAY -->
      @if (isGeocoding()) {
        <div class="absolute inset-0 z-30 flex items-center justify-center" style="background:rgba(0,0,0,0.3)">
          <div class="bg-white rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl">
            <div class="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span class="font-bold text-gray-800 text-sm">Finding rides...</span>
          </div>
        </div>
      }

      <!-- EMPTY STATE -->
      @if (rides.length === 0 && !isGeocoding() && (fromInput || toInput)) {
        <div class="absolute bottom-8 left-4 right-4 z-20">
          <div class="rounded-2xl p-5 text-center shadow-2xl" style="background:rgba(255,255,255,0.97)">
            <span class="text-4xl block mb-2">🚗</span>
            <p class="font-black text-gray-900">Enter locations above to see routes on the map</p>
          </div>
        </div>
      }

      <!-- MY LOCATION BUTTON -->
      <button (click)="centerOnTunisia()" class="absolute right-4 bottom-6 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-xl hover:scale-105 transition-all active:scale-95">
        📍
      </button>
    </div>
  `
})
export class CarpoolingMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() rides: MapRide[] = [];
  @Output() bookRide = new EventEmitter<MapRide>();
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private map: any = null;
  private L: any = null;
  private routeLayer: any = null;
  private rideMarkers: any[] = [];
  private geocodeCache = new Map<string, [number, number]>();
  private searchTimeout: any = null;

  fromInput = '';
  toInput = '';
  fromCoords: [number, number] | null = null;
  toCoords: [number, number] | null = null;
  activeField: 'from' | 'to' | null = null;

  suggestions = signal<any[]>([]);
  isGeocoding = signal(false);
  selectedRide = signal<MapRide | null>(null);

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
    if (this.rides.length > 0) await this.plotAllRides();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['rides'] && this.map) await this.plotAllRides();
  }

  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); this.map = null; }
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  private async initMap(): Promise<void> {
    this.L = await import('leaflet');
    delete (this.L.Icon.Default.prototype as any)._getIconUrl;
    this.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    this.map = this.L.map(this.mapContainer.nativeElement, {
      center: [36.8065, 10.1815], zoom: 10,
      zoomControl: false, attributionControl: false
    });
    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.map);
    this.L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  onFromChange(val: string): void {
    this.activeField = 'from';
    this.debounceSuggest(val);
  }

  onToChange(val: string): void {
    this.activeField = 'to';
    this.debounceSuggest(val);
  }

  private debounceSuggest(q: string): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (q.length < 3) { this.suggestions.set([]); return; }
    this.searchTimeout = setTimeout(() => this.fetchSuggestions(q), 400);
  }

  private async fetchSuggestions(q: string): Promise<void> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Tunisia')}&format=json&limit=5&countrycodes=tn`);
      const data = await res.json();
      this.suggestions.set(data || []);
    } catch { this.suggestions.set([]); }
  }

  selectSuggestion(s: any): void {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    const name = s.display_name.split(',')[0];
    if (this.activeField === 'from') {
      this.fromInput = name; this.fromCoords = coords;
    } else {
      this.toInput = name; this.toCoords = coords;
    }
    this.suggestions.set([]);
    this.geocodeCache.set(name, coords);
  }

  async searchRoute(): Promise<void> {
    if (!this.fromInput || !this.toInput) return;
    this.isGeocoding.set(true);
    this.suggestions.set([]);
    try {
      if (!this.fromCoords) this.fromCoords = await this.geocode(this.fromInput);
      if (!this.toCoords) this.toCoords = await this.geocode(this.toInput);
      if (this.fromCoords && this.toCoords) {
        this.drawRoute(this.fromCoords, this.toCoords);
      }
    } finally { this.isGeocoding.set(false); }
  }

  private drawRoute(from: [number, number], to: [number, number]): void {
    if (!this.L || !this.map) return;
    if (this.routeLayer) { this.routeLayer.remove(); this.routeLayer = null; }

    // Animated dashed route
    this.routeLayer = this.L.layerGroup([
      this.L.polyline([from, to], { color: '#8B0000', weight: 4, opacity: 0.9 }),
      this.L.polyline([from, to], { color: 'white', weight: 2, opacity: 0.4, dashArray: '8 12' })
    ]).addTo(this.map);

    // From marker
    const fromIcon = this.L.divIcon({
      html: `<div style="background:#8B0000;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(139,0,0,0.3)"></div>`,
      className: '', iconSize: [16, 16], iconAnchor: [8, 8]
    });
    const toIcon = this.L.divIcon({
      html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(34,197,94,0.3)"></div>`,
      className: '', iconSize: [16, 16], iconAnchor: [8, 8]
    });

    this.L.marker(from, { icon: fromIcon }).bindPopup(`<b>📍 ${this.fromInput}</b>`).addTo(this.map);
    this.L.marker(to, { icon: toIcon }).bindPopup(`<b>🏁 ${this.toInput}</b>`).addTo(this.map);

    this.map.fitBounds(this.L.latLngBounds([from, to]).pad(0.3));
  }

  clearRoute(): void {
    if (this.routeLayer) { this.routeLayer.remove(); this.routeLayer = null; }
  }

  private async plotAllRides(): Promise<void> {
    if (!this.map || !this.L) return;
    this.rideMarkers.forEach(m => m.remove());
    this.rideMarkers = [];

    for (const ride of this.rides.slice(0, 10)) {
      try {
        const dep = await this.geocode(ride.departureLocation);
        if (!dep) continue;
        const icon = this.L.divIcon({
          html: `<div style="background:#8B0000;color:white;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:900;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid white">${ride.pricePerSeat} TND</div>`,
          className: '', iconAnchor: [30, 15]
        });
        const m = this.L.marker(dep, { icon })
          .bindPopup(`<b>${ride.driverName}</b><br>${ride.departureLocation} → ${ride.destinationLocation}<br>${ride.pricePerSeat} TND · ${ride.availableSeats} seats`)
          .addTo(this.map);
        m.on('click', () => { this.selectedRide.set(ride); });
        this.rideMarkers.push(m);
      } catch {}
    }
  }

  selectRide(ride: MapRide): void {
    this.selectedRide.set(this.selectedRide()?.rideId === ride.rideId ? null : ride);
    if (this.selectedRide()) this.highlightRide(ride);
  }

  private async highlightRide(ride: MapRide): Promise<void> {
    if (!this.map || !this.L) return;
    const dep = await this.geocode(ride.departureLocation);
    const dest = await this.geocode(ride.destinationLocation);
    if (dep && dest) {
      if (this.routeLayer) { this.routeLayer.remove(); }
      this.routeLayer = this.L.layerGroup([
        this.L.polyline([dep, dest], { color: '#8B0000', weight: 5, opacity: 1 }),
        this.L.polyline([dep, dest], { color: 'white', weight: 2, opacity: 0.5, dashArray: '8 12' })
      ]).addTo(this.map);
      this.map.fitBounds(this.L.latLngBounds([dep, dest]).pad(0.3));
    }
  }

  centerOnTunisia(): void {
    if (this.map) this.map.setView([36.8065, 10.1815], 10);
  }

  private async geocode(location: string): Promise<[number, number] | null> {
    if (!location?.trim()) return null;
    const cached = this.geocodeCache.get(location);
    if (cached) return cached;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ' Tunisia')}&format=json&limit=1&countrycodes=tn`);
      const data = await res.json();
      if (data?.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        this.geocodeCache.set(location, coords);
        return coords;
      }
    } catch {}
    return null;
  }
}
