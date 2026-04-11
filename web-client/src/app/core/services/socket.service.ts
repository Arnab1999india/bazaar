import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

export interface NotificationPayload {
  event: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private notification$ = new Subject<NotificationPayload>();
  private adminNotification$ = new Subject<NotificationPayload>();

  constructor(private toastService: ToastService) {}

  /** Connect to the Socket.io server with a JWT access token. */
  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl || environment.apiBaseUrl.replace('/api', ''), {
      auth: { token },
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('notification', (payload: NotificationPayload) => {
      this.notification$.next(payload);
      this.toastService.info(payload.message);
    });

    this.socket.on('notification:admin', (payload: NotificationPayload) => {
      this.adminNotification$.next(payload);
      this.toastService.info(payload.message);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /** Observable for per-user notifications (order updates, product approval) */
  onNotification(): Observable<NotificationPayload> {
    return this.notification$.asObservable();
  }

  /** Observable for admin-broadcast notifications */
  onAdminNotification(): Observable<NotificationPayload> {
    return this.adminNotification$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
