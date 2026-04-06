import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientDeliveryComponent } from './client-delivery/client-delivery.component';
import { ClientFeedbackComponent } from './client-feedback/client-feedback.component';

type SavTab = 'deliveries' | 'feedback';

@Component({
  selector: 'app-client-sav',
  standalone: true,
  imports: [CommonModule, ClientDeliveryComponent, ClientFeedbackComponent],
  templateUrl: './client-sav.component.html'
})
export class ClientSavComponent {
  activeTab = signal<SavTab>('deliveries');

  setActiveTab(tab: SavTab) {
    this.activeTab.set(tab);
  }
}
