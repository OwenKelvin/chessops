import { Component, Input, Output, EventEmitter } from '@angular/core';
import { buttonVariants, type ButtonVariants } from './button.variants';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = ButtonVariants['variant'];
export type ButtonSize = ButtonVariants['size'];

export { buttonVariants };

@Component({
  selector: 'chessops-button',
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="buttonClass"
      (click)="handleClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<MouseEvent>();
  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClass(): string {
    return twMerge(
      buttonVariants({
        variant: this.variant,
        size: this.size,
        fullWidth: this.fullWidth,
      })
    );
  }

  handleClick(event: MouseEvent): void {
    this.clicked.emit(event);
    this.onClick.emit(event);
  }
}
