import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { OrderService } from '../../core/services/order.service';
import { AuthUser, Order } from '../../core/models/api.models';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL, API_ENDPOINTS } from '../../core/constants/api.constants';

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

type ViewState =
  | 'dashboard'
  | 'orders'
  | 'order-detail'
  | 'addresses'
  | 'security'
  | 'wallet'
  | 'contact';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ProfileCardComponent],
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
  orders: Order[] = [];
  isLoadingOrders = false;
  orderError = '';
  selectedOrder: Order | null = null;
  isCancellingOrder = false;
  cancelError = '';
  isRefunding = false;
  refundMessage = '';

  // Stepper — ordered list of all possible forward statuses
  readonly orderSteps = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

  // Security
  passwordForm: FormGroup;
  isChangingPassword = false;
  securityMessage = '';

  // Wallet
  walletBalance = 0;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private orderService: OrderService,
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
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
    if (view === 'orders') {
      this.loadOrders();
    }
  }

  // --- Orders ---
  loadOrders(): void {
    this.isLoadingOrders = true;
    this.orderError = '';
    this.orderService.listOrders().subscribe({
      next: (res) => {
        // Backend may return { orders: [] } or an array directly
        const payload = res.data as any;
        this.orders = Array.isArray(payload) ? payload : (payload?.orders ?? []);
        this.isLoadingOrders = false;
      },
      error: () => {
        this.orderError = 'Unable to load orders. Please try again.';
        this.isLoadingOrders = false;
      },
    });
  }

  viewOrderDetail(order: Order): void {
    this.selectedOrder = null;
    this.cancelError = '';
    this.orderService.getOrderById(order.id || (order as any)._id).subscribe({
      next: (res) => {
        this.selectedOrder = res.data;
        this.currentView = 'order-detail';
      },
      error: () => {
        // fallback: use the list data
        this.selectedOrder = order;
        this.currentView = 'order-detail';
      },
    });
  }

  backToOrders(): void {
    this.selectedOrder = null;
    this.cancelError = '';
    this.currentView = 'orders';
  }

  cancelOrder(): void {
    if (!this.selectedOrder || this.isCancellingOrder) return;
    this.isCancellingOrder = true;
    this.cancelError = '';
    const id = this.selectedOrder.id || (this.selectedOrder as any)._id;
    this.orderService.cancelOrder(id).subscribe({
      next: (res) => {
        this.selectedOrder = res.data;
        this.isCancellingOrder = false;
        // Refresh the list in background
        this.orderService.listOrders().subscribe({
          next: (r) => {
            const payload = r.data as any;
            this.orders = Array.isArray(payload) ? payload : (payload?.orders ?? []);
          },
        });
      },
      error: (err) => {
        this.cancelError = err?.error?.message || 'Unable to cancel this order.';
        this.isCancellingOrder = false;
      },
    });
  }

  canCancel(order: Order | null): boolean {
    if (!order) return false;
    return order.status === 'pending' || order.status === 'processing';
  }

  canRefund(order: Order | null): boolean {
    if (!order) return false;
    return (order as any).paymentStatus === 'completed' &&
      (order.status === 'cancelled' || order.status === 'delivered');
  }

  requestRefund(): void {
    if (!this.selectedOrder || this.isRefunding) return;
    this.isRefunding = true;
    this.refundMessage = '';
    const orderId = this.selectedOrder.id || (this.selectedOrder as any)._id;
    this.http.post<any>(
      `${API_BASE_URL}${API_ENDPOINTS.payment.refund}`,
      { orderId },
      { headers: this.authService.authHeaders }
    ).subscribe({
      next: () => {
        this.refundMessage = 'Refund initiated successfully.';
        this.isRefunding = false;
        if (this.selectedOrder) (this.selectedOrder as any).paymentStatus = 'refunded';
      },
      error: (err) => {
        this.refundMessage = err?.error?.message || 'Refund request failed.';
        this.isRefunding = false;
      },
    });
  }

  getStepIndex(status: string): number {
    return this.orderSteps.indexOf(status);
  }

  isStepComplete(stepName: string, currentStatus: string): boolean {
    if (currentStatus === 'cancelled' || currentStatus === 'returned' || currentStatus === 'refunded') return false;
    return this.getStepIndex(stepName) <= this.getStepIndex(currentStatus);
  }

  isStepActive(stepName: string, currentStatus: string): boolean {
    return stepName === currentStatus;
  }

  getItemImage(item: any): string {
    if (item.imageUrl) return item.imageUrl;
    const product = item.product;
    if (!product) return 'https://via.placeholder.com/60?text=Item';
    if (typeof product === 'object' && product.imageUrl?.length) return product.imageUrl[0];
    return 'https://via.placeholder.com/60?text=Item';
  }

  getItemName(item: any): string {
    if (item.name) return item.name;
    const product = item.product;
    if (!product) return 'Product';
    if (typeof product === 'object') return product.name || 'Product';
    return 'Product';
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
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
