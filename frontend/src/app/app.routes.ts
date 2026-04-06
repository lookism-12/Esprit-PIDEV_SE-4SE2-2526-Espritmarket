import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, sellerGuard, providerGuard, driverGuard, clientGuard, adminAuthGuard } from './core';

export const routes: Routes = [
    // ==================== PUBLIC ROUTES ====================
    // Home - eager load for fast initial render
    {
        path: '',
        loadComponent: () => import('./front/pages/home/home').then(m => m.Home)
    },
    // Products
    {
        path: 'products',
        loadComponent: () => import('./front/pages/products/products').then(m => m.Products)
    },
    {
        path: 'product/:id',
        loadComponent: () => import('./front/pages/product-details/product-details').then(m => m.ProductDetails)
    },
    // Info pages
    {
        path: 'contact',
        loadComponent: () => import('./front/pages/contact/contact').then(m => m.Contact)
    },
    {
        path: 'about',
        loadComponent: () => import('./front/pages/about/about').then(m => m.About)
    },
    // Community (public view)
    {
        path: 'forum',
        loadComponent: () => import('./front/pages/forum/forum').then(m => m.Forum)
    },
    {
        path: 'carpooling',
        loadComponent: () => import('./front/pages/carpooling/carpooling').then(m => m.Carpooling)
    },

    // ==================== AUTH ROUTES (Guest Only) ====================
    {
        path: 'login',
        loadComponent: () => import('./front/pages/login/login').then(m => m.Login),
        canActivate: [guestGuard]
    },
    {
        path: 'register',
        loadComponent: () => import('./front/pages/register/register').then(m => m.Register),
        canActivate: [guestGuard]
    },

    // ==================== PROTECTED ROUTES (Authenticated) ====================
    // Cart & Shopping
    {
        path: 'cart',
        loadComponent: () => import('./front/pages/cart/cart').then(m => m.Cart)
    },
    {
        path: 'checkout',
        loadComponent: () => import('./front/pages/cart/cart').then(m => m.Cart), // Uses cart with checkout mode
        canActivate: [authGuard]
    },
    {
        path: 'favorites',
        loadComponent: () => import('./front/pages/favorites/favorites').then(m => m.Favorites),
        canActivate: [authGuard]
    },
    // User Profile
    {
        path: 'profile',
        loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile),
        canActivate: [authGuard]
    },
    {
        path: 'profile/sav',
        loadComponent: () => import('./front/pages/client-sav/client-sav.component').then(m => m.ClientSavComponent),
        canActivate: [authGuard]
    },
    {
        path: 'profile/tracking',
        loadComponent: () => import('./front/pages/client-sav/client-delivery/client-delivery.component').then(m => m.ClientDeliveryComponent),
        canActivate: [authGuard]
    },
    {
        path: 'profile/support',
        loadComponent: () => import('./front/pages/client-sav/client-feedback/client-feedback.component').then(m => m.ClientFeedbackComponent),
        canActivate: [authGuard]
    },
    // Orders (Buyer)
    {
        path: 'orders',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile)
            },
            {
                path: ':id',
                loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile)
            }
        ]
    },
    // Invoices
    {
        path: 'invoices',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile)
            },
            {
                path: ':id',
                loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile)
            }
        ]
    },

    // ==================== PROVIDER ROUTES (Sellers) ====================
    {
        path: 'provider',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile)
            },
            {
                path: 'products',
                loadComponent: () => import('./front/pages/products/products').then(m => m.Products)
            },
            {
                path: 'products/new',
                loadComponent: () => import('./front/pages/products/products').then(m => m.Products)
            },
            {
                path: 'orders',
                loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile)
            }
        ]
    },

    // ==================== SELLER ROUTES (Legacy - redirects to provider) ====================
    {
        path: 'seller',
        redirectTo: 'provider',
        pathMatch: 'prefix'
    },

    // ==================== DRIVER ROUTES ====================
    {
        path: 'driver',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./front/pages/driver-deliveries/driver-deliveries.component').then(m => m.DriverDeliveriesComponent)
            },
            {
                path: 'deliveries',
                loadComponent: () => import('./front/pages/driver-deliveries/driver-deliveries.component').then(m => m.DriverDeliveriesComponent)
            },
            {
                path: 'rides',
                loadComponent: () => import('./front/pages/carpooling/carpooling').then(m => m.Carpooling)
            },
            {
                path: 'schedule',
                loadComponent: () => import('./front/pages/carpooling/carpooling').then(m => m.Carpooling)
            }
        ]
    },

    // ==================== ADMIN ROUTES (Back Office) ====================
    {
        path: 'admin',
        canActivate: [authGuard, adminAuthGuard],
        loadChildren: () => import('./back/back.routes').then(m => m.BACK_ROUTES)
    },

    // ==================== WILDCARD ====================
    { path: '**', redirectTo: '' }
];
