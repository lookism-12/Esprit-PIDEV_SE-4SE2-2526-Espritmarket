import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environment';

/**
 * Handles the GitHub OAuth redirect callback.
 * GitHub redirects here with ?code=... after the user authorises.
 * We POST the code to our backend, get a JWT, store it, and redirect.
 */
@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;
                min-height:100vh;background:#0d0d0d;flex-direction:column;gap:1rem;">
      <div style="width:40px;height:40px;border:3px solid #8B0000;
                  border-top-color:transparent;border-radius:50%;
                  animation:spin 0.8s linear infinite;"></div>
      <p style="color:#9ca3af;font-size:0.875rem;font-family:sans-serif;">
        {{ message }}
      </p>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `
})
export class OAuthCallback implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  message = 'Signing you in…';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code     = params['code'];
      const provider = params['provider'] ?? 'github';

      if (!code) {
        this.message = 'Login cancelled.';
        setTimeout(() => this.router.navigate(['/login']), 1500);
        return;
      }

      this.http.post<{ token: string; userId: string }>(
        `${environment.apiUrl}/users/oauth/${provider}`,
        { code }
      ).subscribe({
        next: (res) => {
          localStorage.setItem('authToken', res.token);
          localStorage.setItem('userId',    res.userId);
          this.message = 'Success! Redirecting…';
          // Let the app bootstrap with the new token
          window.location.href = '/profile';
        },
        error: (err) => {
          console.error('OAuth callback error:', err);
          this.message = err.error?.error ?? 'Login failed. Please try again.';
          setTimeout(() => this.router.navigate(['/login']), 2500);
        }
      });
    });
  }
}
