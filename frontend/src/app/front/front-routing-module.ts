import { Routes } from '@angular/router';

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
        path: 'products/manage',
        loadComponent: () => import('./pages/products/product-management').then(m => m.ProductManagement)
    },
    {
        path: 'products/create',
        loadComponent: () => import('./pages/products/product-form').then(m => m.ProductForm)
    },
    {
        path: 'products/edit/:id',
        loadComponent: () => import('./pages/products/product-form').then(m => m.ProductForm)
    },
    {
        path: 'products/shop-settings',
        loadComponent: () => import('./pages/products/shop-settings').then(m => m.ShopSettings)
    },
    {
        path: 'services/create',
        loadComponent: () => import('./pages/services/service-form').then(m => m.ServiceForm)
    },
    {
        path: 'services/edit/:id',
        loadComponent: () => import('./pages/services/service-form').then(m => m.ServiceForm)
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
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites').then(m => m.Favorites)
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then(m => m.Profile)
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
