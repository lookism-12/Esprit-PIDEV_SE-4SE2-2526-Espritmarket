import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientFeedbackComponent } from './client-feedback/client-feedback.component';

@Component({
  selector: 'app-client-sav',
  standalone: true,
  imports: [CommonModule, RouterLink, ClientFeedbackComponent],
  template: `
    <main class="dm-page min-h-screen px-4 py-6 lg:py-8">
      <div class="mx-auto max-w-6xl space-y-5">
        <section class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div class="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-[11px] font-black uppercase tracking-[0.22em] text-primary">SAV</p>
              <h1 class="mt-1 text-2xl font-black dm-title">Support Center</h1>
            </div>

            <div class="flex flex-wrap gap-2">
              <a routerLink="/sav/claims/create" [queryParams]="{ target: 'delivery' }"
                 class="rounded-xl border border-primary/20 bg-primary px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-primary-dark">
                Claim Delivery Agent
              </a>
            </div>
          </div>
        </section>

        <app-client-feedback />
      </div>
    </main>
  `
})
export class ClientSavComponent {}
