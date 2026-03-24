import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './front/layout/navbar/navbar';
import { Footer } from './front/layout/footer/footer';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './front/core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
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
    return this.currentUrl()?.url?.startsWith('/admin') ?? false;
  });

  ngOnInit(): void {
    // CRITICAL: Handle role-based redirect on app initialization
    // This ensures admin stays in back office after refresh
    
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
      
      // If admin and NOT currently in admin area → redirect to admin
      if (currentRole === 'ADMIN' && !this.isAdminRoute()) {
        console.log('🔄 Admin user detected on non-admin route, redirecting to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']).then(success => {
          if (success) {
            console.log('✅ Successfully redirected admin to back office');
          }
        });
      }
      // If NOT admin and currently in admin area → redirect away
      else if (currentRole !== 'ADMIN' && this.isAdminRoute()) {
        console.log('⚠️ Non-admin user in admin area, redirecting to home');
        this.router.navigate(['/profile']);
      }
    }, 100);
  }
}
