import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KYCService } from '../../../../core/services/kyc.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { KYCApplication } from '../../../../core/models/entities.model';

@Component({
  selector: 'app-kyc-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './kyc-table.component.html'
})
export class KycTableComponent implements OnInit {
  applications: KYCApplication[] = [];
  selectedApplication: KYCApplication | null = null;
  showApproveModal = false;
  showRejectModal = false;
  rejectNotes = '';

  constructor(
    private kycService: KYCService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.kycService.getApplications().subscribe(apps => {
      this.applications = apps.filter(a => a.status === 'pending');
    });
  }

  openApproveModal(app: KYCApplication) {
    this.selectedApplication = app;
    this.showApproveModal = true;
  }

  openRejectModal(app: KYCApplication) {
    this.selectedApplication = app;
    this.showRejectModal = true;
    this.rejectNotes = '';
  }

  confirmApprove() {
    if (!this.selectedApplication) return;

    this.kycService.approveApplication(
      this.selectedApplication.id,
      'Admin User'
    ).subscribe(result => {
      if (result) {
        this.toastService.success(`KYC application for ${result.userName} approved successfully`);
        this.loadApplications();
      }
      this.showApproveModal = false;
      this.selectedApplication = null;
    });
  }

  confirmReject() {
    if (!this.selectedApplication) return;

    this.kycService.rejectApplication(
      this.selectedApplication.id,
      'Admin User',
      this.rejectNotes
    ).subscribe(result => {
      if (result) {
        this.toastService.warning(`KYC application for ${result.userName} rejected`);
        this.loadApplications();
      }
      this.showRejectModal = false;
      this.selectedApplication = null;
      this.rejectNotes = '';
    });
  }

  closeModals() {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedApplication = null;
    this.rejectNotes = '';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
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
