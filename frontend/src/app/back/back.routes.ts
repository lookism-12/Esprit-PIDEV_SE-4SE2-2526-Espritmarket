import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

// Admin/Back Office Routes - Lazy loaded from app.routes.ts
export const BACK_ROUTES: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'forum',
                loadComponent: () => import('./features/forum/forum.component').then(m => m.ForumAdminComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/placeholders').then(m => m.AdminProfileComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
            },
            {
                path: 'moderation',
                loadComponent: () => import('./features/placeholders').then(m => m.ModerationComponent)
            },
            {
                path: 'marketplace',
                loadComponent: () => import('./features/placeholders').then(m => m.MarketplaceComponent)
            },
            {
                path: 'mobility',
                loadComponent: () => import('./features/placeholders').then(m => m.MobilityComponent)
            },
            {
                path: 'orders',
                loadComponent: () => import('./features/placeholders').then(m => m.OrdersComponent)
            },
            {
                path: 'support',
                loadComponent: () => import('./features/support/support.component').then(m => m.SupportComponent)
            },
            {
                path: 'community',
                loadComponent: () => import('./features/placeholders').then(m => m.CommunityComponent)
            },
            {
                path: 'notifications',
                loadComponent: () => import('./features/placeholders').then(m => m.NotificationsComponent)
            },
            {
                path: 'analytics',
                loadComponent: () => import('./features/placeholders').then(m => m.AnalyticsComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./features/placeholders').then(m => m.SettingsComponent)
            }
        ]
    }
];
