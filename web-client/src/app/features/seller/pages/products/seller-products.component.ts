import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
})
export class SellerProductsComponent {
  products: SellerProduct[] = [
    { id: 'sku-101', name: 'Aurora Headphones', price: 8999, stock: 42 },
    { id: 'sku-102', name: 'Nimbus Smartwatch', price: 6499, stock: 16 },
    { id: 'sku-103', name: 'Vista Backpack', price: 3299, stock: 8 },
  ];

  constructor(private router: Router) {}

  editProduct(productId: string): void {
    this.router.navigate(['/seller/products', productId, 'edit']);
  }

  deleteProduct(productId: string): void {
    this.products = this.products.filter((item) => item.id !== productId);
  }
}
