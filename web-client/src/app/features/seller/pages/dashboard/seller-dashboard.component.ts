import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SellerService } from '../../../../core/services/seller.service';
import { SellerProfile } from '../../../../core/models/api.models';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
})
export class SellerDashboardComponent implements OnInit {
  profile: SellerProfile | null = null;
  isLoading = true;
  statusMessage = '';

  constructor(private sellerService: SellerService) {}

  ngOnInit(): void {
    this.sellerService.getMyProfile().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        if (err?.status !== 404) {
          this.statusMessage = 'Unable to load seller status.';
        }
        this.isLoading = false;
      },
    });
  }

  get isApproved(): boolean {
    return this.profile?.status === 'approved';
  }

  get statusLabel(): string {
    if (!this.profile) return 'Onboarding not started';
    switch (this.profile.status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending review';
    }
  }
}
