import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CarpoolingAdminService,
  AdminRideDTO,
  AdminRideRequestDTO,
  AdminDriverProfileDTO,
  AdminPassengerProfileDTO,
  AdminPaymentDTO
} from '../../core/services/carpooling-admin.service';

type TabId = 'rides' | 'requests' | 'drivers' | 'passengers' | 'payments';

@Component({
  selector: 'app-carpooling-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6 bg-[#0a0a0a] min-h-screen text-zinc-300 font-sans">
      
      <!-- Premium Header Card -->
      <div class="relative bg-[#121212] rounded-[2rem] p-10 overflow-hidden border border-zinc-800/50 shadow-2xl">
        <!-- Decorative Glows -->
        <div class="absolute top-[-10%] right-[-5%] w-80 h-80 bg-red-600/10 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-60 h-60 bg-zinc-800/20 rounded-full blur-[80px]"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 class="text-6xl font-[1000] text-white mb-2 tracking-tighter uppercase italic flex items-center gap-4">
              <span class="drop-shadow-2xl">SMART</span> 
              <span class="text-[#DC143C] drop-shadow-[0_0_30px_rgba(220,20,60,0.4)]">MOBILITY</span>
            </h1>
            <p class="text-zinc-500 font-medium text-lg tracking-wide">Full Carpooling Administrative Oversight Dashboard</p>
          </div>
          
          <button (click)="refreshAll()" 
            class="group flex items-center gap-3 px-8 py-3.5 bg-[#1a1a1a] hover:bg-[#222] text-white font-black rounded-2xl border border-zinc-800 transition-all active:scale-95 shadow-xl">
            <span class="text-blue-400 group-hover:rotate-180 transition-transform duration-700 text-xl overflow-hidden">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </span>
            <span class="uppercase tracking-widest text-sm text-zinc-200">Refresh Data</span>
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of stats(); track stat.label) {
          <div class="bg-[#121212] border border-zinc-800/50 p-8 rounded-[2rem] shadow-xl hover:border-zinc-700 transition-all flex flex-col gap-2">
             <p class="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">{{ stat.label }}</p>
             <p class="text-4xl font-black text-white tracking-tighter">{{ stat.value }}</p>
             <div class="flex items-center gap-2 mt-1">
                <span [class]="stat.growth >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'" 
                      class="text-[10px] font-black px-2 py-0.5 rounded-full">
                  {{ stat.growth >= 0 ? '+' : '' }}{{ stat.growth }}%
                </span>
                <span class="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">from last month</span>
             </div>
          </div>
        }
      </div>

      <!-- Tabbed Interface -->
      <div class="bg-[#121212] rounded-[2.5rem] border border-zinc-800/50 overflow-hidden shadow-2xl">
        <!-- Custom Tabs Navigation -->
        <div class="flex items-center gap-1 p-3 bg-[#0d0d0d] border-b border-zinc-800/50 overflow-x-auto no-scrollbar">
          @for (tab of tabs; track tab.id) {
            <button 
              (click)="activeTab.set(tab.id)"
              [class]="activeTab() === tab.id 
                ? 'bg-[#1a1a1a] text-white border border-zinc-700 shadow-lg' 
                : 'text-zinc-500 hover:text-zinc-300'"
              class="px-8 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all whitespace-nowrap"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="p-8 relative min-h-[400px]">
          @if (isLoading()) {
            <div class="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex items-center justify-center">
               <div class="flex flex-col items-center gap-6">
                  <div class="w-16 h-16 border-t-4 border-[#DC143C] border-r-4 border-zinc-800 rounded-full animate-spin"></div>
                  <p class="text-[#DC143C] font-black uppercase tracking-[0.4em] text-xs">Synchronizing</p>
               </div>
            </div>
          }

          <!-- Rides Table -->
          @if (activeTab() === 'rides') {
            <div class="overflow-x-auto no-scrollbar">
              <table class="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr class="text-zinc-600 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th class="px-6 pb-2">Ride ID</th>
                    <th class="px-6 pb-2">Driver</th>
                    <th class="px-6 pb-2">Route</th>
                    <th class="px-6 pb-2">Time</th>
                    <th class="px-6 pb-2 text-center">Occupancy</th>
                    <th class="px-6 pb-2">Status</th>
                    <th class="px-6 pb-2">Financials</th>
                    <th class="px-6 pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ride of rides(); track ride.rideId) {
                    <tr class="bg-[#1a1a1a]/40 hover:bg-[#1a1a1a] transition-all rounded-2xl group border border-transparent hover:border-zinc-800">
                      <td class="px-6 py-5 font-mono text-[10px] text-zinc-600">#{{ ride.rideId.substring(0, 8) }}</td>
                      <td class="px-6 py-5">
                         <div class="flex flex-col">
                            <span class="text-sm font-black text-white tracking-tight">{{ ride.driverName || 'Driver Esprit' }}</span>
                            <span class="text-[9px] text-zinc-600 uppercase tracking-tighter">{{ ride.vehicleMake }} {{ ride.vehicleModel }}</span>
                         </div>
                      </td>
                      <td class="px-6 py-5">
                        <div class="flex items-center gap-3 text-xs font-bold">
                          <span class="text-red-500">●</span>
                          <span class="italic text-zinc-400 capitalize">{{ ride.departureLocation }}</span>
                          <span class="text-zinc-600">→</span>
                          <span class="text-emerald-500">●</span>
                          <span class="italic text-zinc-400 capitalize">{{ ride.destinationLocation }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-xs font-bold text-zinc-400">
                        {{ ride.departureTime | date:'MMM d, HH:mm' }}
                      </td>
                      <td class="px-6 py-5 text-center">
                         <div class="flex flex-col items-center gap-1">
                            <span class="bg-[#222] px-4 py-1.5 rounded-xl font-black text-white text-sm border border-zinc-800">
                                {{ getTotalSeats(ride) - ride.availableSeats }}/{{ getTotalSeats(ride) }}
                            </span>
                            <span class="text-[9px] font-black {{ ride.availableSeats === 0 ? 'text-red-500' : 'text-zinc-600' }} uppercase italic">
                                {{ ride.availableSeats === 0 ? 'FULL' : ride.availableSeats + ' Left' }}
                            </span>
                         </div>
                      </td>
                      <td class="px-6 py-5">
                        <span [class]="getStatusClass(ride.status)">
                           {{ ride.status }}
                        </span>
                      </td>
                      <td class="px-6 py-5">
                         <div class="flex flex-col">
                            <span class="text-[10px] font-black text-emerald-500 italic">{{ ride.paidBookingsCount }} Paid</span>
                            <span class="text-[9px] font-bold text-zinc-600">{{ getBookedSeats(ride) * ride.pricePerSeat | currency:'TND' }} Total</span>
                         </div>
                      </td>
                      <td class="px-6 py-5 text-right flex justify-end gap-2">
                        <button (click)="openEditModal('ride', ride)" class="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button (click)="cancelRide(ride.rideId)" 
                          class="p-2 opacity-60 hover:opacity-100 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                          [disabled]="ride.status === 'CANCELLED'">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- Other tabs follow similar premium styling... -->
          @if (activeTab() === 'requests') {
             <div class="overflow-x-auto no-scrollbar">
              <table class="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr class="text-zinc-600 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th class="px-6 pb-2">Request ID</th>
                    <th class="px-6 pb-2">Passenger</th>
                    <th class="px-6 pb-2">Route</th>
                    <th class="px-6 pb-2">Budget</th>
                    <th class="px-6 pb-2">Status</th>
                    <th class="px-6 pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (req of requests(); track req.id) {
                    <tr class="bg-[#1a1a1a]/40 hover:bg-[#1a1a1a] transition-all rounded-2xl border border-transparent hover:border-zinc-800">
                      <td class="px-6 py-5 font-mono text-[10px] text-zinc-600">#{{ req.id.substring(0, 8) }}</td>
                      <td class="px-6 py-5 font-black text-zinc-100 text-sm">{{ req.passengerName }}</td>
                      <td class="px-6 py-5">
                         <div class="flex flex-col">
                            <span class="text-xs font-bold italic {{ req.driverName ? 'text-blue-400' : 'text-zinc-700 underline' }}">
                                {{ req.driverName || 'Finding Driver...' }}
                            </span>
                            @if (req.status === 'ACCEPTED') {
                               <span class="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Matched</span>
                            }
                         </div>
                      </td>
                      <td class="px-6 py-5 text-sm font-black text-emerald-400">{{ req.proposedPrice }} TND</td>
                      <td class="px-6 py-5">
                        <span [class]="getStatusClass(req.status)">{{ req.status }}</span>
                      </td>
                      <td class="px-6 py-5 text-right">
                        <button (click)="cancelRequest(req.id)" class="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (activeTab() === 'drivers') {
             <div class="overflow-x-auto no-scrollbar">
              <table class="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr class="text-zinc-600 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th class="px-6 pb-2">Driver</th>
                    <th class="px-6 pb-2">License #</th>
                    <th class="px-6 pb-2">Rating</th>
                    <th class="px-6 pb-2">Verification</th>
                    <th class="px-6 pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (driver of drivers(); track driver.id) {
                    <tr class="bg-[#1a1a1a]/40 hover:bg-[#1a1a1a] transition-all rounded-2xl border border-transparent hover:border-zinc-800">
                      <td class="px-6 py-5 flex items-center gap-3">
                         <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-black text-zinc-400 border border-zinc-700">
                            {{ driver.fullName.charAt(0) }}
                         </div>
                         <span class="font-black text-sm text-zinc-100">{{ driver.fullName }}</span>
                      </td>
                      <td class="px-6 py-5 font-mono text-[10px] text-zinc-500">{{ driver.licenseNumber }}</td>
                      <td class="px-6 py-5">
                        <div class="flex items-center gap-1">
                          <span class="text-sm font-black text-white">{{ driver.averageRating || '0' }}</span>
                          <span class="text-amber-500 text-xs">★</span>
                        </div>
                      </td>
                      <td class="px-6 py-5">
                        @if (driver.isVerified) {
                           <span class="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full uppercase italic">Verified</span>
                        } @else {
                           <span class="text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full uppercase italic">Pending</span>
                        }
                      </td>
                      <td class="px-6 py-5 text-right flex justify-end gap-2">
                        <button (click)="openEditModal('driver', driver)" class="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button (click)="deleteDriver(driver.id)" class="p-2 text-zinc-600 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (activeTab() === 'passengers') {
             <div class="overflow-x-auto no-scrollbar">
              <table class="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr class="text-zinc-600 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th class="px-6 pb-2">Passenger</th>
                    <th class="px-6 pb-2">Stats</th>
                    <th class="px-6 pb-2">Preferences</th>
                    <th class="px-6 pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pax of passengers(); track pax.id) {
                    <tr class="bg-[#1a1a1a]/40 hover:bg-[#1a1a1a] transition-all rounded-2xl border border-transparent hover:border-zinc-800">
                      <td class="px-6 py-5">
                         <div class="flex flex-col">
                            <span class="font-black text-sm text-zinc-100">{{ pax.fullName }}</span>
                            <span class="text-[10px] text-zinc-500">{{ pax.email }}</span>
                         </div>
                      </td>
                      <td class="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {{ pax.totalRidesCompleted }} Rides Total
                      </td>
                      <td class="px-6 py-5 text-xs text-zinc-500 italic">{{ pax.preferences || 'No dietary/travel preferences' }}</td>
                      <td class="px-6 py-5 text-right flex justify-end gap-2">
                        <button (click)="openEditModal('passenger', pax)" class="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button (click)="deletePassenger(pax.id)" class="text-zinc-700 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (activeTab() === 'payments') {
             <div class="overflow-x-auto no-scrollbar">
              <table class="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr class="text-zinc-600 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th class="px-6 pb-2">Reference</th>
                    <th class="px-6 pb-2">Amount</th>
                    <th class="px-6 pb-2">Status</th>
                    <th class="px-6 pb-2">Processed On</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pay of payments(); track pay.id) {
                    <tr class="bg-[#1a1a1a]/40 hover:bg-[#1a1a1a] transition-all rounded-2xl border border-transparent hover:border-zinc-800">
                      <td class="px-6 py-5">
                         <div class="flex flex-col">
                            <span class="text-[10px] font-black text-zinc-200">PAY-{{ pay.id.substring(0, 6).toUpperCase() }}</span>
                            <span class="text-[9px] font-mono text-zinc-600 italic">Booking Ref: #{{ pay.bookingId.substring(0, 8) }}</span>
                         </div>
                      </td>
                      <td class="px-6 py-5 text-sm font-black text-white">{{ pay.amount | currency:'TND' }}</td>
                      <td class="px-6 py-5">
                         <span [class]="getPaymentStatusClass(pay.status)">{{ pay.status }}</span>
                      </td>
                      <td class="px-6 py-5 text-[10px] font-bold text-zinc-500">{{ pay.createdAt | date:'MMM d, y, HH:mm' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <!-- Quick Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div class="bg-[#121212] border border-zinc-800 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(220,20,60,0.15)]">
              <div class="p-8 border-b border-zinc-800 flex justify-between items-center">
                 <h2 class="text-xl font-black text-white uppercase italic tracking-widest">Edit {{ modalType() }}</h2>
                 <button (click)="closeModal()" class="text-zinc-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                 </button>
              </div>
              
              <div class="p-8 space-y-6">
                 @if (modalType() === 'ride') {
                    <div class="space-y-4">
                       <div>
                          <label class="text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-2 block">Price Per Seat (TND)</label>
                          <input type="number" [(ngModel)]="editData.pricePerSeat" class="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#DC143C] outline-none transition-all font-bold">
                       </div>
                       <div>
                          <label class="text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-2 block">Available Seats</label>
                          <input type="number" [(ngModel)]="editData.availableSeats" class="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#DC143C] outline-none transition-all font-bold">
                       </div>
                       <div>
                          <label class="text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-2 block">Global Status</label>
                          <select [(ngModel)]="editData.status" class="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#DC143C] outline-none transition-all font-bold">
                             <option value="PENDING">PENDING</option>
                             <option value="CONFIRMED">CONFIRMED</option>
                             <option value="IN_PROGRESS">IN_PROGRESS</option>
                             <option value="COMPLETED">COMPLETED</option>
                             <option value="CANCELLED">CANCELLED</option>
                          </select>
                       </div>
                    </div>
                 }
                 
                 @if (modalType() === 'driver') {
                    <div class="space-y-4">
                       <div>
                          <label class="text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-2 block">Verification Status</label>
                          <select [(ngModel)]="editData.isVerified" class="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#DC143C] outline-none transition-all font-bold">
                             <option [ngValue]="true">VERIFIED</option>
                             <option [ngValue]="false">NOT VERIFIED</option>
                          </select>
                       </div>
                    </div>
                 }

                 @if (modalType() === 'passenger') {
                    <div class="space-y-4">
                       <div>
                          <label class="text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-2 block">Travel Preferences</label>
                          <textarea [(ngModel)]="editData.preferences" rows="3" class="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#DC143C] outline-none transition-all font-bold"></textarea>
                       </div>
                    </div>
                 }
              </div>

              <div class="p-8 bg-[#0d0d0d] border-t border-zinc-800 flex justify-end gap-4">
                 <button (click)="closeModal()" class="px-6 py-2.5 text-zinc-500 font-bold uppercase text-xs hover:text-white transition-colors">Cancel</button>
                 <button (click)="saveEdit()" class="px-8 py-2.5 bg-[#DC143C] hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20">Save Changes</button>
              </div>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .animate-slide-in {
      animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      font-style: italic;
      letter-spacing: 0.1em;
    }
  `]
})
export class CarpoolingManagementComponent implements OnInit {
  private carpoolingAdminService = inject(CarpoolingAdminService);

  activeTab = signal<TabId>('rides');
  isLoading = signal(false);

  rides = signal<AdminRideDTO[]>([]);
  requests = signal<AdminRideRequestDTO[]>([]);
  drivers = signal<AdminDriverProfileDTO[]>([]);
  passengers = signal<AdminPassengerProfileDTO[]>([]);
  payments = signal<AdminPaymentDTO[]>([]);

  // Modal State
  showModal = signal(false);
  modalType = signal<'ride' | 'driver' | 'passenger' | 'none'>('none');
  editData: any = {};
  targetId: string = '';

  stats = signal([
    { label: 'Active Rides', value: '0', growth: 12 },
    { label: 'Pending Requests', value: '0', growth: 5 },
    { label: 'Unverified Drivers', value: '0', growth: -2 },
    { label: 'Total Revenue', value: '0.00 TND', growth: 18 }
  ]);

  tabs: { id: TabId, label: string }[] = [
    { id: 'rides', label: 'Ride Fleet' },
    { id: 'requests', label: 'Ride Offers' },
    { id: 'drivers', label: 'Driver Registry' },
    { id: 'passengers', label: 'Passenger List' },
    { id: 'payments', label: 'Financials' }
  ];

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.isLoading.set(true);

    // Fetch unified stats
    this.carpoolingAdminService.getStats().subscribe(data => {
      this.stats.set([
        { label: 'Active Rides', value: data.activeRidesCount.toString(), growth: data.activeRidesGrowth ?? 0 },
        { label: 'Pending Requests', value: data.pendingRequestsCount.toString(), growth: data.pendingRequestsGrowth ?? 0 },
        { label: 'Unverified Drivers', value: data.unverifiedDriversCount.toString(), growth: data.unverifiedDriversGrowth ?? 0 },
        { label: 'Total Revenue', value: (data.totalRevenue ?? 0).toFixed(2) + ' TND', growth: data.totalRevenueGrowth ?? 0 }
      ]);
    });

    // Fetch lists
    this.loadRides();
    this.loadRequests();
    this.loadDrivers();
    this.loadPassengers();
    this.loadPayments();

    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  loadRides(): void {
    this.carpoolingAdminService.getAllRides().subscribe(data => this.rides.set(data));
  }

  loadRequests(): void {
    this.carpoolingAdminService.getAllRideRequests().subscribe(data => this.requests.set(data));
  }

  loadDrivers(): void {
    this.carpoolingAdminService.getAllDriverProfiles().subscribe(data => this.drivers.set(data));
  }

  loadPassengers(): void {
    this.carpoolingAdminService.getAllPassengerProfiles().subscribe(data => this.passengers.set(data));
  }

  loadPayments(): void {
    this.carpoolingAdminService.getAllPayments().subscribe(data => this.payments.set(data));
  }

  // Removed updateStats as we now use backend stats

  // --- Actions ---

  cancelRide(id: string): void {
    if (confirm('Are you sure you want to cancel this ride globally?')) {
      this.carpoolingAdminService.updateRideStatus(id, 'CANCELLED').subscribe(() => {
        this.refreshAll();
      });
    }
  }

  cancelRequest(id: string): void {
    if (confirm('Are you sure you want to delete this ride request?')) {
      this.carpoolingAdminService.cancelRideRequest(id).subscribe(() => {
        this.refreshAll();
      });
    }
  }

  verifyDriver(id: string): void {
    this.carpoolingAdminService.verifyDriver(id).subscribe(() => {
      this.refreshAll();
    });
  }

  deleteDriver(id: string): void {
    if (confirm('Permanently delete this driver?')) {
      this.carpoolingAdminService.deleteDriver(id).subscribe(() => {
        this.refreshAll();
      });
    }
  }

  deletePassenger(id: string): void {
    if (confirm('Permanently delete this passenger?')) {
      this.carpoolingAdminService.deletePassenger(id).subscribe(() => {
        this.refreshAll();
      });
    }
  }

  // --- Modal Logic ---

  openEditModal(type: any, data: any): void {
    this.modalType.set(type);
    this.targetId = type === 'ride' ? data.rideId : data.id;
    this.editData = { ...data };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalType.set('none');
    this.editData = {};
    this.targetId = '';
  }

  saveEdit(): void {
    this.isLoading.set(true);
    const type = this.modalType();

    if (type === 'ride') {
      this.carpoolingAdminService.updateRide(this.targetId, this.editData).subscribe(() => {
        this.refreshAll();
        this.closeModal();
      });
    } else if (type === 'driver') {
      this.carpoolingAdminService.updateDriver(this.targetId, this.editData).subscribe(() => {
        this.refreshAll();
        this.closeModal();
      });
    } else if (type === 'passenger') {
      this.carpoolingAdminService.updatePassenger(this.targetId, this.editData).subscribe(() => {
        this.refreshAll();
        this.closeModal();
      });
    } else {
      this.isLoading.set(false);
    }
  }

  // --- Helpers ---

  getStatusClass(status: any): string {
    const base = 'px-4 py-1 rounded-lg text-[10px] font-black uppercase italic tracking-widest border ';
    switch (status) {
      case 'CONFIRMED': return base + 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_PROGRESS': return base + 'bg-blue-500/10 text-blue-400 border-blue-400/20 animate-pulse';
      case 'CANCELLED': return base + 'bg-[#DC143C]/20 text-[#DC143C] border-[#DC143C]/30';
      case 'COMPLETED': return base + 'bg-zinc-800 text-zinc-500 border-zinc-700';
      case 'PENDING': return base + 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return base + 'bg-zinc-900 text-zinc-600 border-zinc-800';
    }
  }

  getPaymentStatusClass(status: string): string {
    const base = 'text-[10px] font-black uppercase italic ';
    if (status === 'COMPLETED') return base + 'text-emerald-500';
    if (status === 'PENDING') return base + 'text-amber-500';
    if (status === 'REFUNDED') return base + 'text-red-500';
    return base + 'text-zinc-500';
  }

  getTotalSeats(ride: AdminRideDTO): number {
    const booked = ride.bookedSeats ?? 0;
    const available = ride.availableSeats ?? 0;
    return ride.totalSeats ?? (booked + available);
  }

  getBookedSeats(ride: AdminRideDTO): number {
    const total = this.getTotalSeats(ride);
    const available = ride.availableSeats ?? 0;
    return ride.bookedSeats ?? Math.max(0, total - available);
  }
}
