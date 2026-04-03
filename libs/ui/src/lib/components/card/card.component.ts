import { Component, Input, HostBinding } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined';

@Component({
  selector: 'chessops-card',
  template: `
    <div [class]="cardClass">
      <div *ngIf="header" class="chessops-card__header">
        <h3 *ngIf="title" class="chessops-card__title">{{ title }}</h3>
        <ng-content select="[card-header]"></ng-content>
      </div>
      <div class="chessops-card__content">
        <ng-content></ng-content>
      </div>
      <div *ngIf="footer" class="chessops-card__footer">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `,
  standalone: false,
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() title?: string;
  @Input() header = false;
  @Input() footer = false;
  @Input() padding = true;

  @HostBinding('class') get class() {
    return `chessops-card chessops-card--${this.variant} ${this.padding ? 'chessops-card--padded' : ''}`;
  }

  get cardClass(): string {
    return `chessops-card__inner`;
  }
}
