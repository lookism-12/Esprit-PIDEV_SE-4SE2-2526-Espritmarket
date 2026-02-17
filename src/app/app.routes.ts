import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UsersComponent } from './features/users/users.component';
import { SupportComponent } from './features/support/support.component';
import {
    ModerationComponent, MarketplaceComponent, MobilityComponent,
    OrdersComponent, CommunityComponent, NotificationsComponent,
    AnalyticsComponent, SettingsComponent
} from './features/placeholders';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'admin/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'users', component: UsersComponent },
            { path: 'moderation', component: ModerationComponent },
            { path: 'marketplace', component: MarketplaceComponent },
            { path: 'mobility', component: MobilityComponent },
            { path: 'orders', component: OrdersComponent },
            { path: 'support', component: SupportComponent },
            { path: 'community', component: CommunityComponent },
            { path: 'notifications', component: NotificationsComponent },
            { path: 'analytics', component: AnalyticsComponent },
            { path: 'settings', component: SettingsComponent },
            { path: '**', redirectTo: 'dashboard' }
        ]
    }
];
