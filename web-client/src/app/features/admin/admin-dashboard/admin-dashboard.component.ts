import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AdminSellerService } from '../../../core/services/admin-seller.service';
import { AdminService } from '../../../core/services/admin.service';
import { SellerProfile, AdminStats, AdminUser, Category, Order } from '../../../core/models/api.models';

type AdminTab = 'overview' | 'sellers' | 'users' | 'orders' | 'admins' | 'categories';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  // Tab state
  activeTab: AdminTab = 'overview';

  // Overview
  platformStats: AdminStats | null = null;
  isLoadingStats = false;

  // Seller management
  sellers: SellerProfile[] = [];
  sellerStatusFilter: 'pending' | 'approved' | 'rejected' = 'pending';
  isLoadingSellers = false;
  rejectReasons: Record<string, string> = {};
  sellerActionMessage = '';
  sellerErrorMessage = '';

  // User management
  users: AdminUser[] = [];
  userRoleFilter = 'all';
  isLoadingUsers = false;
  userErrorMessage = '';

  // Order management
  orders: Order[] = [];
  orderStatusFilter = 'all';
  isLoadingOrders = false;
  orderErrorMessage = '';
  orderStatusUpdates: Record<string, string> = {};   // orderId → selected new status
  updatingOrderId: string | null = null;
  orderUpdateMessage = '';

  // Admin management
  admins: AdminUser[] = [];
  isLoadingAdmins = false;
  adminErrorMessage = '';
  adminSuccessMessage = '';
  showCreateAdminForm = false;
  isCreatingAdmin = false;
  createAdminForm: FormGroup;

  constructor(
    private adminSellerService: AdminSellerService,
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.createAdminForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: [''],
      parentId: [''],
    });
  }

  private passwordMatchValidator(control: AbstractControl) {
    const pw = control.get('password');
    const cpw = control.get('confirmPassword');
    if (pw && cpw && pw.value !== cpw.value) {
      cpw.setErrors({ mustMatch: true });
    } else {
      const errors = cpw?.errors;
      if (errors?.['mustMatch']) {
        delete errors['mustMatch'];
        cpw?.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.setTab('overview');
  }

  // ── Category Management ───────────────────────
  categories: Category[] = [];
  isLoadingCategories = false;
  categoryErrorMessage = '';
  categorySuccessMessage = '';
  showCategoryForm = false;
  editingCategory: Category | null = null;
  isSavingCategory = false;
  categoryForm!: FormGroup;

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    switch (tab) {
      case 'overview':    this.loadStats(); break;
      case 'sellers':     this.loadSellers(); break;
      case 'users':       this.loadUsers(); break;
      case 'orders':      this.loadOrders(); break;
      case 'admins':      this.loadAdmins(); break;
      case 'categories':  this.loadCategories(); break;
    }
  }

  // ── Overview ──────────────────────────────────
  loadStats(): void {
    this.isLoadingStats = true;
    this.adminService.getPlatformStats().subscribe({
      next: (res) => { this.platformStats = res.data; this.isLoadingStats = false; },
      error: ()  => { this.isLoadingStats = false; },
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  }

  // ── Sellers ───────────────────────────────────
  loadSellers(): void {
    this.isLoadingSellers = true;
    this.sellerErrorMessage = '';
    this.adminSellerService.listSellers(this.sellerStatusFilter).subscribe({
      next: (res) => { this.sellers = res.data ?? []; this.isLoadingSellers = false; },
      error: ()  => { this.sellerErrorMessage = 'Unable to load sellers.'; this.isLoadingSellers = false; },
    });
  }

  setSellerFilter(status: 'pending' | 'approved' | 'rejected'): void {
    this.sellerStatusFilter = status;
    this.loadSellers();
  }

  approveSeller(sellerId: string): void {
    this.sellerActionMessage = '';
    this.adminSellerService.approveSeller(sellerId).subscribe({
      next: () => { this.sellerActionMessage = 'Seller approved successfully.'; this.loadSellers(); },
      error: () => { this.sellerActionMessage = 'Unable to approve the seller.'; },
    });
  }

  rejectSeller(sellerId: string): void {
    const reason = (this.rejectReasons[sellerId] || '').trim();
    if (!reason) { this.sellerActionMessage = 'Please provide a rejection reason.'; return; }
    this.sellerActionMessage = '';
    this.adminSellerService.rejectSeller(sellerId, reason).subscribe({
      next: () => {
        this.sellerActionMessage = 'Seller rejected.';
        this.rejectReasons[sellerId] = '';
        this.loadSellers();
      },
      error: () => { this.sellerActionMessage = 'Unable to reject the seller.'; },
    });
  }

  // ── Users ─────────────────────────────────────
  loadUsers(): void {
    this.isLoadingUsers = true;
    this.userErrorMessage = '';
    this.adminService.listUsers(this.userRoleFilter).subscribe({
      next: (res) => { this.users = res.data ?? []; this.isLoadingUsers = false; },
      error: ()  => { this.userErrorMessage = 'Unable to load users.'; this.isLoadingUsers = false; },
    });
  }

  setUserFilter(role: string): void {
    this.userRoleFilter = role;
    this.loadUsers();
  }

  // ── Orders ────────────────────────────────────
  loadOrders(): void {
    this.isLoadingOrders = true;
    this.orderErrorMessage = '';
    this.orderUpdateMessage = '';
    this.adminService.listOrders(this.orderStatusFilter).subscribe({
      next: (res) => {
        this.orders = res.data ?? [];
        // Pre-fill the status dropdown for each order with its current status
        this.orderStatusUpdates = {};
        this.orders.forEach(o => { this.orderStatusUpdates[o.id || (o as any)._id] = o.status; });
        this.isLoadingOrders = false;
      },
      error: () => { this.orderErrorMessage = 'Unable to load orders.'; this.isLoadingOrders = false; },
    });
  }

  setOrderFilter(status: string): void {
    this.orderStatusFilter = status;
    this.loadOrders();
  }

  updateOrderStatus(order: Order): void {
    const id = order.id || (order as any)._id;
    const newStatus = this.orderStatusUpdates[id];
    if (!newStatus || newStatus === order.status) return;
    this.updatingOrderId = id;
    this.orderUpdateMessage = '';
    this.adminService.updateOrderStatus(id, newStatus).subscribe({
      next: () => {
        this.orderUpdateMessage = `Order ${order.orderNumber || id} updated to "${newStatus}".`;
        this.updatingOrderId = null;
        this.loadOrders();
      },
      error: (err) => {
        this.orderErrorMessage = err?.error?.message || 'Failed to update order status.';
        this.updatingOrderId = null;
      },
    });
  }

  orderStatuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'];
  readonly editableStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'];

  objectKeys(obj: Record<string, number>): string[] {
    return Object.keys(obj);
  }

  // ── Admin Management ──────────────────────────
  loadAdmins(): void {
    this.isLoadingAdmins = true;
    this.adminService.listAdmins().subscribe({
      next: (res) => { this.admins = res.data ?? []; this.isLoadingAdmins = false; },
      error: ()  => { this.adminErrorMessage = 'Unable to load admin list.'; this.isLoadingAdmins = false; },
    });
  }

  toggleCreateAdminForm(): void {
    this.showCreateAdminForm = !this.showCreateAdminForm;
    if (!this.showCreateAdminForm) {
      this.createAdminForm.reset();
      this.adminSuccessMessage = '';
      this.adminErrorMessage = '';
    }
  }

  submitCreateAdmin(): void {
    if (this.createAdminForm.invalid) {
      this.createAdminForm.markAllAsTouched();
      return;
    }
    this.isCreatingAdmin = true;
    this.adminSuccessMessage = '';
    this.adminErrorMessage = '';

    const { name, email, password } = this.createAdminForm.value;
    this.adminService.createAdmin({ name, email, password }).subscribe({
      next: (res) => {
        this.isCreatingAdmin = false;
        this.adminSuccessMessage = `Admin account created for ${email}`;
        this.createAdminForm.reset();
        this.showCreateAdminForm = false;
        this.loadAdmins();
      },
      error: (err) => {
        this.isCreatingAdmin = false;
        this.adminErrorMessage = err?.error?.message || 'Failed to create admin account.';
      },
    });
  }

  buyerName(buyer: any): string {
    if (!buyer) return '—';
    if (typeof buyer === 'string') return buyer;
    return buyer.name || buyer.email || '—';
  }

  // ── Category helpers ──────────────────────────
  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryErrorMessage = '';
    this.adminService.listCategories().subscribe({
      next: (res) => { this.categories = res.data ?? []; this.isLoadingCategories = false; },
      error: () => { this.categoryErrorMessage = 'Unable to load categories.'; this.isLoadingCategories = false; },
    });
  }

  openCategoryForm(cat?: Category): void {
    this.editingCategory = cat ?? null;
    this.categorySuccessMessage = '';
    this.categoryErrorMessage = '';
    this.categoryForm.reset({
      name: cat?.name ?? '',
      slug: cat?.slug ?? '',
      parentId: cat?.parentId ?? '',
    });
    this.showCategoryForm = true;
  }

  closeCategoryForm(): void {
    this.showCategoryForm = false;
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  submitCategoryForm(): void {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
    this.isSavingCategory = true;
    this.categorySuccessMessage = '';
    this.categoryErrorMessage = '';
    const { name, slug, parentId } = this.categoryForm.value;
    const payload = { name, slug: slug || undefined, parentId: parentId || null };

    const req$ = this.editingCategory
      ? this.adminService.updateCategory(this.editingCategory.id, payload)
      : this.adminService.createCategory(payload);

    req$.subscribe({
      next: () => {
        this.isSavingCategory = false;
        this.categorySuccessMessage = `Category ${this.editingCategory ? 'updated' : 'created'} successfully.`;
        this.closeCategoryForm();
        this.loadCategories();
      },
      error: (err) => {
        this.isSavingCategory = false;
        this.categoryErrorMessage = err?.error?.message || 'Failed to save category.';
      },
    });
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Delete "${cat.name}" and all its sub-categories?`)) return;
    this.adminService.deleteCategory(cat.id).subscribe({
      next: () => { this.categorySuccessMessage = `"${cat.name}" deleted.`; this.loadCategories(); },
      error: (err) => { this.categoryErrorMessage = err?.error?.message || 'Failed to delete category.'; },
    });
  }

  flattenCategories(cats: Category[], depth = 0): Array<Category & { depth: number }> {
    const result: Array<Category & { depth: number }> = [];
    for (const cat of cats) {
      result.push({ ...cat, depth });
      if (cat.children?.length) {
        result.push(...this.flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  }
}
