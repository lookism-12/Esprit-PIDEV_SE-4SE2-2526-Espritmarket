import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, AdminUser } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {

  // ── State ─────────────────────────────────────────────────────────────────
  readonly allUsers  = signal<AdminUser[]>([]);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);
  readonly total     = signal(0);

  // Filters
  searchTerm   = '';
  statusFilter = '';   // 'active' | 'inactive' | ''
  roleFilter   = '';   // role string or ''

  // Modal state
  selectedUser: AdminUser | null = null;
  showDeleteModal = false;

  // ── Computed filtered list ────────────────────────────────────────────────
  readonly filteredUsers = computed(() => {
    const q = this.searchTerm.toLowerCase().trim();
    return this.allUsers().filter(u => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchSearch = !q || fullName.includes(q) || u.email.toLowerCase().includes(q);
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'active'   &&  u.enabled) ||
        (this.statusFilter === 'inactive' && !u.enabled);
      const matchRole = !this.roleFilter ||
        u.roles.some(r => r.toUpperCase() === this.roleFilter.toUpperCase());
      return matchSearch && matchStatus && matchRole;
    });
  });

  /** All distinct roles present in the loaded users, for the filter dropdown */
  readonly availableRoles = computed(() =>
    [...new Set(this.allUsers().flatMap(u => u.roles))].sort()
  );

  constructor(
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.userService.getAllUsers({ limit: 500 }).subscribe({
      next: ({ users, total }) => {
        this.allUsers.set(users);
        this.total.set(total);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.error.set('Could not load users. Check your connection or permissions.');
        this.isLoading.set(false);
      }
    });
  }

  // ── Filter helpers (called from template on input change) ─────────────────
  onFilterChange(): void {
    // filteredUsers is a computed signal — just trigger change detection
    // by reassigning the primitive filter values (Angular detects this automatically)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  openDeleteModal(user: AdminUser): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;
    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.toastService.success('User deleted successfully');
        this.allUsers.update(list => list.filter(u => u.id !== this.selectedUser!.id));
        this.total.update(n => n - 1);
        this.closeModals();
      },
      error: () => {
        this.toastService.error('Failed to delete user');
        this.closeModals();
      }
    });
  }

  closeModals(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  getFullName(user: AdminUser): string {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  }

  getInitials(user: AdminUser): string {
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || user.email[0].toUpperCase();
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      ADMIN:     'bg-purple-100 text-purple-800',
      PROVIDER:  'bg-blue-100 text-blue-800',
      SELLER:    'bg-indigo-100 text-indigo-800',
      CLIENT:    'bg-gray-100 text-gray-700',
      PASSENGER: 'bg-teal-100 text-teal-700',
      DRIVER:    'bg-amber-100 text-amber-700',
      DELIVERY:  'bg-orange-100 text-orange-700',
    };
    return map[role.toUpperCase()] ?? 'bg-gray-100 text-gray-700';
  }

  getStatusClass(enabled: boolean): string {
    return enabled
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-700';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}
