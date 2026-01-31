import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, concatMap, map, of, tap } from 'rxjs';
import { CartItem, OrderTotals } from '../models/cart.models';
import { CartResponse, Product } from '../models/api.models';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly localStorageKey = 'bazaar.cart.local';
  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.cartItemsSubject.next(this.getLocalCartItems());

    this.authService.authState$.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this.syncLocalCartToBackend();
      } else {
        this.persistLocalCart(this.cartItemsSubject.value);
      }
    });
  }

  loadCart(): Observable<CartResponse> {
    if (!this.authService.isAuthenticated()) {
      const local = this.getLocalCartItems();
      this.cartItemsSubject.next(local);
      return of(this.buildLocalResponse(local));
    }
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
    const productId = product.id || (product as any)._id;
    if (!productId) {
      return of(this.buildLocalResponse(this.cartItemsSubject.value));
    }
    if (!this.authService.isAuthenticated()) {
      const updated = this.addToLocalCart(product, quantity);
      return of(this.buildLocalResponse(updated));
    }
    return this.http
      .post<{ data: CartResponse }>(
        `${API_BASE_URL}${API_ENDPOINTS.cart.add}`,
        { productId, quantity },
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
    if (!this.authService.isAuthenticated()) {
      const updated = this.updateLocalQuantity(productId, quantity);
      return of(this.buildLocalResponse(updated));
    }
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
    if (!this.authService.isAuthenticated()) {
      const updated = this.removeFromLocalCart(productId);
      return of(this.buildLocalResponse(updated));
    }
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
    if (!this.authService.isAuthenticated()) {
      this.cartItemsSubject.next([]);
      this.persistLocalCart([]);
      return of({ message: 'Cart cleared successfully' });
    }
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

  private getLocalCartItems(): CartItem[] {
    const stored = localStorage.getItem(this.localStorageKey);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistLocalCart(items: CartItem[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(items));
  }

  private normalizeProduct(product: Product): Product {
    return {
      id: product.id || (product as any)._id,
      name: product.name,
      price: product.price,
      category: product.category,
      brand: product.brand,
      description: product.description,
      imageUrl: product.imageUrl,
      rating: product.rating,
      stockStatus: product.stockStatus,
      totalStock: product.totalStock,
      tags: product.tags,
      attributes: product.attributes,
      variants: product.variants,
    };
  }

  private addToLocalCart(product: Product, quantity: number): CartItem[] {
    const items = [...this.cartItemsSubject.value];
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ product: this.normalizeProduct(product), quantity });
    }
    const filtered = items.filter((item) => item.quantity > 0);
    this.cartItemsSubject.next(filtered);
    this.persistLocalCart(filtered);
    return filtered;
  }

  private updateLocalQuantity(productId: string, quantity: number): CartItem[] {
    let items = [...this.cartItemsSubject.value];
    items = items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    items = items.filter((item) => item.quantity > 0);
    this.cartItemsSubject.next(items);
    this.persistLocalCart(items);
    return items;
  }

  private removeFromLocalCart(productId: string): CartItem[] {
    const items = this.cartItemsSubject.value.filter(
      (item) => item.product.id !== productId
    );
    this.cartItemsSubject.next(items);
    this.persistLocalCart(items);
    return items;
  }

  private buildLocalResponse(items: CartItem[]): CartResponse {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    return {
      id: 'local',
      items,
      totalItems,
      totalAmount,
    };
  }

  private syncLocalCartToBackend(): void {
    const localItems = this.getLocalCartItems();
    if (localItems.length === 0) {
      this.loadCart().subscribe();
      return;
    }

    of(...localItems)
      .pipe(
        concatMap((item) =>
          this.http
            .post<{ data: CartResponse }>(
              `${API_BASE_URL}${API_ENDPOINTS.cart.add}`,
              { productId: item.product.id, quantity: item.quantity },
              { headers: this.authService.authHeaders }
            )
            .pipe(map((res) => res.data))
        )
      )
      .subscribe({
        next: () => {},
        error: () => {},
        complete: () => {
          localStorage.removeItem(this.localStorageKey);
          this.loadCart().subscribe();
        },
      });
  }
}
