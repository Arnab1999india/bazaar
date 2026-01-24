import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-card" (click)="cardClick.emit()">
      <div class="icon-wrapper">
        <img [src]="icon" [alt]="title" />
      </div>
      <div class="content">
        <h3>{{ title }}</h3>
        <p>{{ subtitle }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-card {
        border: 1px solid #d5d9d9;
        border-radius: 8px;
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 16px;
        cursor: pointer;
        background: #fff;
        transition: background-color 0.2s, border-color 0.2s;
      }

      .profile-card:hover {
        background-color: #f7fafa;
        border-color: #d5d9d9;
      }

      .icon-wrapper {
        width: 50px;
        height: 50px;
        flex-shrink: 0;
      }

      .icon-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .content h3 {
        font-size: 17px;
        font-weight: 500;
        margin: 0 0 4px 0;
        color: #0f1111;
      }

      .content p {
        font-size: 13px;
        color: #565959;
        margin: 0;
        line-height: 1.4;
      }
    `,
  ],
})
export class ProfileCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Output() cardClick = new EventEmitter<void>();
}
