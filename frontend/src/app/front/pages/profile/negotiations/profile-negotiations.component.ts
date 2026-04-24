import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NegotiationService } from '../../../core/negotiation.service';
import { AuthService } from '../../../core/auth.service';
import { CartService } from '../../../core/cart.service';
import { NegotiationResponse, NegotiationStatus } from '../../../models/negotiation.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-profile-negotiations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
    .animate-zoomIn { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  `],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black" style="color:var(--text-color)">
            {{ isProvider() ? '🏪 Received Offers' : '🤝 My Negotiations' }}
          </h2>
          <p class="text-sm mt-0.5" style="color:var(--muted)">
            {{ isProvider() ? 'Offers from buyers on your products' : 'Track and manage your price negotiations' }}
          </p>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary">
          {{ negotiations().length }} total
        </span>
      </div>

      <!-- Filter and Sort tabs -->
      <div class="flex flex-col md:flex-row gap-3 justify-between">
        <div class="flex gap-2 flex-wrap">
          @for (f of filters; track f.value) {
            <button (click)="activeFilter.set(f.value)"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              [class.bg-primary]="activeFilter() === f.value"
              [class.text-white]="activeFilter() === f.value"
              [style.background-color]="activeFilter() !== f.value ? 'var(--subtle)' : ''"
              [style.color]="activeFilter() !== f.value ? 'var(--muted)' : ''">
              {{ f.label }}
            </button>
          }
        </div>
        
        <div class="flex gap-2 items-center">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Sort By:</span>
          <button (click)="activeSort.set('newest')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
            [class.bg-gray-900]="activeSort() === 'newest'"
            [class.text-white]="activeSort() === 'newest'"
            [style.border-color]="activeSort() === 'newest' ? 'black' : 'var(--border)'">
            Newest
          </button>
          <button (click)="activeSort.set('oldest')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
            [class.bg-gray-900]="activeSort() === 'oldest'"
            [class.text-white]="activeSort() === 'oldest'"
            [style.border-color]="activeSort() === 'oldest' ? 'black' : 'var(--border)'">
            Oldest
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-28 rounded-2xl animate-pulse" style="background-color:var(--subtle)"></div>
          }
        </div>
      }

      <!-- Empty -->
      @else if (filtered().length === 0) {
        <div class="rounded-2xl p-12 text-center" style="background-color:var(--card-bg);border:1px solid var(--border)">
          <div class="text-5xl mb-3">🤝</div>
          <h3 class="font-black text-lg" style="color:var(--text-color)">No negotiations yet</h3>
          <p class="text-sm mt-1" style="color:var(--muted)">Browse products and make an offer to start negotiating</p>
        </div>
      }

      <!-- List -->
      @else {
        <div class="space-y-3">
          @for (neg of filtered(); track neg.id) {
            <div [id]="'neg-' + neg.id"
                 class="rounded-2xl p-5 transition-all duration-500 relative overflow-hidden" 
                 [class.ring-4]="highlightedId() === neg.id"
                 [class.ring-accent/40]="highlightedId() === neg.id"
                 [class.scale-[1.02]]="highlightedId() === neg.id"
                 style="background-color:var(--card-bg);border:1px solid var(--border)">
              
              @if (isNew(neg)) {
                <div class="absolute top-0 left-0 w-16 h-16 pointer-events-none">
                  <div class="absolute top-2 -left-8 w-24 bg-accent text-white text-[9px] font-black py-0.5 text-center -rotate-45 shadow-sm uppercase tracking-widest">NEW</div>
                </div>
              }

              <div class="flex items-start justify-between gap-3 mb-3">
                <!-- Product info -->
                <div class="flex-1 min-w-0">
                  <p class="font-black truncate" style="color:var(--text-color)">
                    {{ neg.productName || neg.serviceName || 'Product' }}
                  </p>
                  <p class="text-xs mt-0.5" style="color:var(--muted)">
                    Original: <span class="font-bold">{{ (neg.productOriginalPrice || neg.serviceOriginalPrice || 0) | number:'1.0-2' }} TND</span>
                    &nbsp;·&nbsp; {{ neg.createdAt | date:'MMM d, HH:mm' }}
                  </p>
                </div>
                <!-- Status badge -->
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black shrink-0"
                  [class.bg-yellow-100]="neg.status === 'PENDING' || neg.status === 'IN_PROGRESS'"
                  [class.text-yellow-800]="neg.status === 'PENDING' || neg.status === 'IN_PROGRESS'"
                  [class.bg-green-100]="neg.status === 'ACCEPTED'"
                  [class.text-green-800]="neg.status === 'ACCEPTED'"
                  [class.bg-red-100]="neg.status === 'REJECTED' || neg.status === 'CANCELLED'"
                  [class.text-red-800]="neg.status === 'REJECTED' || neg.status === 'CANCELLED'"
                  [class.bg-gray-100]="neg.status === 'CLOSED'"
                  [class.text-gray-600]="neg.status === 'CLOSED'">
                  {{ neg.status }}
                </span>
              </div>

              <!-- Latest proposal summary -->
              @if (neg.proposals && neg.proposals.length > 0) {
                <div class="mb-4 p-3 rounded-xl text-sm" style="background-color:var(--subtle)">
                  <div class="flex items-center justify-between">
                    <span style="color:var(--muted)" class="text-xs font-bold uppercase tracking-tighter">
                      {{ isProvider() ? (latestProposal(neg).senderId === neg.clientId ? '🧑 Buyer offer' : '🏪 Your counter') : (latestProposal(neg).senderId === neg.clientId ? '🧑 Your offer' : '🏪 Seller counter') }}
                    </span>
                    <div class="flex items-center gap-2">
                      @if ((latestProposal(neg).quantity || 0) > 1) {
                        <span class="text-[10px] font-bold text-gray-400">x{{ latestProposal(neg).quantity }}</span>
                      }
                      @if (latestProposal(neg).isExchange) {
                        <span class="px-1.5 py-0.5 bg-accent/10 text-accent text-[9px] font-black rounded uppercase tracking-tighter">🔄 Exchange</span>
                      }
                      <span class="font-black text-primary text-base">{{ latestProposal(neg).amount }} TND</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Action buttons -->
              <div class="flex items-center justify-between gap-2 flex-wrap mt-2">
                <div class="flex gap-2">
                  @if (neg.status === 'IN_PROGRESS' || neg.status === 'PENDING') {
                    @if (isProvider() || latestProposal(neg).senderId !== neg.clientId) {
                      <button (click)="accept(neg.id)"
                        [disabled]="actionLoading() === neg.id"
                        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm">
                        ✓ Accept
                      </button>
                      <button (click)="reject(neg.id)"
                        [disabled]="actionLoading() === neg.id"
                        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm">
                        ✕ Reject
                      </button>
                    }
                    <button (click)="openCounter(neg)"
                      [disabled]="actionLoading() === neg.id"
                      class="px-4 py-2 font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-gray-200"
                      style="background-color:var(--subtle);color:var(--text-color)">
                      ↩ Counter
                    </button>
                    @if (!isProvider()) {
                      <button (click)="cancel(neg.id)"
                        [disabled]="actionLoading() === neg.id"
                        class="px-4 py-2 text-gray-400 hover:text-red-500 font-bold text-xs rounded-xl transition-all">
                        Cancel
                      </button>
                    }
                  }
                </div>
                
                <button (click)="expandedId.set(expandedId() === neg.id ? null : neg.id)"
                  class="px-4 py-2 bg-primary/5 text-primary font-black text-xs rounded-xl hover:bg-primary/10 transition-all flex items-center gap-2">
                  {{ expandedId() === neg.id ? '🔼 Hide Details' : '🔍 More Details' }}
                </button>
              </div>

              <!-- Detailed View (Expanded) -->
              @if (expandedId() === neg.id) {
                <div class="mt-6 pt-6 border-t border-dashed border-gray-200 space-y-6 animate-fadeIn">
                  
                  <!-- Product Context -->
                  <div class="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Item Specifications</h4>
                    <p class="text-xs text-gray-700 leading-relaxed italic">
                      {{ neg.itemDescription || 'No description available for this item.' }}
                    </p>
                  </div>

                  <!-- Trade-in Consultation (if latest is exchange) -->
                  @if (latestProposal(neg).isExchange) {
                    <div class="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl shadow-sm">
                      <div class="flex items-start gap-4">
                        @if (latestProposal(neg).exchangeImage) {
                          <div class="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shrink-0 shadow-md group relative cursor-zoom-in" 
                            (click)="selectedZoomImage.set(latestProposal(neg).exchangeImage || null)">
                             <img [src]="latestProposal(neg).exchangeImage" class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110">
                             <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <span class="text-white text-[10px] font-black tracking-widest">ZOOM</span>
                             </div>
                          </div>
                        }
                        <div class="flex-1 pt-1">
                          <p class="text-[11px] font-black text-accent uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                            Exchange Proposal
                          </p>
                          <p class="text-xs text-gray-700 leading-relaxed">
                            Offering an item exchange 
                            @if (latestProposal(neg).amount > 0) { plus <strong>{{ latestProposal(neg).amount }} TND</strong> }
                            for <strong>{{ latestProposal(neg).quantity || 1 }} unit(s)</strong>.
                          </p>
                          @if (latestProposal(neg).message) {
                            <p class="mt-2 text-[11px] text-gray-500 italic bg-white/40 p-2 rounded-lg border border-accent/5">"{{ latestProposal(neg).message }}"</p>
                          }
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Negotiation History -->
                  <div>
                    <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Full Discussion History</h4>
                    <div class="pl-4 border-l-2 border-primary/10 space-y-6">
                      @for (prop of neg.proposals; track $index) {
                        <div class="relative">
                          <div class="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                          <div class="flex items-center justify-between mb-1">
                            <span class="text-[10px] font-bold uppercase" style="color:var(--muted)">
                              {{ prop.senderId === neg.clientId ? '🧑 Buyer' : '🏪 Seller' }} 
                              &nbsp;·&nbsp; {{ prop.createdAt | date:'MMM d, HH:mm' }}
                            </span>
                            <span class="font-black text-primary text-xs">{{ prop.amount }} TND @if((prop.quantity || 0) > 1){<span class="text-gray-400 font-normal"> (x{{prop.quantity}})</span>}</span>
                          </div>
                          @if (prop.message) {
                            <p class="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg italic">"{{ prop.message }}"</p>
                          }
                          @if (prop.isExchange && prop.exchangeImage) {
                            <div class="mt-2 w-12 h-12 rounded-lg overflow-hidden border border-gray-100 cursor-zoom-in" (click)="selectedZoomImage.set(prop.exchangeImage)">
                              <img [src]="prop.exchangeImage" class="w-full h-full object-cover">
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Error and Success Messages -->
              @if (actionError() && actionErrorId() === neg.id) {
                <p class="text-xs text-red-500 font-semibold mt-4 p-3 bg-red-50 rounded-xl border border-red-100">⚠️ {{ actionError() }}</p>
              }
              @if (neg.status === 'ACCEPTED' && !isProvider()) {
                <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between gap-4 animate-fadeIn">
                  <span class="text-sm font-bold text-green-700 flex-1">✅ Offer accepted! Your item is in the cart.</span>
                  <div class="flex gap-2 shrink-0">
                    <button (click)="router.navigate(['/cart'])" class="px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl shadow-sm">Go to Cart</button>
                    <button (click)="buyNowFromAccepted(neg)" class="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-md">⚡ Buy Now</button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Counter offer modal -->
    @if (counterTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeCounter()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl" (click)="$event.stopPropagation()">
          <button (click)="closeCounter()" class="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold">✕</button>

          <h3 class="text-xl font-black text-gray-900 mb-1">Counter Offer</h3>
          <p class="text-sm text-gray-500 mb-6">
            {{ counterTarget()!.productName || counterTarget()!.serviceName }}
            &nbsp;·&nbsp; Original: <span class="font-bold text-primary">{{ counterTarget()!.productOriginalPrice || counterTarget()!.serviceOriginalPrice }} TND</span>
          </p>

          <form [formGroup]="counterForm" (ngSubmit)="submitCounter()" class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Price (TND)</label>
                <input type="number" formControlName="amount" min="0" step="0.5"
                  class="w-full h-12 px-4 bg-gray-50 border-2 rounded-xl text-lg font-black text-primary transition-all focus:outline-none focus:bg-white focus:border-primary disabled:opacity-40"
                  [class.border-red-400]="counterForm.get('amount')?.invalid && counterForm.get('amount')?.touched"
                  [class.border-transparent]="!(counterForm.get('amount')?.invalid && counterForm.get('amount')?.touched)"
                  placeholder="0.00">
              </div>
              <div class="w-24">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Quantity</label>
                <input type="number" formControlName="quantity" min="1" max="999"
                  class="w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl text-lg font-black text-center focus:outline-none focus:bg-white focus:border-primary">
              </div>
            </div>

            <!-- Exchange Toggle -->
            <div class="p-4 rounded-2xl border-2 transition-all" 
                 [class.bg-accent/5]="counterForm.get('isExchange')?.value"
                 [class.border-accent]="counterForm.get('isExchange')?.value"
                 [class.border-gray-100]="!counterForm.get('isExchange')?.value">
              <label class="flex items-center justify-between cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-xl">🔄</span>
                  <div>
                    <p class="text-xs font-black text-gray-900">Propose an Exchange</p>
                    <p class="text-[10px] text-gray-500">Trade your item instead</p>
                  </div>
                </div>
                <input type="checkbox" formControlName="isExchange" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent relative"></div>
              </label>

              @if (counterForm.get('isExchange')?.value) {
                <div class="mt-4 pt-4 border-t border-accent/10 animate-fadeIn">
                  <div class="flex items-center gap-4">
                    <label class="flex-1 h-24 border-2 border-dashed border-accent/30 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-accent/5 transition-all overflow-hidden relative">
                      @if (exchangePreview()) {
                        <img [src]="exchangePreview()" class="absolute inset-0 w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span class="text-white text-[10px] font-black uppercase">Change Photo</span>
                        </div>
                      } @else {
                        <span class="text-xl">📸</span>
                        <span class="text-[10px] font-black text-accent uppercase">Upload Photo</span>
                      }
                      <input type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">
                    </label>
                    <div class="flex-1">
                      <p class="text-[10px] font-medium text-accent leading-tight">Please upload a clear photo of the item you want to trade-in.</p>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Message <span class="normal-case font-normal">(optional)</span></label>
              <textarea formControlName="message" rows="2" maxlength="300"
                class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm resize-none focus:outline-none focus:bg-white focus:border-primary"
                placeholder="Explain your offer..."></textarea>
            </div>

            @if (counterError()) {
              <p class="text-sm text-red-600 font-semibold bg-red-50 p-3 rounded-xl">⚠️ {{ counterError() }}</p>
            }

            <button type="submit" [disabled]="counterForm.invalid || isSubmittingCounter()"
              class="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2">
              @if (isSubmittingCounter()) {
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              } @else { 🔄 Send Counter Offer }
            </button>
          </form>
        </div>
      </div>
    }

    <!-- Image zoom modal -->
    @if (selectedZoomImage()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" (click)="selectedZoomImage.set(null)">
        <button class="absolute top-8 right-8 text-white text-4xl hover:scale-110 transition-transform">×</button>
        <img [src]="selectedZoomImage()!" class="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-zoomIn" (click)="$event.stopPropagation()">
      </div>
    }
  `
})
export class ProfileNegotiationsComponent implements OnInit {
  private negotiationService = inject(NegotiationService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  readonly router = inject(Router);
  private fb = inject(FormBuilder);
  private activatedRoute = inject(ActivatedRoute);

  isProvider = () => {
    const r = this.authService.userRole() as string;
    return r === 'PROVIDER' || r === 'SELLER';
  };

  negotiations = signal<NegotiationResponse[]>([]);
  isLoading = signal(true);
  activeFilter = signal<string>('all');
  activeSort = signal<'newest' | 'oldest'>('newest');
  actionLoading = signal<string | null>(null);
  actionError = signal<string | null>(null);
  actionErrorId = signal<string | null>(null);

  counterTarget = signal<NegotiationResponse | null>(null);
  expandedId = signal<string | null>(null);
  highlightedId = signal<string | null>(null);
  
  exchangePreview = signal<string | null>(null);
  exchangeBase64 = signal<string | null>(null);
  counterForm!: FormGroup;
  isSubmittingCounter = signal(false);
  counterError = signal<string | null>(null);
  readonly selectedZoomImage = signal<string | null>(null);

  filters = [
    { value: 'all', label: '📋 All' },
    { value: 'active', label: '⏳ Active' },
    { value: 'ACCEPTED', label: '✅ Accepted' },
    { value: 'REJECTED', label: '❌ Rejected' },
  ];

  isNew = (neg: NegotiationResponse) => {
    if (neg.status !== 'PENDING' && neg.status !== 'IN_PROGRESS') return false;
    const createdAt = new Date(neg.createdAt).getTime();
    const now = new Date().getTime();
    return (now - createdAt) < 24 * 60 * 60 * 1000; // 24 hours
  };

  filtered = () => {
    const f = this.activeFilter();
    const sort = this.activeSort();
    let list = [...this.negotiations()];

    // Filter
    if (f === 'active') {
      list = list.filter(n => n.status === 'PENDING' || n.status === 'IN_PROGRESS');
    } else if (f !== 'all') {
      list = list.filter(n => n.status === f);
    }

    // Sort
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return list;
  };

  ngOnInit(): void {
    this.counterForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      isExchange: [false],
      exchangeImage: [null],
      message: ['', Validators.maxLength(300)]
    });
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    const role = this.authService.userRole();
    const isProvider = role === 'PROVIDER' || role === 'SELLER' || (role as string) === 'SELLER';

