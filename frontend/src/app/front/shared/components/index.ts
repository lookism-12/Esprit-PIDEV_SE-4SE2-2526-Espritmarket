// Shared Components Barrel Export
// All reusable UI components for the front module

// UI Components
export { ButtonComponent } from './button.component';
export type { ButtonVariant, ButtonSize } from './button.component';

export { ModalComponent } from './modal.component';

export { AlertComponent } from './alert.component';
export type { AlertType } from './alert.component';

export { LoadingSpinnerComponent } from './loading-spinner.component';
export type { SpinnerSize, SpinnerColor } from './loading-spinner.component';

export { TableComponent } from './table.component';
export type { TableColumn, TableConfig, SortEvent, PageEvent } from './table.component';

// Existing components
export { ProductCard } from './product-card/product-card';
export { ToastContainer } from './toast-container/toast-container';
