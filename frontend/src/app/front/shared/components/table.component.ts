import { Component, input, output, computed, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  template?: TemplateRef<{ $implicit: T; row: T; index: number }>;
}

export interface TableConfig {
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

export interface PageEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200" [class]="tableClasses">
        <!-- Header -->
        <thead [class]="config().stickyHeader ? 'sticky top-0' : ''">
          <tr class="bg-gray-50">
            @for (col of columns(); track col.key) {
              <th 
                [style.width]="col.width"
                class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                [class.text-left]="col.align === 'left' || !col.align"
                [class.text-center]="col.align === 'center'"
                [class.text-right]="col.align === 'right'"
                [class.cursor-pointer]="col.sortable"
                (click)="col.sortable && onSort(col.key)"
              >
                <div class="flex items-center gap-2" [class.justify-center]="col.align === 'center'" [class.justify-end]="col.align === 'right'">
                  <span>{{ col.header }}</span>
                  @if (col.sortable) {
                    <span class="text-gray-400">
                      @if (sortColumn() === col.key) {
                        @if (sortDirection() === 'asc') {
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                          </svg>
                        } @else {
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        }
                      } @else {
                        <svg class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      }
                    </span>
                  }
                </div>
              </th>
            }
            @if (hasActions()) {
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            }
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          @if (isLoading()) {
            <tr>
              <td [attr.colspan]="columns().length + (hasActions() ? 1 : 0)" class="px-6 py-12 text-center">
                <div class="flex justify-center">
                  <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </td>
            </tr>
          } @else if (data().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length + (hasActions() ? 1 : 0)" class="px-6 py-12 text-center text-gray-500">
                {{ emptyMessage() }}
              </td>
            </tr>
          } @else {
            @for (row of data(); track trackByFn()(row, $index); let i = $index) {
              <tr 
                [class]="getRowClasses(i)"
                (click)="onRowClick(row)"
              >
                @for (col of columns(); track col.key) {
                  <td 
                    class="px-6 whitespace-nowrap"
                    [class.py-4]="!config().compact"
                    [class.py-2]="config().compact"
                    [class.text-left]="col.align === 'left' || !col.align"
                    [class.text-center]="col.align === 'center'"
                    [class.text-right]="col.align === 'right'"
                  >
                    @if (col.template) {
                      <ng-container *ngTemplateOutlet="col.template; context: { $implicit: row[col.key], row: row, index: i }"></ng-container>
                    } @else {
                      <span class="text-sm text-gray-900">{{ row[col.key] }}</span>
                    }
                  </td>
                }
                @if (hasActions()) {
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ng-content select="[table-actions]"></ng-content>
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>

      <!-- Pagination -->
      @if (showPagination() && totalItems() > 0) {
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button 
              (click)="onPageChange(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              (click)="onPageChange(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ startIndex() }}</span> to <span class="font-medium">{{ endIndex() }}</span> of
                <span class="font-medium">{{ totalItems() }}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button 
                  (click)="onPageChange(currentPage() - 1)"
                  [disabled]="currentPage() === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                @for (page of visiblePages(); track page) {
                  <button 
                    (click)="onPageChange(page)"
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    [class]="page === currentPage() ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                  >
                    {{ page }}
                  </button>
                }
                <button 
                  (click)="onPageChange(currentPage() + 1)"
                  [disabled]="currentPage() === totalPages()"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  // Inputs
  readonly data = input<T[]>([]);
  readonly columns = input<TableColumn<T>[]>([]);
  readonly config = input<TableConfig>({ striped: true, hover: true });
  readonly isLoading = input<boolean>(false);
  readonly emptyMessage = input<string>('No data available');
  readonly hasActions = input<boolean>(false);
  readonly trackByFn = input<(item: T, index: number) => unknown>((item, index) => index);
  
  // Pagination inputs
  readonly showPagination = input<boolean>(false);
  readonly currentPage = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalItems = input<number>(0);

  // Sorting inputs
  readonly sortColumn = input<string>('');
  readonly sortDirection = input<'asc' | 'desc'>('asc');

  // Outputs
  readonly rowClicked = output<T>();
  readonly sortChanged = output<SortEvent>();
  readonly pageChanged = output<PageEvent>();

  // Computed values
  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));
  
  readonly startIndex = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  
  readonly endIndex = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  get tableClasses(): string {
    const cfg = this.config();
    const classes: string[] = [];
    if (cfg.bordered) classes.push('border');
    return classes.join(' ');
  }

  getRowClasses(index: number): string {
    const cfg = this.config();
    const classes: string[] = [];
    
    if (cfg.striped && index % 2 === 1) {
      classes.push('bg-gray-50');
    }
    if (cfg.hover) {
      classes.push('hover:bg-gray-100 cursor-pointer');
    }
    
    return classes.join(' ');
  }

  onRowClick(row: T): void {
    this.rowClicked.emit(row);
  }

  onSort(column: string): void {
    let direction: 'asc' | 'desc' = 'asc';
    if (this.sortColumn() === column && this.sortDirection() === 'asc') {
      direction = 'desc';
    }
    this.sortChanged.emit({ column, direction });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChanged.emit({ page, pageSize: this.pageSize() });
    }
  }
}
