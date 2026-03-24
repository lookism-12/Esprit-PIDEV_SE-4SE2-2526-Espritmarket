import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../core/services/support.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SupportTicket } from '../../core/models/entities.model';

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent],
    templateUrl: './support.component.html'
})
export class SupportComponent implements OnInit {
    tickets: SupportTicket[] = [];
    filteredTickets: SupportTicket[] = [];
    selectedTicket: SupportTicket | null = null;
    showTicketModal = false;
    showDeleteModal = false;
    isEditMode = false;

    searchTerm = '';
    statusFilter = '';
    priorityFilter = '';

    formData: Partial<SupportTicket> = {
        userName: '',
        subject: '',
        description: '',
        status: 'open',
        priority: 'medium'
    };

    constructor(
        private supportService: SupportService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.loadTickets();
    }

    loadTickets() {
        this.supportService.getTickets().subscribe(tickets => {
            this.tickets = tickets;
            this.filterTickets();
        });
    }

    filterTickets() {
        this.filteredTickets = this.tickets.filter(ticket => {
            const matchesSearch = !this.searchTerm ||
                ticket.subject.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                ticket.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                ticket.description.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStatus = !this.statusFilter || ticket.status === this.statusFilter;
            const matchesPriority = !this.priorityFilter || ticket.priority === this.priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }

    openCreateModal() {
        this.isEditMode = false;
        this.formData = { userName: '', subject: '', description: '', status: 'open', priority: 'medium' };
        this.showTicketModal = true;
    }

    openEditModal(ticket: SupportTicket) {
        this.isEditMode = true;
        this.selectedTicket = ticket;
        this.formData = { ...ticket };
        this.showTicketModal = true;
    }

    openDeleteModal(ticket: SupportTicket) {
        this.selectedTicket = ticket;
        this.showDeleteModal = true;
    }

    saveTicket() {
        if (this.isEditMode && this.selectedTicket) {
            this.supportService.updateTicket(this.selectedTicket.id, this.formData).subscribe(result => {
                if (result) {
                    this.toastService.success('Ticket updated successfully');
                    this.loadTickets();
                }
                this.closeModals();
            });
        } else {
            this.supportService.createTicket(this.formData as Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>).subscribe(() => {
                this.toastService.success('Ticket created successfully');
                this.loadTickets();
                this.closeModals();
            });
        }
    }

    confirmDelete() {
        if (!this.selectedTicket) return;
        this.supportService.deleteTicket(this.selectedTicket.id).subscribe(() => {
            this.toastService.success('Ticket deleted successfully');
            this.loadTickets();
            this.closeModals();
        });
    }

    closeModals() {
        this.showTicketModal = false;
        this.showDeleteModal = false;
        this.selectedTicket = null;
    }

    getPriorityClass(priority: string): string {
        const classes: Record<string, string> = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        };
        return classes[priority] || 'bg-gray-100 text-gray-800';
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            open: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
