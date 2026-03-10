import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SellerService } from '../../../../core/services/seller.service';
import { SellerStatsService } from '../../../../core/services/seller-stats.service';
import { SellerProfile, SellerStats } from '../../../../core/models/api.models';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
})
export class SellerDashboardComponent implements OnInit {
  profile: SellerProfile | null = null;
  stats: SellerStats | null = null;
  isLoadingProfile = true;
  isLoadingStats = false;
  errorMessage = '';

  constructor(
    private sellerService: SellerService,
    private sellerStatsService: SellerStatsService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoadingProfile = true;
    this.sellerService.getMyProfile().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.isLoadingProfile = false;
        if (this.isApproved) {
          this.loadStats();
        }
      },
      error: (err) => {
        if (err?.status !== 404) {
          this.errorMessage = 'Unable to load seller status.';
        }
        this.isLoadingProfile = false;
      },
    });
  }

  loadStats(): void {
    this.isLoadingStats = true;
    this.sellerStatsService.getStats().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.isLoadingStats = false;
      },
      error: () => {
        this.isLoadingStats = false;
      },
    });
  }

  get isApproved(): boolean {
    return this.profile?.status === 'approved';
  }

  get statusLabel(): string {
    if (!this.profile) return 'Onboarding not started';
    switch (this.profile.status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Pending Review';
    }
  }

  get statusClass(): string {
    if (!this.profile) return 'status-not-started';
    switch (this.profile.status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  get growthIndicator(): string {
    const rate = this.stats?.monthly?.growthRate;
    if (rate === null || rate === undefined) return '';
    const num = parseFloat(rate);
    return num >= 0 ? `+${rate}%` : `${rate}%`;
  }

  get growthPositive(): boolean {
    const rate = this.stats?.monthly?.growthRate;
    if (!rate) return true;
    return parseFloat(rate) >= 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  buyerName(buyer: any): string {
    if (!buyer) return 'Unknown';
    if (typeof buyer === 'string') return buyer;
    return buyer.name || buyer.email || 'Unknown';
  }
}
