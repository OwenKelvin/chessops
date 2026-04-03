import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'chessops-button',
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="buttonClass"
      (click)="clicked.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  standalone: false,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  @HostBinding('class') get class() {
    return this.buttonClass;
  }

  get buttonClass(): string {
    const base = 'chessops-button';
    return `${base} ${base}--${this.variant} ${base}--${this.size} ${this.fullWidth ? `${base}--full` : ''}`;
  }
}
