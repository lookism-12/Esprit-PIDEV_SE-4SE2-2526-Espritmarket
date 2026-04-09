import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './front/layout/navbar/navbar';
import { Footer } from './front/layout/footer/footer';
import { ToastContainer } from './front/shared/components/toast-container/toast-container';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './front/core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('esprit-market-front');
  
  private router = inject(Router);
  private authService = inject(AuthService);
  
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
    { initialValue: { url: this.router.url } as NavigationEnd }
  );

  protected isAdminRoute = computed(() => {
    const url = this.currentUrl()?.url ?? '';
    return url.startsWith('/admin');
  });

  protected isAuthRoute = computed(() => {
    const url = this.currentUrl()?.url ?? '';
    return url.startsWith('/login') || url.startsWith('/register');
  });

  ngOnInit(): void {
    // CRITICAL: Handle role-based redirect on app initialization
    // This ensures users stay in correct interface after refresh
    
    const token = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('userRole');
    
    if (!token || !storedRole) {
      console.log('ℹ️ No authentication found, allowing router to handle initial navigation');
      return;
    }
    
    // User is authenticated - redirect based on role
    console.log(`🔐 Auth found with role: ${storedRole}`);
    
    // Wait for auth state to be fully restored
    // Then redirect based on role
    setTimeout(() => {
      const currentRole = this.authService.userRole();
      
      // ✅ CRITICAL FIX: Only ADMIN users should access admin interface
      if (currentRole === 'ADMIN' && !this.isAdminRoute()) {
        console.log('🔄 ADMIN user detected on non-admin route, redirecting to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']).then(success => {
          if (success) {
            console.log('✅ Successfully redirected ADMIN to back office');
          }
        });
      }
      // ✅ CRITICAL FIX: If PROVIDER/CLIENT/etc in admin area → redirect to front-end
      else if (currentRole !== 'ADMIN' && this.isAdminRoute()) {
        console.log(`⚠️ Non-admin user (${currentRole}) in admin area, redirecting to front-end profile`);
        console.log('   🚫 PROVIDERS should NOT access admin interface');
        this.router.navigate(['/profile']);
      }
      // ✅ PROVIDER on front-end routes → stay there (correct behavior)
      else if (currentRole === 'PROVIDER' && !this.isAdminRoute()) {
        console.log('✅ PROVIDER user on front-end route - correct interface, no redirect needed');
      }
    }, 100);
  }
}
