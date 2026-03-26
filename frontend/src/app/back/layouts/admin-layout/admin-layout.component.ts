import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, FooterComponent, ToastComponent],
  template: `
    <div class="flex flex-col h-screen overflow-hidden bg-gray-50">
      <app-header class="z-30 relative shrink-0 shadow-md" />
      <div class="flex flex-1 overflow-hidden min-w-0 z-10 relative">
        <app-sidebar class="shrink-0" />
        <div class="flex-1 overflow-y-auto flex flex-col hide-scrollbar relative z-0">
          <main class="flex-1 p-6">
            <router-outlet />
          </main>
          <app-footer />
        </div>
      </div>
      <app-toast />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AdminLayoutComponent { }
