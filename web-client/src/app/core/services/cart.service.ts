import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { CartItem, OrderTotals } from '../models/cart.models';
import { CartResponse, Product } from '../models/api.models';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  loadCart(): Observable<CartResponse> {
    return this.http
      .get<{ data: CartResponse }>(
        `${API_BASE_URL}${API_ENDPOINTS.cart.get}`,
        { headers: this.authService.authHeaders }
      )
      .pipe(
        tap((res) => this.setCart(res.data)),
        map((res) => res.data)
      );
  }

  addItem(product: Product, quantity = 1): Observable<CartResponse> {
    return this.http
      .post<{ data: CartResponse }>(
        `${API_BASE_URL}${API_ENDPOINTS.cart.add}`,
        { productId: product.id, quantity },
        { headers: this.authService.authHeaders }
      )
      .pipe(
        tap((res) => this.setCart(res.data)),
        map((res) => res.data)
      );
  }

  updateItemQuantity(
    productId: string,
    quantity: number
  ): Observable<CartResponse> {
    return this.http
      .put<{ data: CartResponse }>(
        `${API_BASE_URL}${API_ENDPOINTS.cart.updateItem(productId)}`,
        { quantity },
        { headers: this.authService.authHeaders }
      )
      .pipe(
        tap((res) => this.setCart(res.data)),
        map((res) => res.data)
      );
  }

  removeItem(productId: string): Observable<CartResponse> {
    return this.http
      .delete<{ data: CartResponse }>(
        `${API_BASE_URL}${API_ENDPOINTS.cart.removeItem(productId)}`,
        { headers: this.authService.authHeaders }
      )
      .pipe(
        tap((res) => this.setCart(res.data)),
        map((res) => res.data)
      );
  }

  clear(): Observable<{ message: string }> {
    return this.http
      .delete<{ data: { message: string } }>(
        `${API_BASE_URL}${API_ENDPOINTS.cart.clear}`,
        { headers: this.authService.authHeaders }
      )
      .pipe(
        tap(() => {
          this.cartItemsSubject.next([]);
        }),
        map((res) => res.data)
      );
  }

  getCount(): number {
    return this.cartItemsSubject.value.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  getItems(): CartItem[] {
    return [...this.cartItemsSubject.value];
  }

  getTotals(deliveryCharge = 40, discount = 0): OrderTotals {
    const subtotal = this.cartItemsSubject.value.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
    const total = subtotal + deliveryCharge - discount;
    return { subtotal, deliveryCharge, discount, total };
  }

  private setCart(cart: CartResponse | null): void {
    if (!cart) {
      this.cartItemsSubject.next([]);
      return;
    }
    this.cartItemsSubject.next(cart.items ?? []);
  }
}
