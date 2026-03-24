// ============================================================================
// Global Shared Module Barrel Export
// ============================================================================
// Central hub for all reusable UI components
// Consolidates exports from front/shared and back/shared
// 
// Usage: import { ButtonComponent, ModalComponent, LoadingSpinnerComponent } from '@app/shared';
// ============================================================================

// ==================== Back-End Shared Components ====================
export { SidebarComponent } from './back/shared/components/sidebar/sidebar.component';
export { HeaderComponent } from './back/shared/components/header/header.component';
export { FooterComponent } from './back/shared/components/footer/footer.component';
export { ToastComponent } from './back/shared/components/toast/toast.component';
export { ModalComponent as AdminModalComponent } from './back/shared/components/modal/modal.component';
export { MetricCardComponent } from './back/shared/components/metric-card/metric-card.component';
export { ChartComponent } from './back/shared/components/chart/chart.component';

// ==================== Front-End Shared Components ====================
export { ButtonComponent } from './front/shared/components/button.component';
export type { ButtonVariant, ButtonSize } from './front/shared/components/button.component';

export { ModalComponent } from './front/shared/components/modal.component';

export { AlertComponent } from './front/shared/components/alert.component';
export type { AlertType } from './front/shared/components/alert.component';

export { LoadingSpinnerComponent } from './front/shared/components/loading-spinner.component';
export type { SpinnerSize, SpinnerColor } from './front/shared/components/loading-spinner.component';

export { TableComponent } from './front/shared/components/table.component';
export type { TableColumn, TableConfig, SortEvent, PageEvent } from './front/shared/components/table.component';

export { ProductCard } from './front/shared/components/product-card/product-card';
