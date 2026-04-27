import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientFeedbackComponent } from './client-feedback/client-feedback.component';

@Component({
  selector: 'app-client-sav',
  standalone: true,
  imports: [CommonModule, ClientFeedbackComponent],
  template: `
    <div class="dm-page min-h-screen py-8 px-4">
      <div class="max-w-5xl mx-auto">

        <div class="mb-6">
          <h1 class="text-2xl font-extrabold dm-title">After-Sales Service</h1>
          <p class="text-sm dm-muted mt-1">Manage your claims & reviews.</p>
        </div>

        <app-client-feedback />

      </div>
    </div>
  `
})
export class ClientSavComponent {}
