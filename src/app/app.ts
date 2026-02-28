import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './front/layout/navbar/navbar';
import { Footer } from './front/layout/footer/footer';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('esprit-market-front');
  
  private router = inject(Router);
  
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
    { initialValue: { url: this.router.url } as NavigationEnd }
  );

  protected isAdminRoute = computed(() => {
    return this.currentUrl()?.url?.startsWith('/admin') ?? false;
  });
}
