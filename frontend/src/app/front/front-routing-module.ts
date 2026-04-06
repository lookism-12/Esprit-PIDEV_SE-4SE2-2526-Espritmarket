import { Routes } from '@angular/router';
import { providerGuard } from './core/provider.guard';

// Front module routes - can be used for lazy loading as a group
export const FRONT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then(m => m.Home)
    },
    {
        path: 'products',
        loadComponent: () => import('./pages/products/products').then(m => m.Products)
    },
    {
        path: 'add-product',
        loadComponent: () => import('./pages/add-product/add-product').then(m => m.AddProduct)
    },
    {
        path: 'product/:id',
        loadComponent: () => import('./pages/product-details/product-details').then(m => m.ProductDetails)
    },
    {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart').then(m => m.Cart)
    },
    {
        path: 'checkout-success',
        loadComponent: () => import('./pages/checkout-success/checkout-success').then(m => m.CheckoutSuccess)
    },
    {
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites').then(m => m.Favorites)
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then(m => m.Profile)
    },
    {
        path: 'provider/dashboard',
        canActivate: [providerGuard],
        loadComponent: () => import('./pages/provider-dashboard/provider-dashboard').then(m => m.ProviderDashboard)
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.Login)
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.Register)
    },
    {
        path: 'forum',
        loadComponent: () => import('./pages/forum/forum').then(m => m.Forum)
    },
    {
        path: 'carpooling',
        loadComponent: () => import('./pages/carpooling/carpooling').then(m => m.Carpooling)
    },
    {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact').then(m => m.Contact)
    },
    {
        path: 'about',
        loadComponent: () => import('./pages/about/about').then(m => m.About)
    }
];
