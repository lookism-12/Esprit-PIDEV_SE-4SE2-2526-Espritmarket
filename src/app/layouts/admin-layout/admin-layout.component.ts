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
    <div class="flex h-screen overflow-hidden bg-gray-50">
      <app-sidebar />
      <div class="flex flex-col flex-1 overflow-hidden min-w-0">
        <app-header />
        <main class="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <router-outlet />
        </main>
        <app-footer />
      </div>
      <app-toast />
    </div>
  `
})
export class AdminLayoutComponent { }
