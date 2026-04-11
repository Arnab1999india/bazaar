import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MerchandisingService } from '../../../core/services/merchandising.service';
import { Category } from '../../../core/models/api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  categoriesLoading = true;

  private readonly imageMap: Record<string, string> = {
    electronics:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=60',
    fashion:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&auto=format&fit=crop&q=60',
    'home-&-kitchen':
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop&q=60',
    groceries:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60',
    stationery:
      'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=60',
    beauty:
      'https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=400&auto=format&fit=crop&q=60',
    sports:
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&auto=format&fit=crop&q=60',
    books:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=60',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private merchandising: MerchandisingService
  ) {}

  ngOnInit(): void {
    this.merchandising.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data ?? [];
        this.categoriesLoading = false;
      },
      error: () => {
        this.categoriesLoading = false;
      },
    });
  }

  getCategoryImage(slug: string, name: string): string {
    if (this.imageMap[slug]) return this.imageMap[slug];
    const lower = name.toLowerCase();
    for (const key of Object.keys(this.imageMap)) {
      if (lower.includes(key.replace(/-/g, ' ').split(' ')[0])) {
        return this.imageMap[key];
      }
    }
    return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=60';
  }

  navigateToCategory(slug: string): void {
    this.router.navigate(['/products'], { queryParams: { category: slug } });
  }

  handleShopNow(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/products' },
      });
      return;
    }
    this.router.navigate(['/products']);
  }
}
