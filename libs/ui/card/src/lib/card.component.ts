import { Component, input, Input } from '@angular/core';
import { cardVariants, type CardVariants } from './card.variants';
import { twMerge } from 'tailwind-merge';

export { cardVariants, type CardVariants };

@Component({
  selector: 'chessops-card',
  template: `
    <div [class]="cardClass">
      @if (header()) {
        <div class="">
          @if (title()) {
            <h3 class="">{{ title() }}</h3>
          }
          <ng-content select="[card-header]"></ng-content>
        </div>
      }

      <div class="">
        <ng-content></ng-content>
      </div>
      @if (footer()) {
        <div class="">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
})
export class CardComponent {
  variant = input<CardVariants['variant']>('default');
  title = input<string>();
  header = input(false);
  footer = input(false);
  padding = input(true);

  get cardClass(): string {
    return twMerge(
      cardVariants({ variant: this.variant(), padding: this.padding() }),
    );
  }
}
