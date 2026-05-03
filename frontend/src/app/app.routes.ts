import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, sellerGuard, providerGuard, driverGuard, clientGuard, adminAuthGuard } from './core';

export const routes: Routes = [
    // ==================== PUBLIC ROUTES (no account needed) ====================
    {
        path: '',
        loadComponent: () => import('./front/pages/home/home').then(m => m.Home)
    },
    // Marketplace — public browsing
    {
        path: 'products',
        loadComponent: () => import('./front/pages/products/products').then(m => m.Products)
    },
    {
        path: 'product/:id',
        loadComponent: () => import('./front/pages/product-details/product-details').then(m => m.ProductDetails)
    },
    {
        path: 'services',
        loadComponent: () => import('./front/pages/marketplace-services/marketplace-services').then(m => m.MarketplaceServices)
    },
    {
        path: 'service/:id',
        loadComponent: () => import('./front/pages/service-details/service-details').then(m => m.ServiceDetails)
    },
    {
        path: 'shop',
        loadComponent: () => import('./front/pages/shops/shops').then(m => m.Shops)
    },
    // About & Contact — public
    {
        path: 'about',
        loadComponent: () => import('./front/pages/about/about').then(m => m.About)
    },
    {
        path: 'contact',
        loadComponent: () => import('./front/pages/contact/contact').then(m => m.Contact)
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

    // ==================== PROTECTED ROUTES (Authenticated users only) ====================
    // Chat full page route has been removed, using Forum Popup instead
    // Cart & Shopping
    {
        path: 'cart',
        loadComponent: () => import('./front/pages/cart/cart').then(m => m.Cart),
        canActivate: [authGuard]
    },
    {
        path: 'checkout',
        loadComponent: () => import('./front/pages/cart/cart').then(m => m.Cart),
        canActivate: [authGuard]
    },
    {
        path: 'checkout-success',
        loadComponent: () => import('./front/pages/checkout-success/checkout-success').then(m => m.CheckoutSuccess),
        canActivate: [authGuard]
    },
    // Forum — public
    {
        path: 'forum',
        loadComponent: () => import('./front/pages/forum/forum').then(m => m.Forum)
    },
    // Carpooling — public
    {
        path: 'carpooling',
        loadComponent: () => import('./front/pages/carpooling/carpooling').then(m => m.Carpooling)
    },
    // Favorites
    {
        path: 'favorites',
        loadComponent: () => import('./front/pages/favorites/favorites').then(m => m.Favorites),
        canActivate: [authGuard]
    },
    // Negotiations
    {
        path: 'negotiations',
        loadComponent: () => import('./front/pages/negotiations/negotiations').then(m => m.Negotiations),
        canActivate: [authGuard]
    },
    // Notifications
    {
        path: 'notifications',
        loadComponent: () => import('./front/pages/notifications/notifications').then(m => m.Notifications),
        canActivate: [authGuard]
    },
    // SAV
    {
        path: 'sav',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./front/pages/sav/client-sav.component').then(m => m.ClientSavComponent)
            },
            {
                path: 'claims',
                loadComponent: () => import('./front/pages/sav-claims/sav-claims-list.component').then(m => m.SavClaimsListComponent)
            },
            {
                path: 'claims/create',
                loadComponent: () => import('./front/pages/sav-claims/sav-claim-create.component').then(m => m.SavClaimCreateComponent)
            },
            {
                path: 'claims/:id',
                loadComponent: () => import('./front/pages/sav-claims/sav-claim-detail.component').then(m => m.SavClaimDetailComponent)
            },
            {
                path: 'claims/:id/edit',
                loadComponent: () => import('./front/pages/sav-claims/sav-claim-create.component').then(m => m.SavClaimCreateComponent)
            }
        ]
    },
    // Driver deliveries
    {
        path: 'driver/deliveries',
        loadComponent: () => import('./front/pages/driver-deliveries/driver-deliveries.component').then(m => m.DriverDeliveriesComponent),
        canActivate: [authGuard]
    },
    // User Profile with nested routes
    {
        path: 'profile',
        loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'orders',
                pathMatch: 'full'
            },
            {
                path: 'orders',
                loadComponent: () => import('./front/pages/profile/orders/profile-orders.component').then(m => m.ProfileOrdersComponent)
            },
            {
                path: 'loyalty',
                loadComponent: () => import('./front/pages/profile/loyalty/profile-loyalty.component').then(m => m.ProfileLoyaltyComponent)
            },
            {
                path: 'preferences',
                loadComponent: () => import('./front/pages/profile/preferences/profile-preferences.component').then(m => m.ProfilePreferencesComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./front/pages/profile/settings/profile-settings.component').then(m => m.ProfileSettingsComponent)
            },
            {
                path: 'deliveries',
                loadComponent: () => import('./front/pages/driver-deliveries/driver-deliveries.component').then(m => m.DriverDeliveriesComponent)
            },
            {
                path: 'negotiations',
                loadComponent: () => import('./front/pages/profile/negotiations/profile-negotiations.component').then(m => m.ProfileNegotiationsComponent)
            }
        ]
    },

    // ==================== PROVIDER ROUTES ====================
    {
        path: 'provider',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', canActivate: [providerGuard], loadComponent: () => import('./front/pages/provider-dashboard/provider-dashboard').then(m => m.ProviderDashboard) },
            { path: 'products', loadComponent: () => import('./front/pages/products/products').then(m => m.Products) },
            { path: 'products/new', loadComponent: () => import('./front/pages/add-product/add-product').then(m => m.AddProduct) },
            { path: 'orders', loadComponent: () => import('./front/pages/profile/profile').then(m => m.Profile) }
        ]
    },
    {
        path: 'shop-management',
        loadComponent: () => import('./front/pages/shop-management').then(m => m.ShopManagement),
        canActivate: [authGuard, providerGuard]
    },
    {
        path: 'add-product',
        loadComponent: () => import('./front/pages/add-product/add-product').then(m => m.AddProduct),
        canActivate: [authGuard, providerGuard]
    },
    {
        path: 'add-service',
        loadComponent: () => import('./front/pages/add-service/add-service').then(m => m.AddService),
        canActivate: [authGuard, providerGuard]
    },
    {
        path: 'edit-service/:id',
        loadComponent: () => import('./front/pages/edit-service/edit-service').then(m => m.EditService),
        canActivate: [authGuard, providerGuard]
    },
    { path: 'seller', redirectTo: 'provider', pathMatch: 'prefix' },

    // ==================== DRIVER ROUTES ====================
    {
        path: 'driver',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./front/pages/carpooling/carpooling').then(m => m.Carpooling) },
            { path: 'rides', loadComponent: () => import('./front/pages/carpooling/carpooling').then(m => m.Carpooling) },
            { path: 'schedule', loadComponent: () => import('./front/pages/carpooling/carpooling').then(m => m.Carpooling) },
            { path: 'analytics', loadComponent: () => import('./front/pages/carpooling/driver-dashboard').then(m => m.DriverDashboard) }
        ]
    },

    // ==================== ADMIN ROUTES ====================
    {
        path: 'admin',
        canActivate: [authGuard, adminAuthGuard],
        loadChildren: () => import('./back/back.routes').then(m => m.BACK_ROUTES)
    },

    // Wheel of Fortune
    {
        path: 'wheel',
        loadComponent: () => import('./front/pages/wheel-of-fortune/wheel-of-fortune').then(m => m.WheelOfFortune),
        canActivate: [authGuard]
    },

    // OAuth callback (GitHub redirect)
    {
        path: 'oauth/github/callback',
        loadComponent: () => import('./front/pages/oauth-callback/oauth-callback').then(m => m.OAuthCallback)
    },

    // ==================== WILDCARD ====================
    { path: '**', redirectTo: '' }
];
