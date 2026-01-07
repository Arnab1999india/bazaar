import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-seller-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './seller-sidebar.component.html',
  styleUrl: './seller-sidebar.component.scss',
})
export class SellerSidebarComponent {
  menu: MenuItem[] = [
    { label: 'Overview', route: '/seller' },
    {
      label: 'Catalog',
      expanded: true,
      children: [
        { label: 'All Products', route: '/seller/products' },
        { label: 'Add Product', route: '/seller/products/new' },
        {
          label: 'Collections',
          children: [
            { label: 'Summer Drop', route: '/seller/products' },
            { label: 'Clearance', route: '/seller/products' },
          ],
        },
      ],
    },
    {
      label: 'Orders',
      children: [
        { label: 'All Orders', route: '/seller' },
        { label: 'Returns', route: '/seller' },
      ],
    },
    {
      label: 'Storefront',
      children: [
        { label: 'Themes', route: '/seller' },
        { label: 'Policies', route: '/seller' },
      ],
    },
    { label: 'Settings', route: '/profile' },
  ];

  toggle(item: MenuItem): void {
    item.expanded = !item.expanded;
  }
}
