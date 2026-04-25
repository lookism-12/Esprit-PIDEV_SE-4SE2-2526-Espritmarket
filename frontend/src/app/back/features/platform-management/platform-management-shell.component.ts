import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';

interface SystemStatus {
  server: 'online' | 'offline' | 'maintenance';
  database: 'connected' | 'disconnected' | 'error';
  load: 'low' | 'normal' | 'high' | 'critical';
  uptime: string;
  lastCheck: Date;
}

@Component({
  selector: 'app-platform-management-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="flex gap-6 h-full">
      <!-- Main Content Area -->
      <div class="flex-1 min-w-0">
        <router-outlet />
      </div>

      <!-- System Status Widget (Right Panel) -->
      <div class="w-80 shrink-0 hidden xl:block">
        <div class="sticky top-6 space-y-6">
          
          <!-- System Status Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>🟢</span> System Status
              </h3>
            </div>
            
            <div class="p-6 space-y-4">
              <!-- Server Status -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <span class="text-xl">🖥️</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">Server</div>
                    <div class="text-xs text-gray-500">API Status</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full animate-pulse"
                       [class]="getStatusColor(systemStatus().server)"></div>
                  <span class="text-sm font-semibold capitalize"
                        [class]="getStatusTextColor(systemStatus().server)">
                    {{ systemStatus().server }}
                  </span>
                </div>
              </div>

              <!-- Database Status -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span class="text-xl">💾</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">Database</div>
                    <div class="text-xs text-gray-500">MongoDB</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full animate-pulse"
                       [class]="getStatusColor(systemStatus().database)"></div>
                  <span class="text-sm font-semibold capitalize"
                        [class]="getStatusTextColor(systemStatus().database)">
                    {{ systemStatus().database }}
                  </span>
                </div>
              </div>

              <!-- Load Status -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <span class="text-xl">📊</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">Load</div>
                    <div class="text-xs text-gray-500">System Load</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full animate-pulse"
                       [class]="getLoadColor(systemStatus().load)"></div>
                  <span class="text-sm font-semibold capitalize"
                        [class]="getLoadTextColor(systemStatus().load)">
                    {{ systemStatus().load }}
                  </span>
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-gray-200 my-4"></div>

              <!-- Uptime -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Uptime</span>
                <span class="text-sm font-semibold text-gray-900">{{ systemStatus().uptime }}</span>
              </div>

              <!-- Last Check -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Last Check</span>
                <span class="text-xs text-gray-500">{{ systemStatus().lastCheck | date:'short' }}</span>
              </div>

              <!-- Refresh Button -->
              <button 
                (click)="refreshStatus()"
                [disabled]="isRefreshing()"
                class="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50">
                {{ isRefreshing() ? 'Refreshing...' : '🔄 Refresh Status' }}
              </button>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>⚡</span> Quick Actions
              </h3>
            </div>
            
            <div class="p-6 space-y-3">
              <button 
                (click)="clearCache()"
                class="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2">
                <span>🗑️</span> Clear Cache
              </button>
              
              <button 
                (click)="exportData()"
                class="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2">
                <span>📥</span> Export Data
              </button>
              
              <button 
                (click)="viewLogs()"
                class="w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2">
                <span>📋</span> View Logs
              </button>
            </div>
          </div>

          <!-- Platform Info Card -->
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="text-center">
              <div class="text-3xl mb-2">🏪</div>
              <h4 class="font-bold text-gray-900 mb-1">Esprit Market</h4>
              <p class="text-xs text-gray-600 mb-3">Platform Management v2.0</p>
              <div class="text-xs text-gray-500">
                <div>© 2024 Esprit Market</div>
                <div class="mt-1">All rights reserved</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class PlatformManagementShellComponent implements OnInit {
  private http = inject(HttpClient);
  
  isRefreshing = signal(false);
  
  systemStatus = signal<SystemStatus>({
    server: 'online',
    database: 'connected',
    load: 'normal',
    uptime: '15d 7h 23m',
    lastCheck: new Date()
  });

  ngOnInit(): void {
    this.loadSystemStatus();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.loadSystemStatus();
    }, 30000);
  }

  private loadSystemStatus(): void {
    // In production, this would call a real API endpoint
    this.http.get<SystemStatus>(`${environment.apiUrl}/admin/system/status`).subscribe({
      next: (data) => {
        this.systemStatus.set({
          ...data,
          lastCheck: new Date()
        });
      },
      error: () => {
        // Use mock data if API fails
        this.systemStatus.update(status => ({
          ...status,
          lastCheck: new Date()
        }));
      }
    });
  }

  refreshStatus(): void {
    this.isRefreshing.set(true);
    this.loadSystemStatus();
    
    setTimeout(() => {
      this.isRefreshing.set(false);
    }, 1000);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'online': 'bg-green-500',
      'connected': 'bg-green-500',
      'offline': 'bg-red-500',
      'disconnected': 'bg-red-500',
      'maintenance': 'bg-yellow-500',
      'error': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  }

  getStatusTextColor(status: string): string {
    const colors: Record<string, string> = {
      'online': 'text-green-700',
      'connected': 'text-green-700',
      'offline': 'text-red-700',
      'disconnected': 'text-red-700',
      'maintenance': 'text-yellow-700',
      'error': 'text-red-700'
    };
    return colors[status] || 'text-gray-700';
  }

  getLoadColor(load: string): string {
    const colors: Record<string, string> = {
      'low': 'bg-green-500',
      'normal': 'bg-yellow-500',
      'high': 'bg-orange-500',
      'critical': 'bg-red-500'
    };
    return colors[load] || 'bg-gray-500';
  }

  getLoadTextColor(load: string): string {
    const colors: Record<string, string> = {
      'low': 'text-green-700',
      'normal': 'text-yellow-700',
      'high': 'text-orange-700',
      'critical': 'text-red-700'
    };
    return colors[load] || 'text-gray-700';
  }

  clearCache(): void {
    if (confirm('Are you sure you want to clear the cache? This may temporarily affect performance.')) {
      this.http.post(`${environment.apiUrl}/admin/system/clear-cache`, {}).subscribe({
        next: () => {
          alert('✅ Cache cleared successfully!');
        },
        error: () => {
          alert('❌ Failed to clear cache. Please try again.');
        }
      });
    }
  }

  exportData(): void {
    alert('📥 Data export feature coming soon!');
  }

  viewLogs(): void {
    alert('📋 System logs viewer coming soon!');
  }
}
