import { Component, Input } from '@angular/core';
import { cardVariants, type CardVariants } from './card.variants';
import { twMerge } from 'tailwind-merge';

export { cardVariants, type CardVariants };

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
  @Input() variant: CardVariants['variant'] = 'default';
  @Input() title?: string;
  @Input() header = false;
  @Input() footer = false;
  @Input() padding = true;

  get cardClass(): string {
    return twMerge(cardVariants({ variant: this.variant, padding: this.padding }));
  }
}
