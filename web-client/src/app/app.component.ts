import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { WishlistService } from './core/services/wishlist.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'bazaar';

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private wishlistService: WishlistService,
  ) {}

  ngOnInit(): void {
    this.authService.authState$.subscribe((authenticated) => {
      if (authenticated) {
        const token = this.authService.getAccessToken();
        if (token) this.socketService.connect(token);
        this.wishlistService.loadWishlist();
      } else {
        this.socketService.disconnect();
      }
    });
  }
}
