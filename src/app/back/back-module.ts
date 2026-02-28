// Back Office Module Barrel Export
// Admin dashboard routes and components

export { BACK_ROUTES } from './back.routes';

// Layout
export { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

// Features
export { DashboardComponent } from './features/dashboard/dashboard.component';
export { UsersComponent } from './features/users/users.component';
export { SupportComponent } from './features/support/support.component';

// Placeholder Components
export {
    ModerationComponent,
    MarketplaceComponent,
    MobilityComponent,
    OrdersComponent,
    CommunityComponent,
    NotificationsComponent,
    AnalyticsComponent,
    SettingsComponent
} from './features/placeholders';

// Shared Components
export { SidebarComponent } from './shared/components/sidebar/sidebar.component';
export { HeaderComponent } from './shared/components/header/header.component';
export { FooterComponent } from './shared/components/footer/footer.component';
export { ToastComponent } from './shared/components/toast/toast.component';

// Services
export { DashboardService } from './core/services/dashboard.service';
export { UserService } from './core/services/user.service';
export { SupportService } from './core/services/support.service';
export { ToastService } from './core/services/toast.service';
