// Front Module Barrel Export
// This file exports all front-related routes, components, services, and models

// Routes
export { FRONT_ROUTES } from './front-routing-module';

// Core (Services & Guards)
export * from './core';

// Models
export * from './models/product';
export * from './models/cart.model';
export * from './models/order.model';
export * from './models/invoice.model';
export * from './models/user.model';
export * from './models/promotion.model';
export * from './models/notification.model';

// Shared Components
export * from './shared';

// Layout Components
export { Navbar } from './layout/navbar/navbar';
export { Footer } from './layout/footer/footer';
