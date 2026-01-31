import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastSubject = new Subject<ToastMessage>();
  private nextId = 1;

  get toast$(): Observable<ToastMessage> {
    return this.toastSubject.asObservable();
  }

  show(type: ToastType, message: string, duration = 4000): void {
    this.toastSubject.next({
      id: this.nextId++,
      type,
      message,
      duration,
    });
  }

  success(message: string, duration = 3500): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 4500): void {
    this.show('error', message, duration);
  }

  info(message: string, duration = 3500): void {
    this.show('info', message, duration);
  }
}
