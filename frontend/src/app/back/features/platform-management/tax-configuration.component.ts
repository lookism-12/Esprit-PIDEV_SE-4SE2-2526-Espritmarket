import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxConfigService, TaxConfig } from './tax-config.service';

@Component({
  selector: 'app-tax-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ══ Header ══════════════════════════════════════════════════════════ -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span class="text-3xl">🧾</span>
              Tax Configuration (TVA)
            </h1>
            <p class="text-gray-500 mt-1 text-sm">
              Manage TVA rates for Tunisia. One rate is set as Default and applied at checkout.
              If no config exists, the system falls back to <strong>19%</strong>.
            </p>
          </div>
          <button (click)="openCreateForm()"
                  class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-xl font-semibold text-sm hover:from-red-800 hover:to-red-700 transition-all shadow-lg hover:shadow-red-200">
            <span class="text-lg">➕</span> Add Tax Rate
          </button>
        </div>
      </div>

      <!-- ══ Effective TVA Banner ═══════════════════════════════════════════ -->
      <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-5">
        <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">✅</div>
        <div class="flex-1">
          <p class="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Currently Applied at Checkout</p>
          @if (effective()) {
            <p class="text-2xl font-black text-emerald-800">
              {{ effective()!.name }}
              <span class="ml-3 text-lg font-bold text-emerald-600">{{ (effective()!.rate * 100).toFixed(0) }}%</span>
            </p>
            <p class="text-xs text-emerald-500 mt-1">{{ effective()!.description }}</p>
          } @else {
            <p class="text-lg font-bold text-emerald-700">TVA Standard (default fallback) — 19%</p>
          }
        </div>
        <div class="text-right flex-shrink-0">
          <p class="text-xs text-gray-400 mb-1">Example (HT = 1000 TND)</p>
          <p class="text-sm font-semibold text-gray-600">TVA = <span class="text-red-600">{{ exampleTva() }} TND</span></p>
          <p class="text-sm font-bold text-gray-800">TTC = {{ exampleTtc() }} TND</p>
        </div>
      </div>

      <!-- ══ Alerts ═════════════════════════════════════════════════════════ -->
      @if (successMsg()) {
        <div class="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center gap-3 text-green-800 font-semibold text-sm">
          <span>✅</span> {{ successMsg() }}
        </div>
      }
      @if (errorMsg()) {
        <div class="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3 text-red-800 font-semibold text-sm">
          <span>❌</span> {{ errorMsg() }}
        </div>
      }

      <!-- ══ Table ══════════════════════════════════════════════════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 class="text-white font-bold text-lg flex items-center gap-2">
            <span>📋</span> All TVA Configurations
          </h2>
          <button (click)="load()" class="text-gray-300 hover:text-white text-sm flex items-center gap-1 transition-colors">
            <span class="text-base">🔄</span> Refresh
          </button>
        </div>

        @if (isLoading()) {
          <div class="p-16 text-center">
            <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-red-700 border-t-transparent mb-4"></div>
            <p class="text-gray-400 font-semibold text-sm">Loading configurations...</p>
          </div>
        } @else if (configs().length === 0) {
          <div class="p-16 text-center">
            <div class="text-6xl mb-4">🧾</div>
            <p class="text-gray-500 font-semibold">No TVA configs yet.</p>
            <p class="text-gray-400 text-sm mt-1">The system will use the default 19% fallback until you create one.</p>
            <button (click)="openCreateForm()"
                    class="mt-5 px-6 py-2 bg-red-700 text-white rounded-xl font-bold text-sm hover:bg-red-800 transition-all">
              ➕ Create First TVA
            </button>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Name</th>
                  <th class="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Rate</th>
                  <th class="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">HT Example</th>
                  <th class="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Default</th>
                  <th class="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th class="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (cfg of configs(); track cfg.id) {
                  <tr class="hover:bg-gray-50 transition-colors" [class.bg-emerald-50]="cfg.isDefault">
                    <td class="px-6 py-4">
                      <div class="font-bold text-gray-900">{{ cfg.name }}</div>
                      @if (cfg.description) {
                        <div class="text-xs text-gray-400 mt-0.5">{{ cfg.description }}</div>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-2xl font-black text-red-700">{{ (cfg.rate * 100).toFixed(0) }}%</span>
                    </td>
                    <td class="px-6 py-4 text-gray-600 text-xs leading-relaxed">
                      <div>HT&nbsp;&nbsp; = 1000 TND</div>
                      <div>TVA = <span class="font-bold text-red-600">{{ (1000 * cfg.rate).toFixed(2) }} TND</span></div>
                      <div>TTC = <span class="font-bold text-gray-800">{{ (1000 + 1000 * cfg.rate).toFixed(2) }} TND</span></div>
                    </td>
                    <td class="px-6 py-4">
                      @if (cfg.isDefault) {
                        <span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-300">
                          ⭐ DEFAULT
                        </span>
                      } @else {
                        <button (click)="setDefault(cfg)"
                                [disabled]="!cfg.active || isBusy()"
                                class="text-xs text-gray-400 hover:text-emerald-700 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                          ☆ Set Default
                        </button>
                      }
                    </td>
                    <td class="px-6 py-4">
                      @if (cfg.active) {
                        <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">🟢 Active</span>
                      } @else {
                        <span class="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">⚫ Inactive</span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <button (click)="openEditForm(cfg)"
                                class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"
                                title="Edit">✏️</button>
                        <button (click)="toggle(cfg)"
                                [disabled]="isBusy()"
                                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                                [class.bg-yellow-50]="cfg.active" [class.text-yellow-600]="cfg.active"
                                [class.bg-green-50]="!cfg.active" [class.text-green-600]="!cfg.active"
                                [title]="cfg.active ? 'Deactivate' : 'Activate'">
                          {{ cfg.active ? '🔕' : '🔔' }}
                        </button>
                        <button (click)="confirmDelete(cfg)"
                                [disabled]="cfg.isDefault || isBusy()"
                                class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- ══ Info card ══════════════════════════════════════════════════════ -->
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div class="flex items-start gap-4">
          <span class="text-2xl">💡</span>
          <div class="text-sm text-amber-800 space-y-1">
            <p class="font-bold">How TVA works in this system</p>
            <p>• The <strong>Default</strong> rate is automatically applied at checkout: <code class="bg-amber-100 px-1 rounded">TTC = HT + (HT × rate)</code></p>
            <p>• If no config exists, the system uses <strong>19%</strong> (TVA standard Tunisie).</p>
            <p>• The rate also appears on generated PDF invoices.</p>
            <p>• You cannot delete or deactivate the Default config — set another as default first.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ Modal: Create / Edit ══════════════════════════════════════════════ -->
    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
           (click)="closeForm()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <span>{{ editingId() ? '✏️' : '➕' }}</span>
            {{ editingId() ? 'Edit' : 'Create' }} TVA Configuration
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="form.name" placeholder="e.g. TVA Standard 19%"
                     class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-semibold">
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">
                Rate (%) <span class="text-red-500">*</span>
                <span class="ml-2 text-xs font-normal text-gray-400">Enter as percentage, e.g. 19 for 19%</span>
              </label>
              <div class="relative">
                <input type="number" [(ngModel)]="form.ratePct" min="0" max="100" step="0.5"
                       placeholder="19"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-semibold pr-10">
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
              </div>
              @if (form.ratePct > 0) {
                <p class="text-xs text-gray-500 mt-1">
                  Example: 1000 HT → TVA {{ (1000 * form.ratePct / 100).toFixed(2) }} TND → TTC {{ (1000 + 1000 * form.ratePct / 100).toFixed(2) }} TND
                </p>
              }
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <input type="text" [(ngModel)]="form.description" placeholder="e.g. Taux standard TVA Tunisie"
                     class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm">
            </div>

            <label class="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" [(ngModel)]="form.active"
                     class="w-5 h-5 rounded text-red-600 border-gray-300 focus:ring-red-500">
              <span class="text-sm font-semibold text-gray-700">Active</span>
            </label>
          </div>

          <div class="flex gap-3 mt-8">
            <button (click)="closeForm()"
                    class="flex-1 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button (click)="save()"
                    [disabled]="!form.name || form.ratePct <= 0 || isBusy()"
                    class="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-xl text-sm font-bold hover:from-red-800 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              @if (isBusy()) { <span class="animate-spin inline-block mr-1">⏳</span> } {{ editingId() ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`:host { display: block; }`]
})
export class TaxConfigurationComponent implements OnInit {
  private svc = inject(TaxConfigService);

  configs = signal<TaxConfig[]>([]);
  effective = signal<TaxConfig | null>(null);
  isLoading = signal(false);
  isBusy = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  showForm = signal(false);
  editingId = signal<string | null>(null);

  form = { name: '', ratePct: 19, description: '', active: true };

  readonly exampleTva = computed(() =>
    ((this.effective()?.rate ?? 0.19) * 1000).toFixed(2)
  );
  readonly exampleTtc = computed(() =>
    (1000 + (this.effective()?.rate ?? 0.19) * 1000).toFixed(2)
  );

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.svc.getAll().subscribe({
      next: (list) => { this.configs.set(list); this.isLoading.set(false); },
      error: () => { this.showError('Failed to load configurations'); this.isLoading.set(false); }
    });
    this.svc.getEffective().subscribe({
      next: (eff) => this.effective.set(eff),
      error: () => {}
    });
  }

  openCreateForm() {
    this.editingId.set(null);
    this.form = { name: '', ratePct: 19, description: '', active: true };
    this.showForm.set(true);
  }

  openEditForm(cfg: TaxConfig) {
    this.editingId.set(cfg.id);
    this.form = {
      name: cfg.name,
      ratePct: +(cfg.rate * 100).toFixed(2),
      description: cfg.description ?? '',
      active: cfg.active
    };
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  save() {
    const payload: Partial<TaxConfig> = {
      name: this.form.name,
      rate: this.form.ratePct / 100,
      description: this.form.description,
      active: this.form.active
    };
    this.isBusy.set(true);
    const req = this.editingId()
      ? this.svc.update(this.editingId()!, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => {
        this.showSuccess(this.editingId() ? 'TVA updated successfully' : 'TVA created successfully');
        this.closeForm();
        this.load();
        this.isBusy.set(false);
      },
      error: (err) => {
        this.showError(err?.error?.message ?? 'Operation failed');
        this.isBusy.set(false);
      }
    });
  }

  setDefault(cfg: TaxConfig) {
    if (!cfg.id) return;
    this.isBusy.set(true);
    this.svc.setDefault(cfg.id).subscribe({
      next: () => { this.showSuccess(`"${cfg.name}" is now the default TVA`); this.load(); this.isBusy.set(false); },
      error: (err) => { this.showError(err?.error?.message ?? 'Failed to set default'); this.isBusy.set(false); }
    });
  }

  toggle(cfg: TaxConfig) {
    if (!cfg.id) return;
    this.isBusy.set(true);
    this.svc.toggleActive(cfg.id).subscribe({
      next: () => { this.showSuccess(`TVA ${cfg.active ? 'deactivated' : 'activated'}`); this.load(); this.isBusy.set(false); },
      error: (err) => { this.showError(err?.error?.message ?? 'Failed to toggle'); this.isBusy.set(false); }
    });
  }

  confirmDelete(cfg: TaxConfig) {
    if (!cfg.id) return;
    if (!confirm(`Delete "${cfg.name}"? This cannot be undone.`)) return;
    this.isBusy.set(true);
    this.svc.delete(cfg.id).subscribe({
      next: () => { this.showSuccess('TVA deleted'); this.load(); this.isBusy.set(false); },
      error: (err) => { this.showError(err?.error?.message ?? 'Failed to delete'); this.isBusy.set(false); }
    });
  }

  private showSuccess(msg: string) {
    this.successMsg.set(msg); this.errorMsg.set('');
    setTimeout(() => this.successMsg.set(''), 4000);
  }
  private showError(msg: string) {
    this.errorMsg.set(msg); this.successMsg.set('');
    setTimeout(() => this.errorMsg.set(''), 5000);
  }
}
