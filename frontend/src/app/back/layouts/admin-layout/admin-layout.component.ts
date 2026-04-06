import { Component, signal } from '@angular/core';
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
    <!-- Enhanced Admin Layout with Mobile Support -->
    <div class="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      
      <!-- Header - Always visible -->
      <app-header class="z-30 relative shrink-0 shadow-lg" />
      
      <!-- Main Content Area -->
      <div class="flex flex-1 overflow-hidden min-w-0 z-10 relative">
        
        <!-- Sidebar - Hidden on mobile, overlay on tablet -->
        <div class="hidden lg:block shrink-0">
          <app-sidebar class="h-full" />
        </div>
        
        <!-- Mobile Sidebar Overlay -->
        <div class="lg:hidden fixed inset-0 z-40 flex" 
             [class.hidden]="!isMobileMenuOpen()"
             (click)="closeMobileMenu()">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" 
               (click)="closeMobileMenu()"></div>
          
          <!-- Sidebar -->
          <div class="relative flex flex-col w-64 bg-white shadow-2xl"
               (click)="$event.stopPropagation()">
            <app-sidebar class="h-full" />
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto flex flex-col hide-scrollbar relative z-0 min-w-0">
          
          <!-- Mobile Menu Button -->
          <div class="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button 
              (click)="toggleMobileMenu()"
              class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h1 class="text-lg font-bold text-gray-900">Admin Panel</h1>
            <div class="w-9"></div> <!-- Spacer for centering -->
          </div>
          
          <!-- Page Content -->
          <main class="flex-1 p-4 lg:p-6">
            <router-outlet />
          </main>
          
          <!-- Footer -->
          <app-footer class="shrink-0" />
        </div>
      </div>
      
      <!-- Toast Notifications -->
      <app-toast />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
    
    /* Enhanced scrollbar styling */
    .hide-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
    }
    
    .hide-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .hide-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .hide-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
      transition: background 0.3s ease;
    }
    
    .hide-scrollbar:hover::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
    }
    
    /* Mobile menu animations */
    .mobile-menu-enter {
      animation: slideInLeft 0.3s ease-out;
    }
    
    @keyframes slideInLeft {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(0);
      }
    }
    
    /* Backdrop blur effect */
    .backdrop-blur-sm {
      backdrop-filter: blur(4px);
    }
  `]
})
export class AdminLayoutComponent {
  // Mobile menu state
  isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
