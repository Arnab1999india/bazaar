import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastMessage, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent implements OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription: Subscription;

  constructor(private toastService: ToastService) {
    this.subscription = this.toastService.toast$.subscribe((toast) => {
      this.toasts = [...this.toasts, toast];
      setTimeout(() => this.dismiss(toast.id), toast.duration);
    });
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