    const source = isProvider
      ? this.negotiationService.getIncomingNegociations() // Provider sees offers received
      : this.negotiationService.getAll();                 // Client sees offers made

    source.pipe(catchError(() => of({ negotiations: [] }))).subscribe(res => {
      this.negotiations.set(res.negotiations as NegotiationResponse[]);
      this.isLoading.set(false);
      
      // Check for highlight ID from query params
      this.activatedRoute.queryParams.subscribe(params => {
        if (params['id']) {
          this.highlightedId.set(params['id']);
          setTimeout(() => {
            const el = document.getElementById('neg-' + params['id']);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      });
    });
  }

  latestProposal(neg: NegotiationResponse) {
    return neg.proposals[neg.proposals.length - 1] ?? { senderId: neg.clientId, amount: 0 };
  }

  accept(id: string): void {
    this.actionLoading.set(id);
    this.actionError.set(null);
    this.negotiationService.accept(id).subscribe({
      next: (updated) => {
        this.negotiations.update(list => list.map(n => n.id === id ? updated : n));
        this.actionLoading.set(null);
        // Only add to cart if the current user is the buyer (client), not the provider
        if (!this.isProvider()) {
          this.addAcceptedToCart(updated);
        }
      },
      error: (err) => {
        console.error('❌ Accept failed:', err);
        this.actionError.set(err.error?.message || 'Failed to accept');
        this.actionErrorId.set(id);
        this.actionLoading.set(null);
      }
    });
  }

  private addAcceptedToCart(neg: NegotiationResponse): void {
    // productId is set when item is a Product, serviceId when it's a Service
    // The negotiation was created with serviceId = productId (backend resolves both)
    const productId = neg.productId || neg.serviceId;
    const negotiatedPrice = this.latestProposal(neg).amount;

    console.log('🛒 addAcceptedToCart — productId:', productId, '| negotiatedPrice:', negotiatedPrice);

    if (!productId) {
      console.error('❌ Cannot add to cart: no productId or serviceId on negotiation', neg);
      this.actionError.set('Negotiation accepted but could not add to cart: product ID missing.');
      this.actionErrorId.set(neg.id);
      return;
    }

    this.cartService.addItem({ productId, quantity: 1, negotiatedPrice }).subscribe({
      next: (item) => {
        console.log('✅ Added to cart at negotiated price:', item);
      },
      error: (err) => {
        console.error('❌ Add to cart failed:', err);
        this.actionError.set(
          err.error?.message || err.error?.fieldErrors
            ? JSON.stringify(err.error?.fieldErrors)
            : 'Negotiation accepted but failed to add to cart.'
        );
        this.actionErrorId.set(neg.id);
      }
    });
  }

  buyNowFromAccepted(neg: NegotiationResponse): void {
    const productId = neg.productId || neg.serviceId;
    const negotiatedPrice = this.latestProposal(neg).amount;

    if (!productId) return;

    this.cartService.addItem({ productId, quantity: 1, negotiatedPrice }).subscribe({
      next: () => {
        this.router.navigate(['/cart'], { queryParams: { step: 'PLACE_ORDER' } });
      },
      error: () => {
        this.actionError.set('Buy Now failed. Please try adding to cart manually.');
        this.actionErrorId.set(neg.id);
      }
    });
  }

  reject(id: string): void {
    this.actionLoading.set(id);
    this.actionError.set(null);
    this.negotiationService.reject(id).subscribe({
      next: (updated) => {
        this.negotiations.update(list => list.map(n => n.id === id ? updated : n));
        this.actionLoading.set(null);
      },
      error: (err) => {
        this.actionError.set(err.error?.message || 'Failed to reject');
        this.actionErrorId.set(id);
        this.actionLoading.set(null);
      }
    });
  }

  cancel(id: string): void {
    this.actionLoading.set(id);
    this.negotiationService.cancel(id).subscribe({
      next: () => {
        this.negotiations.update(list => list.filter(n => n.id !== id));
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  openCounter(neg: NegotiationResponse): void {
    this.counterTarget.set(neg);
    this.counterError.set(null);
    const latest = this.latestProposal(neg);
    this.counterForm.patchValue({ 
      amount: latest.amount, 
      quantity: latest.quantity || 1,
      isExchange: false,
      message: '' 
    });
    this.exchangePreview.set(null);
    this.exchangeBase64.set(null);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.exchangePreview.set(base64);
      this.exchangeBase64.set(base64);
      this.counterForm.patchValue({ exchangeImage: base64 });
    };
    reader.readAsDataURL(file);
  }

  submitCounter(): void {
    if (this.counterForm.invalid) { this.counterForm.markAllAsTouched(); return; }
    const neg = this.counterTarget();
    if (!neg) return;
    this.isSubmittingCounter.set(true);
    this.counterError.set(null);
    
    const { amount, quantity, isExchange, exchangeImage, message } = this.counterForm.value;
    
    this.negotiationService.submitCounterProposal({ 
      negotiationId: neg.id, 
      amount,
      quantity,
      isExchange,
      exchangeImage: isExchange ? (this.exchangeBase64() || undefined) : undefined,
      message: message || undefined 
    }).subscribe({
      next: (updated) => {
        this.negotiations.update(list => list.map(n => n.id === neg.id ? updated : n));
        this.isSubmittingCounter.set(false);
        this.closeCounter();
      },
      error: (err) => {
        this.counterError.set(err.error?.message || 'Failed to send counter offer');
        this.isSubmittingCounter.set(false);
      }
    });
  }

  closeCounter(): void {
    this.counterTarget.set(null);
    this.counterForm.reset();
    this.counterError.set(null);
    this.exchangePreview.set(null);
    this.exchangeBase64.set(null);
  }
}
