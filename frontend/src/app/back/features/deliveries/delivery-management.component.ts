import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environment';
import { SavClaim, SavAdminService } from '../../core/services/sav-admin.service';
import { SavService } from '../../core/services/sav.service';
import { ToastService } from '../../core/services/toast.service';
import { Delivery } from '../../core/models/sav.models';
import { UserService } from '../../../front/core/user.service';
import { User, UserRole } from '../../../front/models/user.model';
import { WrRegistryService, AgentWrStats } from '../../core/services/wr-registry.service';

type DeliveryActionType = 'WARNING' | 'REWARD';

interface AgentRow {
  agent: User;
  deliveries: Delivery[];
  reviews: SavClaim[];
  total: number;
  active: number;
  delivered: number;
  returned: number;
  refused: number;
  successRate: number;
  averageRating: number;
  score: number;
}

function normalizeUsers(response: any): User[] {
  return response?.content || response?.users || (Array.isArray(response) ? response : []);
}

function isDeliveryAgent(user: any): boolean {
  if (Array.isArray(user.roles)) return user.roles.includes(UserRole.DELIVERY);
  return user.role === UserRole.DELIVERY;
}

function fullName(user: User): string {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
}

function claimsForAgent(claims: SavClaim[], agentId: string): SavClaim[] {
  return claims.filter(claim => claim.targetType === 'DELIVERY_AGENT' && claim.deliveryAgentId === agentId);
}

function buildAgentRows(agents: User[], deliveries: Delivery[], claims: SavClaim[]): AgentRow[] {
  return agents.map(agent => {
    const assigned = deliveries.filter(delivery => delivery.userId === agent.id || delivery.pendingDriverId === agent.id);
    const delivered = assigned.filter(delivery => delivery.status === 'DELIVERED').length;
    const returned = assigned.filter(delivery => delivery.status === 'RETURNED').length;
    const active = assigned.filter(delivery => !['DELIVERED', 'RETURNED'].includes(delivery.status)).length;
    const refused = deliveries.filter(delivery => delivery.declinedByDriverId === agent.id || (delivery.userId === agent.id && delivery.status === 'DRIVER_REFUSED')).length;
    const reviews = claimsForAgent(claims, agent.id);
    const rated = reviews.filter(review => (review.rating || 0) > 0);
    const averageRating = rated.length ? rated.reduce((sum, review) => sum + (review.rating || 0), 0) / rated.length : 0;
    const successRate = assigned.length ? Math.round((delivered / assigned.length) * 100) : 0;
    const score = Math.max(0, Math.min(100, Math.round((successRate * 0.65) + (averageRating * 7) - (refused * 5) - (returned * 4))));

    return {
      agent,
      deliveries: assigned,
      reviews,
      total: assigned.length,
      active,
      delivered,
      returned,
      refused,
      successRate,
      averageRating,
      score
    };
  }).sort((a, b) => b.score - a.score);
}

