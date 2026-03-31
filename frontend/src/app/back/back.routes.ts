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
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./features/marketplace/marketplace-hub.component').then(m => m.MarketplaceHubComponent)
                    },
                    {
                        path: 'products',
                        loadComponent: () => import('./features/marketplace/products-admin.component').then(m => m.ProductsAdminComponent)
                    },
                    {
                        path: 'categories',
                        loadComponent: () => import('./features/marketplace/categories-admin.component').then(m => m.CategoriesAdminComponent)
                    },
                    {
                        path: 'services',
                        loadComponent: () => import('./features/marketplace/services-admin.component').then(m => m.ServicesAdminComponent)
                    },
                    {
                        path: 'favorites',
                        loadComponent: () => import('./features/marketplace/favorites-admin.component').then(m => m.FavoritesAdminComponent)
                    },
                    {
                        path: 'shop',
                        loadComponent: () => import('./features/marketplace/shop-admin.component').then(m => m.ShopAdminComponent)
                    }
                ]
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
