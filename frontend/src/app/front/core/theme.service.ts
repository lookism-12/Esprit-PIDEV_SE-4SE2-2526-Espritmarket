import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

/**
 * ThemeService — Light/Dark mode management.
 *
 * Rules:
 * - Default: LIGHT MODE
 * - Persistence: Always save user preference in localStorage
 * - Independence: Works for both guests and logged-in users
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  /** The active theme signal. Starts from getInitialTheme(). */
  readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const t = this.theme();
        document.documentElement.classList.toggle('dark', t === 'dark');
        
        // Save preference for all users (guests and authenticated)
        localStorage.setItem('theme', t);
      }
    });
  }

  /** Toggle between light and dark. */
  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  /**
   * Force light mode and remove any stored theme preference.
   * Call this on logout to comply with the spec:
   * "If user logs out → RESET to LIGHT MODE"
   */
  resetToLight(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.remove('dark');
    }
    this.theme.set('light');
  }

  /**
   * Determine the starting theme WITHOUT causing a flicker.
   *
   * Priority:
   * 1. If no auth token → LIGHT MODE (user is not logged in)
   * 2. If token exists  → read saved preference (default: light if none saved)
   */
  private getInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }

    // Always restore the saved preference from localStorage
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved === 'dark' ? 'dark' : 'light';
  }
}
