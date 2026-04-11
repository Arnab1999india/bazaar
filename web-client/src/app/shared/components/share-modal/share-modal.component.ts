import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './share-modal.component.html',
  styleUrl: './share-modal.component.scss',
})
export class ShareModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Share this product';
  @Input() shareUrl = '';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  copyLink(): void {
    if (!this.shareUrl) return;
    navigator.clipboard?.writeText(this.shareUrl);
  }

  get encodedUrl(): string {
    return encodeURIComponent(this.shareUrl);
  }

  get encodedTitle(): string {
    return encodeURIComponent(this.title);
  }
}
