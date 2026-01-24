import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSellerService } from '../../../core/services/admin-seller.service';
import { SellerProfile } from '../../../core/models/api.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  sellers: SellerProfile[] = [];
  statusFilter: 'pending' | 'approved' | 'rejected' = 'pending';
  isLoading = true;
  errorMessage = '';
  actionMessage = '';
  rejectReasons: Record<string, string> = {};

  constructor(private adminSellerService: AdminSellerService) {}

  ngOnInit(): void {
    this.loadSellers();
  }

  loadSellers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminSellerService.listSellers(this.statusFilter).subscribe({
      next: (res) => {
        this.sellers = res.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load seller approvals right now.';
        this.isLoading = false;
      },
    });
  }

  setStatusFilter(status: 'pending' | 'approved' | 'rejected'): void {
    this.statusFilter = status;
    this.loadSellers();
  }

  approveSeller(sellerId: string): void {
    this.actionMessage = '';
    this.adminSellerService.approveSeller(sellerId).subscribe({
      next: () => {
        this.actionMessage = 'Seller approved.';
        this.loadSellers();
      },
      error: () => {
        this.actionMessage = 'Unable to approve the seller.';
      },
    });
  }

  rejectSeller(sellerId: string): void {
    const reason = (this.rejectReasons[sellerId] || '').trim();
    if (!reason) {
      this.actionMessage = 'Provide a rejection reason.';
      return;
    }
    this.actionMessage = '';
    this.adminSellerService.rejectSeller(sellerId, reason).subscribe({
      next: () => {
        this.actionMessage = 'Seller rejected.';
        this.rejectReasons[sellerId] = '';
        this.loadSellers();
      },
      error: () => {
        this.actionMessage = 'Unable to reject the seller.';
      },
    });
  }
}
