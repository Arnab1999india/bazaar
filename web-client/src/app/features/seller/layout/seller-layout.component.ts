import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SellerHeaderComponent } from './seller-header.component';
import { SellerSidebarComponent } from './seller-sidebar.component';
import { SellerFooterComponent } from './seller-footer.component';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SellerHeaderComponent,
    SellerSidebarComponent,
    SellerFooterComponent,
  ],
  templateUrl: './seller-layout.component.html',
  styleUrl: './seller-layout.component.scss',
})
export class SellerLayoutComponent {}
