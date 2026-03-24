import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { User } from '../../core/models/entities.model';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent],
    templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
    users: User[] = [];
    filteredUsers: User[] = [];
    selectedUser: User | null = null;
    showUserModal = false;
    showDeleteModal = false;
    isEditMode = false;

    searchTerm = '';
    statusFilter = '';
    roleFilter = '';

    formData: Partial<User> = {
        name: '',
        email: '',
        role: 'user',
        status: 'active'
    };

    constructor(
        private userService: UserService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.getUsers().subscribe(users => {
            this.users = users;
            this.filterUsers();
        });
    }

    filterUsers() {
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !this.searchTerm ||
                user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
            const matchesRole = !this.roleFilter || user.role === this.roleFilter;
            return matchesSearch && matchesStatus && matchesRole;
        });
    }

    openCreateModal() {
        this.isEditMode = false;
        this.formData = { name: '', email: '', role: 'user', status: 'active' };
        this.showUserModal = true;
    }

    openEditModal(user: User) {
        this.isEditMode = true;
        this.selectedUser = user;
        this.formData = { ...user };
        this.showUserModal = true;
    }

    openDeleteModal(user: User) {
        this.selectedUser = user;
        this.showDeleteModal = true;
    }

    saveUser() {
        if (this.isEditMode && this.selectedUser) {
            this.userService.updateUser(this.selectedUser.id, this.formData).subscribe(result => {
                if (result) {
                    this.toastService.success('User updated successfully');
                    this.loadUsers();
                }
                this.closeModals();
            });
        } else {
            this.userService.createUser(this.formData as Omit<User, 'id' | 'createdAt'>).subscribe(result => {
                this.toastService.success('User created successfully');
                this.loadUsers();
                this.closeModals();
            });
        }
    }

    confirmDelete() {
        if (!this.selectedUser) return;
        this.userService.deleteUser(this.selectedUser.id).subscribe(() => {
            this.toastService.success('User deleted successfully');
            this.loadUsers();
            this.closeModals();
        });
    }

    closeModals() {
        this.showUserModal = false;
        this.showDeleteModal = false;
        this.selectedUser = null;
    }

    getRoleClass(role: string): string {
        const classes: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-800',
            moderator: 'bg-blue-100 text-blue-800',
            user: 'bg-gray-100 text-gray-800'
        };
        return classes[role] || 'bg-gray-100 text-gray-800';
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            suspended: 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
