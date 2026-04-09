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
                loadComponent: () => import('./features/moderation/moderation.component').then(m => m.ModerationComponent)
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
                path: 'forum',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./features/forum/forum-overview.component').then(m => m.ForumOverviewComponent)
                    },
                    {
                        path: 'categories',
                        loadComponent: () => import('./features/forum/forum-categories.component').then(m => m.ForumCategoriesComponent)
                    },
                    {
                        path: 'posts',
                        loadComponent: () => import('./features/forum/forum-posts.component').then(m => m.ForumPostsComponent)
                    },
                    {
                        path: 'comments',
                        loadComponent: () => import('./features/forum/forum-comments.component').then(m => m.ForumCommentsComponent)
                    },
                    {
                        path: 'moderation',
                        loadComponent: () => import('./features/forum/forum-moderation.component').then(m => m.ForumModerationComponent)
                    },
                    {
                        path: 'reports',
                        loadComponent: () => import('./features/forum/forum-reports.component').then(m => m.ForumReportsComponent)
                    }
                ]
            },
            {
                path: 'provider',
                children: [
                    {
                        path: '',
                        redirectTo: 'dashboard',
                        pathMatch: 'full'
                    },
                    {
                        path: 'dashboard',
                        loadComponent: () => import('./features/provider/provider-dashboard.component').then(m => m.ProviderDashboardComponent)
                    },
                    {
                        path: 'shop',
                        loadComponent: () => import('./features/provider/shop-management.component').then(m => m.ShopManagementComponent)
                    }
                ]
            },
            {
                path: 'categories',
                loadComponent: () => import('./features/categories/categories').then(m => m.Categories)
            },
            {
                path: 'mobility',
                loadComponent: () => import('./features/placeholders').then(m => m.MobilityComponent)
            },
            {
                path: 'orders',
                loadComponent: () => import('./features/orders/orders.component').then(m => m.AdminOrdersComponent)
            },
            {
                path: 'coupons/create',
                loadComponent: () => import('./features/coupons/coupon-create.component').then(m => m.CouponCreateComponent)
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
                loadComponent: () => import('./features/notifications/notifications.component').then(m => m.AdminNotificationsComponent)
            },
            {
                path: 'negotiations',
                loadComponent: () => import('./features/negotiations/negotiations.component').then(m => m.NegotiationsComponent)
            },
            {
                path: 'carpooling',
                loadComponent: () => import('./features/carpooling/carpooling-admin.component').then(m => m.CarpoolingAdminComponent)
            },
            {
                path: 'carpooling/rides',
                loadComponent: () => import('./features/carpooling/carpooling-admin.component').then(m => m.CarpoolingAdminComponent)
            },
            {
                path: 'carpooling/requests',
                loadComponent: () => import('./features/carpooling/carpooling-admin.component').then(m => m.CarpoolingAdminComponent)
            },
            {
                path: 'carpooling/drivers',
                loadComponent: () => import('./features/carpooling/carpooling-admin.component').then(m => m.CarpoolingAdminComponent)
            },
            {
                path: 'carpooling/passengers',
                loadComponent: () => import('./features/carpooling/carpooling-admin.component').then(m => m.CarpoolingAdminComponent)
            },
            {
                path: 'carpooling/payments',
                loadComponent: () => import('./features/carpooling/carpooling-admin.component').then(m => m.CarpoolingAdminComponent)
            },
            {
                path: 'sav',
                loadComponent: () => import('./features/sav/sav-admin.component').then(m => m.SavAdminComponent)
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
