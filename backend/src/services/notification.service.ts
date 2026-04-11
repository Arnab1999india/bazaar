import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.config";

export type NotificationEvent =
  | "new_seller_registered"
  | "order_placed"
  | "product_approved"
  | "order_status_updated";

export interface NotificationPayload {
  event: NotificationEvent;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

class NotificationService {
  private io: SocketServer | null = null;
  // userId → Set of socket IDs (a user can have multiple tabs open)
  private userSockets = new Map<string, Set<string>>();

  init(httpServer: HttpServer): void {
    this.io = new SocketServer(httpServer, {
      cors: { origin: true, credentials: true },
    });

    this.io.on("connection", (socket: Socket) => {
      // Client must send { token } on connect
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        socket.disconnect(true);
        return;
      }

      try {
        const decoded = jwt.verify(token, envConfig.JWT_SECRET) as { id: string };
        const userId = decoded.id;

        // Register socket
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);

        socket.on("disconnect", () => {
          const sockets = this.userSockets.get(userId);
          if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) this.userSockets.delete(userId);
          }
        });
      } catch {
        socket.disconnect(true);
      }
    });
  }

  private emit(userId: string, payload: NotificationPayload): void {
    if (!this.io) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;
    for (const socketId of sockets) {
      this.io.to(socketId).emit("notification", payload);
    }
  }

  /** Notify all admin sockets */
  private emitToRole(role: "admin", payload: NotificationPayload): void {
    // We broadcast to a room; clients join their role room on connect
    if (!this.io) return;
    this.io.emit(`notification:${role}`, payload);
  }

  notifyAdmins(event: NotificationEvent, message: string, data?: Record<string, any>): void {
    if (!this.io) return;
    const payload: NotificationPayload = { event, message, data, timestamp: new Date().toISOString() };
    this.io.emit("notification:admin", payload);
  }

  notifyUser(userId: string, event: NotificationEvent, message: string, data?: Record<string, any>): void {
    const payload: NotificationPayload = { event, message, data, timestamp: new Date().toISOString() };
    this.emit(userId, payload);
  }
}

export const notificationService = new NotificationService();
