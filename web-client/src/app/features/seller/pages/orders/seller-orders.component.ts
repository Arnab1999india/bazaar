import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerOrderService } from '../../../../core/services/seller-order.service';
import { Order, OrderItemStatus } from '../../../../core/models/api.models';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.scss',
})
export class SellerOrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  errorMessage = '';
  updatingItemId = '';

  statusOptions: OrderItemStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  constructor(private sellerOrderService: SellerOrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.sellerOrderService.listSellerOrders().subscribe({
      next: (res) => {
        this.orders = res.data?.orders || [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load seller orders.';
        this.isLoading = false;
      },
    });
  }

  updateItemStatus(orderId: string, itemId: string, status: OrderItemStatus) {
    this.updatingItemId = itemId;
    this.sellerOrderService.updateItemStatus(orderId, itemId, status).subscribe({
      next: () => {
        this.updatingItemId = '';
        this.loadOrders();
      },
      error: () => {
        this.errorMessage = 'Unable to update order status.';
        this.updatingItemId = '';
      },
    });
  }

  orderId(order: Order): string {
    return order.id || order._id || '';
  }

  itemId(item: { id?: string; _id?: string }): string {
    return item.id || item._id || '';
  }
}