function statusBadge(status?: string): string {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'INVESTIGATING': return 'bg-blue-100 text-blue-700';
    case 'RESOLVED': return 'bg-green-100 text-green-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

@Component({
  selector: 'app-delivery-agents-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-8 bg-gray-50/60 min-h-screen space-y-6">
      <header class="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Delivery Management</p>
          <h1 class="text-3xl font-black text-dark mt-2">Delivery Agents</h1>
          <p class="text-gray-500 mt-1">Voir la liste des livreurs, leurs zones et leur charge actuelle.</p>
        </div>
        <div class="flex gap-2">
          <a routerLink="/admin/deliveries/performance" class="px-4 py-2.5 rounded-xl bg-dark text-white font-bold text-sm">Performance</a>
          <a routerLink="/admin/deliveries/warnings-rewards" class="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm">Warnings & Rewards</a>
        </div>
      </header>

      <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-widest text-gray-400">Agents</p>
          <p class="text-3xl font-black text-dark mt-2">{{ rows().length }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-widest text-gray-400">Active Assignments</p>
          <p class="text-3xl font-black text-blue-600 mt-2">{{ activeAssignments() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-widest text-gray-400">Delivered</p>
          <p class="text-3xl font-black text-green-600 mt-2">{{ deliveredTotal() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-widest text-gray-400">Open Reviews</p>
          <p class="text-3xl font-black text-amber-600 mt-2">{{ reviewTotal() }}</p>
        </div>
      </section>

      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <input [(ngModel)]="search" placeholder="Search agent, email, zone..." class="w-full md:w-96 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20">
          <button (click)="load()" class="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-sm">Refresh</button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500">
              <tr>
                <th class="px-6 py-4">Agent</th>
                <th class="px-6 py-4">Zone</th>
                <th class="px-6 py-4">Vehicle</th>
                <th class="px-6 py-4">Active</th>
                <th class="px-6 py-4">Delivered</th>
                <th class="px-6 py-4">Score</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Reviews</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (isLoading()) {
                <tr><td colspan="8" class="px-6 py-12 text-center text-gray-500">Loading delivery agents...</td></tr>
              } @else if (filteredRows().length === 0) {
                <tr><td colspan="8" class="px-6 py-12 text-center text-gray-500">No delivery agents found.</td></tr>
              } @else {
                @for (row of filteredRows(); track row.agent.id) {
                  <tr class="hover:bg-gray-50/70 transition">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="relative">
                          <div class="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                            {{ fullName(row.agent).charAt(0) }}
                          </div>
                          @if (getWrStats(row.agent.id)?.flagged) {
                            <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-black" title="Flagged agent">⚠</span>
                          } @else if (getWrStats(row.agent.id)?.elite) {
                            <span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center text-[8px]" title="Elite courier">⭐</span>
                          }
                        </div>
                        <div>
                          <p class="font-black text-dark">{{ fullName(row.agent) }}</p>
                          <p class="text-xs text-gray-500">{{ row.agent.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 font-bold text-sm">{{ row.agent.deliveryZone || 'Not configured' }}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ row.agent.vehicleType || 'Not set' }}</td>
                    <td class="px-6 py-4"><span class="font-black text-blue-600">{{ row.active }}</span></td>
                    <td class="px-6 py-4"><span class="font-black text-green-600">{{ row.delivered }}</span></td>
                    <td class="px-6 py-4">
                      <div class="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div class="h-full bg-primary" [style.width.%]="row.score"></div>
                      </div>
                      <p class="text-xs font-bold mt-1">{{ row.score }}/100</p>
                    </td>
                    <td class="px-6 py-4">
                      @if (getWrStats(row.agent.id)?.flagged) {
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest">🔴 FLAGGED</span>
                      } @else if (getWrStats(row.agent.id)?.elite) {
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">⭐ ELITE</span>
                      } @else {
                        <span class="text-xs text-gray-400 font-medium">⚠ {{ getWrStats(row.agent.id)?.warningCount || 0 }} / 🏅 {{ getWrStats(row.agent.id)?.rewardCount || 0 }}</span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <a routerLink="/admin/deliveries/reviews" class="text-primary font-black text-sm hover:underline">{{ row.reviews.length }} reviews</a>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DeliveryAgentsAdminComponent implements OnInit {
  private userService = inject(UserService);
  private savService = inject(SavService);
  private savAdminService = inject(SavAdminService);
  protected wrRegistry = inject(WrRegistryService);

  agents = signal<User[]>([]);
  deliveries = signal<Delivery[]>([]);
  claims = signal<SavClaim[]>([]);
  isLoading = signal(false);
  search = '';
  wrStatsMap = signal<Map<string, AgentWrStats>>(new Map());

  rows = computed(() => buildAgentRows(this.agents(), this.deliveries(), this.claims()));
  filteredRows = computed(() => {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter(row => [
      fullName(row.agent),
      row.agent.email,
      row.agent.deliveryZone,
      row.agent.vehicleType
    ].some(value => String(value || '').toLowerCase().includes(term)));
  });
  activeAssignments = computed(() => this.rows().reduce((sum, row) => sum + row.active, 0));
  deliveredTotal = computed(() => this.rows().reduce((sum, row) => sum + row.delivered, 0));
  reviewTotal = computed(() => this.claims().filter(claim => claim.targetType === 'DELIVERY_AGENT').length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    forkJoin({
      users: this.userService.getAllUsers({ role: UserRole.DELIVERY, limit: 500 }).pipe(catchError(() => of({ users: [] }))),
      deliveries: this.savService.getAllDeliveries().pipe(catchError(() => of([]))),
      claims: this.savAdminService.getAllSavClaims().pipe(catchError(() => of([]))),
      wrAll: this.wrRegistry.getAllStats().pipe(catchError(() => of([])))
    }).subscribe(({ users, deliveries, claims, wrAll }) => {
      this.agents.set(normalizeUsers(users).filter(isDeliveryAgent));
      this.deliveries.set(deliveries as Delivery[]);
      this.claims.set(claims as SavClaim[]);
      const map = new Map<string, AgentWrStats>();
      (wrAll as AgentWrStats[]).forEach(s => map.set(s.agentId, s));
      this.wrStatsMap.set(map);
      this.isLoading.set(false);
    });
  }

  getWrStats(agentId: string): AgentWrStats | undefined {
    return this.wrStatsMap().get(agentId);
  }

  fullName = fullName;
}

@Component({
  selector: 'app-agent-performance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8 bg-gray-50/60 min-h-screen space-y-6">
      <header class="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Delivery Management</p>
        <h1 class="text-3xl font-black text-dark mt-2">Agent Performance</h1>
        <p class="text-gray-500 mt-1">Analyse des statistiques de chaque livreur: taux de livraison, retours, refus et score.</p>
      </header>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        @for (row of rows().slice(0, 3); track row.agent.id) {
          <div class="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Top Courier</p>
                <h2 class="text-xl font-black text-dark mt-1">{{ fullName(row.agent) }}</h2>
                <p class="text-sm text-gray-500">{{ row.agent.deliveryZone || 'No zone' }}</p>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-black">{{ row.score }}</div>
            </div>
            <div class="mt-5 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl bg-blue-50 p-3"><p class="font-black text-blue-600">{{ row.active }}</p><p class="text-[10px] font-bold text-gray-500">Active</p></div>
              <div class="rounded-xl bg-green-50 p-3"><p class="font-black text-green-600">{{ row.delivered }}</p><p class="text-[10px] font-bold text-gray-500">Done</p></div>
              <div class="rounded-xl bg-red-50 p-3"><p class="font-black text-red-600">{{ row.refused + row.returned }}</p><p class="text-[10px] font-bold text-gray-500">Risk</p></div>
            </div>
          </div>
        }
      </section>

      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-black text-dark">Performance Matrix</h2>
          <a routerLink="/admin/deliveries/agents" class="text-primary text-sm font-black hover:underline">View agents</a>
        </div>
        <div class="space-y-4">
          @if (isLoading()) {
            <p class="text-center py-12 text-gray-500">Loading performance...</p>
          } @else {
            @for (row of rows(); track row.agent.id) {
              <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr_90px_90px_90px] gap-4 items-center border border-gray-100 rounded-2xl p-4">
                <div>
                  <p class="font-black text-dark">{{ fullName(row.agent) }}</p>
                  <p class="text-xs text-gray-500">{{ row.total }} total assignments</p>
                </div>
                <div>
                  <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary to-green-500" [style.width.%]="row.successRate"></div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Success rate {{ row.successRate }}%</p>
                </div>
                <div class="text-center"><p class="font-black text-green-600">{{ row.delivered }}</p><p class="text-[10px] text-gray-400 uppercase">Delivered</p></div>
                <div class="text-center"><p class="font-black text-amber-600">{{ row.refused }}</p><p class="text-[10px] text-gray-400 uppercase">Refused</p></div>
                <div class="text-center"><p class="font-black text-primary">{{ row.averageRating | number:'1.1-1' }}</p><p class="text-[10px] text-gray-400 uppercase">Rating</p></div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class AgentPerformanceComponent extends DeliveryAgentsAdminComponent {}

@Component({
  selector: 'app-agent-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8 bg-gray-50/60 min-h-screen space-y-6">
      <header class="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Linked with SAV</p>
          <h1 class="text-3xl font-black text-dark mt-2">Agent Reviews</h1>
          <p class="text-gray-500 mt-1">Claims clients concernant les livreurs. Ces dossiers sont reliés au module SAV.</p>
        </div>
        <div class="flex gap-2">
          <a routerLink="/admin/sav" class="px-4 py-2.5 rounded-xl bg-dark text-white font-bold text-sm">Open SAV</a>
          <a routerLink="/sav/claims/create" [queryParams]="{target:'delivery'}" class="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm">Client Claim Form</a>
        </div>
      </header>

      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-black text-dark">Delivery Agent Claims</h2>
          <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-black text-xs">{{ deliveryClaims().length }} reviews</span>
        </div>
        <div class="divide-y divide-gray-50">
          @if (isLoading()) {
            <p class="text-center py-12 text-gray-500">Loading reviews...</p>
          } @else if (deliveryClaims().length === 0) {
            <div class="p-12 text-center">
              <p class="text-5xl mb-3">⭐</p>
              <p class="font-black text-dark">No delivery agent reviews yet</p>
              <p class="text-gray-500 text-sm mt-1">When clients submit delivery agent claims from /sav, they will appear here.</p>
            </div>
          } @else {
            @for (claim of deliveryClaims(); track claim.id) {
              <article class="p-6 hover:bg-gray-50/70 transition">
                <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                      <span [ngClass]="statusBadge(claim.status)" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{{ claim.status || 'PENDING' }}</span>
                      <span class="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{{ claim.priority || 'MEDIUM' }}</span>
                      @if (claim.rating) { <span class="text-xs font-black text-amber-600">⭐ {{ claim.rating }}/5</span> }
                    </div>
                    <h3 class="font-black text-dark">{{ claim.reason }}</h3>
                    <p class="text-sm text-gray-600 mt-1">{{ claim.message }}</p>
                    <p class="text-xs text-gray-400 mt-2">Agent: {{ claim.deliveryAgentName || getAgentName(claim.deliveryAgentId) }} | Client: {{ claim.userName || claim.userId || 'Client' }}</p>
                  </div>
                  <a routerLink="/admin/sav" class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-dark font-bold text-sm">Handle in SAV</a>
                </div>
              </article>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class AgentReviewsComponent extends DeliveryAgentsAdminComponent {
  deliveryClaims = computed(() => this.claims().filter(claim => claim.targetType === 'DELIVERY_AGENT'));
  statusBadge = statusBadge;

  getAgentName(agentId?: string): string {
    const agent = this.agents().find(item => item.id === agentId);
    return agent ? fullName(agent) : 'Unknown agent';
  }
}

@Component({
  selector: 'app-warnings-rewards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 bg-gray-50/60 min-h-screen space-y-6">
      <header class="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Delivery Management</p>
        <h1 class="text-3xl font-black text-dark mt-2">Warnings & Rewards</h1>
        <p class="text-gray-500 mt-1">Issue warnings or rewards to agents. Agents with 3+ warnings are flagged; 3+ rewards earns Elite status.</p>
      </header>

      <!-- Status Board -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Code Red -->
        <div class="bg-white rounded-3xl border border-red-100 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl">🔴</div>
            <div>
              <p class="font-black text-dark">Code Red — Flagged Agents</p>
              <p class="text-xs text-gray-500">{{ flaggedAgents().length }} agent(s) with 3+ warnings</p>
            </div>
          </div>
          @if (flaggedAgents().length === 0) {
            <p class="text-sm text-gray-400 text-center py-4">No flagged agents ✅</p>
          } @else {
            <div class="space-y-3">
              @for (s of flaggedAgents(); track s.agentId) {
                <div class="flex items-center justify-between bg-red-50 rounded-2xl px-4 py-3 border border-red-100">
                  <div>
                    <p class="font-black text-dark text-sm">{{ s.agentName }}</p>
                    <p class="text-xs text-red-600 font-bold">⚠️ {{ s.warningCount }} warnings</p>
                  </div>
                  <button (click)="rehabilitate(s.agentId)" class="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-black hover:bg-red-600 hover:text-white transition-all">
                    Rehabilitate
                  </button>
                </div>
              }
            </div>
          }
        </div>
        <!-- Elite -->
        <div class="bg-white rounded-3xl border border-amber-100 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">⭐</div>
            <div>
              <p class="font-black text-dark">Elite Couriers</p>
              <p class="text-xs text-gray-500">{{ eliteAgents().length }} agent(s) with 3+ rewards</p>
            </div>
          </div>
          @if (eliteAgents().length === 0) {
            <p class="text-sm text-gray-400 text-center py-4">No elite agents yet — keep rewarding! 🏅</p>
          } @else {
            <div class="space-y-3">
              @for (s of eliteAgents(); track s.agentId) {
                <div class="flex items-center justify-between bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
                  <div>
                    <p class="font-black text-dark text-sm">{{ s.agentName }}</p>
                    <p class="text-xs text-amber-600 font-bold">🏅 {{ s.rewardCount }} rewards</p>
                  </div>
                  <span class="px-3 py-1 rounded-xl bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest">ELITE</span>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-3">
          <h2 class="text-lg font-black text-dark">Agent Decision Board</h2>
          @for (row of rows(); track row.agent.id) {
            <button (click)="selectAgent(row)" class="w-full text-left rounded-2xl border p-4 transition-all"
                    [ngClass]="selectedAgentId() === row.agent.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'">
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">{{ fullName(row.agent).charAt(0) }}</div>
                    @if (getWrStats(row.agent.id)?.flagged) {
                      <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border border-white"></span>
                    } @else if (getWrStats(row.agent.id)?.elite) {
                      <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border border-white"></span>
                    }
                  </div>
                  <div>
                    <p class="font-black text-dark text-sm">{{ fullName(row.agent) }}</p>
                    <p class="text-xs text-gray-500">⚠️ {{ getWrStats(row.agent.id)?.warningCount || 0 }} warnings &nbsp;·&nbsp; 🏅 {{ getWrStats(row.agent.id)?.rewardCount || 0 }} rewards</p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-black" [ngClass]="row.score >= 75 ? 'text-green-600' : row.score >= 45 ? 'text-amber-600' : 'text-red-600'">{{ row.score }}</p>
                  <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Score</p>
                </div>
              </div>
            </button>
          }
        </div>

        <form (ngSubmit)="sendAction()" class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-fit space-y-5">
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-gray-400">Selected Agent</p>
            <h2 class="text-xl font-black text-dark mt-1">{{ selectedRow() ? fullName(selectedRow()!.agent) : 'Choose an agent' }}</h2>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button type="button" (click)="actionType.set('WARNING')" class="rounded-2xl border p-4 font-black text-sm transition-all"
                    [ngClass]="actionType() === 'WARNING' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'">
              ⚠️ Warning
            </button>
            <button type="button" (click)="actionType.set('REWARD')" class="rounded-2xl border p-4 font-black text-sm transition-all"
                    [ngClass]="actionType() === 'REWARD' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600'">
              🏅 Reward
            </button>
          </div>

          <div>
            <label class="text-xs font-black uppercase tracking-widest text-gray-400">Message</label>
            <textarea [(ngModel)]="message" name="message" rows="4" class="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-primary/20" [placeholder]="placeholder()"></textarea>
          </div>

          <button type="submit" [disabled]="!selectedRow() || isSending()" class="w-full py-3 rounded-2xl bg-primary text-white font-black disabled:opacity-50">
            {{ isSending() ? 'Sending...' : 'Send to Agent' }}
          </button>

          @if (lastAction()) {
            <div class="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p class="text-xs font-black uppercase tracking-widest text-gray-400">Last Action</p>
              <p class="text-sm font-bold text-dark mt-1">{{ lastAction() }}</p>
            </div>
          }
        </form>
      </section>
    </div>
  `
})
export class WarningsRewardsComponent extends DeliveryAgentsAdminComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private notificationUrl = `${environment.apiUrl}/legacy/notifications`;

  selectedAgentId = signal<string>('');
  actionType = signal<DeliveryActionType>('WARNING');
  isSending = signal(false);
  lastAction = signal<string>('');
  message = '';

  selectedRow = computed(() => this.rows().find(row => row.agent.id === this.selectedAgentId()) || null);
  flaggedAgents = computed(() => Array.from(this.wrStatsMap().values()).filter(s => s.flagged));
  eliteAgents = computed(() => Array.from(this.wrStatsMap().values()).filter(s => s.elite));

  selectAgent(row: AgentRow): void {
    this.selectedAgentId.set(row.agent.id);
    if (!this.message.trim()) {
      this.message = this.placeholder();
    }
  }

  placeholder(): string {
    const row = this.selectedRow();
    if (this.actionType() === 'REWARD') {
      return row ? `Great work. Your delivery score is ${row.score}/100 with ${row.delivered} completed deliveries.` : 'Write a reward message...';
    }
    return row ? `Please improve delivery handling. Current score: ${row.score}/100, refused/returned cases: ${row.refused + row.returned}.` : 'Write a warning message...';
  }

  sendAction(): void {
    const row = this.selectedRow();
    if (!row) return;

    const type = this.actionType();
    const description = this.message.trim() || this.placeholder();
    const agentId = row.agent.id;
    const agentName = fullName(row.agent);
    const agentEmail = row.agent.email || '';

    const notifPayload = {
      title: type === 'WARNING' ? '⚠️ Delivery Performance Warning' : '🏅 Courier Performance Reward',
      description,
      type: 'INTERNAL_NOTIFICATION',
      linkedObjectId: agentId
    };

    this.isSending.set(true);

    const wrCall = type === 'WARNING'
      ? this.wrRegistry.addWarning(agentId, agentName, agentEmail, description)
      : this.wrRegistry.addReward(agentId, agentName, agentEmail, description);

    wrCall.subscribe({
      next: (updatedStats) => {
        const map = new Map(this.wrStatsMap());
        map.set(agentId, updatedStats);
        this.wrStatsMap.set(map);

        this.http.post(`${this.notificationUrl}?userId=${agentId}`, notifPayload).subscribe();

        this.isSending.set(false);
        this.lastAction.set(`${type} sent to ${agentName}`);
        this.toastService.success(
          updatedStats.flagged ? `⚠️ ${agentName} is now FLAGGED (${updatedStats.warningCount} warnings)` :
          updatedStats.elite   ? `⭐ ${agentName} reached ELITE status!` :
          `${type} sent to ${agentName}`
        );
      },
      error: () => {
        this.isSending.set(false);
        this.toastService.error('Failed to send action');
      }
    });
  }

  rehabilitate(agentId: string): void {
    this.wrRegistry.rehabilitate(agentId).subscribe({
      next: (updated) => {
        const map = new Map(this.wrStatsMap());
        map.set(agentId, updated);
        this.wrStatsMap.set(map);
        this.toastService.success('Agent rehabilitated — warnings cleared.');
      },
      error: () => this.toastService.error('Rehabilitation failed')
    });
  }
}
