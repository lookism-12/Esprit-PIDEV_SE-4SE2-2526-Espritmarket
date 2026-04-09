import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const t = this.theme();
        document.documentElement.classList.toggle('dark', t === 'dark');
        localStorage.setItem('theme', t);
      }
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  private getInitialTheme(): Theme {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme') as Theme | null;
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
}
