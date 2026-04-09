import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientDeliveryComponent } from './client-delivery/client-delivery.component';
import { ClientFeedbackComponent } from './client-feedback/client-feedback.component';

type SavTab = 'deliveries' | 'feedback';

@Component({
  selector: 'app-client-sav',
  standalone: true,
  imports: [CommonModule, ClientDeliveryComponent, ClientFeedbackComponent],
  template: `
    <div class="dm-page min-h-screen py-8 px-4">
      <div class="max-w-5xl mx-auto">

        <div class="mb-6">
          <h1 class="text-2xl font-extrabold dm-title">After-Sales Service</h1>
          <p class="text-sm dm-muted mt-1">Track your deliveries and manage your claims & reviews.</p>
        </div>

        <div class="flex gap-1 mb-6 dm-tab-bar w-fit">
          <button (click)="setActiveTab('deliveries')"
            class="px-5 py-2 rounded-lg font-semibold text-sm transition-all"
            [class]="activeTab() === 'deliveries' ? 'dm-tab-active' : 'dm-tab-idle'">
            🚚 Deliveries
          </button>
          <button (click)="setActiveTab('feedback')"
            class="px-5 py-2 rounded-lg font-semibold text-sm transition-all"
            [class]="activeTab() === 'feedback' ? 'dm-tab-active' : 'dm-tab-idle'">
            💬 Claims & Reviews
          </button>
        </div>

        @if (activeTab() === 'deliveries') { <app-client-delivery /> }
        @if (activeTab() === 'feedback') { <app-client-feedback /> }

      </div>
    </div>
  `
})
export class ClientSavComponent {
  activeTab = signal<SavTab>('deliveries');
  setActiveTab(tab: SavTab) { this.activeTab.set(tab); }
}
