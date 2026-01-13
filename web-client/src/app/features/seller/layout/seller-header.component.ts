import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-seller-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-header.component.html',
  styleUrl: './seller-header.component.scss',
})
export class SellerHeaderComponent {}
