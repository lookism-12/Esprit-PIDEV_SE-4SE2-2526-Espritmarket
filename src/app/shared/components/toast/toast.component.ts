import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div *ngFor="let toast of toasts"
           [ngClass]="getToastClass(toast.type)"
           class="min-w-[300px] rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in">
        <i-lucide [name]="getIcon(toast.type)" class="w-5 h-5 shrink-0"></i-lucide>
        <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button (click)="close(toast.id)" class="shrink-0 hover:opacity-70">
          <i-lucide name="x" class="w-4 h-4"></i-lucide>
        </button>
      </div>
    </div>
  `,
    styles: [`
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
    toasts: Toast[] = [];
    private subscription?: Subscription;

    constructor(private toastService: ToastService) { }

    ngOnInit() {
        this.subscription = this.toastService.toasts.subscribe((toasts: Toast[]) => {
            this.toasts = toasts;
        });
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    getToastClass(type: 'success' | 'error' | 'warning' | 'info'): string {
        const classes: Record<string, string> = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        return classes[type];
    }

    getIcon(type: 'success' | 'error' | 'warning' | 'info'): string {
        const icons: Record<string, string> = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type];
    }

    close(id: number) {
        this.toastService.remove(id);
    }
}
