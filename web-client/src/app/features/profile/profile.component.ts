import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AuthUser } from '../../core/models/api.models';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card.component';

interface Address {
  id: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: string[];
}

type ViewState =
  | 'dashboard'
  | 'orders'
  | 'addresses'
  | 'security'
  | 'wallet'
  | 'contact';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProfileCardComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  user: AuthUser | null = null;
  currentView: ViewState = 'dashboard';

  // Addresses
  addresses: Address[] = [
    {
      id: '1',
      fullName: 'Arnab Adak',
      street: '123 Main Street, Near City Center',
      city: 'Kolkata',
      state: 'West Bengal',
      zip: '700102',
      phone: '9876543210',
      isDefault: true,
    },
  ];
  showAddressForm = false;
  addressForm: FormGroup;

  // Orders
  orders: Order[] = []; // Empty initially to show empty state

  // Security
  passwordForm: FormGroup;
  isChangingPassword = false;
  securityMessage = '';

  // Wallet
  walletBalance = 0;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      phone: ['', Validators.required],
      isDefault: [false],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: (res) => (this.user = res.data),
      error: () => {
        // Fallback demo user
        this.user = {
          id: 'demo',
          name: 'Arnab Adak',
          email: 'arnab@example.com',
          role: 'customer',
        };
      },
    });
  }

  setView(view: ViewState) {
    this.currentView = view;
    this.showAddressForm = false;
    this.securityMessage = '';
  }

  // --- Address Logic ---
  toggleAddressForm() {
    this.showAddressForm = !this.showAddressForm;
    if (!this.showAddressForm) this.addressForm.reset();
  }

  saveAddress() {
    if (this.addressForm.invalid) return;
    const newAddr: Address = {
      id: Date.now().toString(),
      ...this.addressForm.value,
    };

    if (newAddr.isDefault) {
      this.addresses.forEach((a) => (a.isDefault = false));
    } else if (this.addresses.length === 0) {
      newAddr.isDefault = true;
    }

    this.addresses.push(newAddr);
    this.showAddressForm = false;
    this.addressForm.reset();
  }

  deleteAddress(id: string) {
    this.addresses = this.addresses.filter((a) => a.id !== id);
  }

  setDefaultAddress(id: string) {
    this.addresses.forEach((a) => (a.isDefault = a.id === id));
  }

  // --- Security Logic ---
  changePassword() {
    if (this.passwordForm.invalid) return;
    this.isChangingPassword = true;

    // Simulate API call
    setTimeout(() => {
      this.isChangingPassword = false;
      this.securityMessage = 'Password updated successfully!';
      this.passwordForm.reset();
    }, 1500);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => {
        this.authService.signOut();
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
