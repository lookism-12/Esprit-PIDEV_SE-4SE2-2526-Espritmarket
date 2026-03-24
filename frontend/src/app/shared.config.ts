// ============================================================================
// GLOBAL SHARED MODULE CONFIGURATION
// ============================================================================

// This module aggregates shared UI components that are used across 
// both admin (back) and customer (front) interfaces

// Import configuration
import { ButtonComponent } from './front/shared/components/button.component';
import { ModalComponent } from './front/shared/components/modal.component';
import { AlertComponent } from './front/shared/components/alert.component';
import { LoadingSpinnerComponent } from './front/shared/components/loading-spinner.component';
import { TableComponent } from './front/shared/components/table.component';
import { ProductCard } from './front/shared/components/product-card/product-card';

// Admin specific
import { SidebarComponent } from './back/shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './back/shared/components/header/header.component';
import { FooterComponent } from './back/shared/components/footer/footer.component';
import { ToastComponent } from './back/shared/components/toast/toast.component';
import { MetricCardComponent } from './back/shared/components/metric-card/metric-card.component';
import { ChartComponent } from './back/shared/components/chart/chart.component';

export const SHARED_UI_COMPONENTS = [
  // Common components (available to both)
  ButtonComponent,
  ModalComponent,
  AlertComponent,
  LoadingSpinnerComponent,
  TableComponent,
  ProductCard,
  
  // Admin-specific
  SidebarComponent,
  HeaderComponent,
  FooterComponent,
  ToastComponent,
  MetricCardComponent,
  ChartComponent
];
