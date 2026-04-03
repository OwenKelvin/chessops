import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms/signals';
import { inputVariants, type InputVariants } from './input.variants';
import { twMerge } from 'tailwind-merge';

export { inputVariants };

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';
export type InputSize = InputVariants['size'];

@Component({
  selector: 'chessops-input',
  template: `
    <div class="chessops-input-wrapper">
      <label *ngIf="label" [for]="id" class="chessops-input__label">{{ label }}</label>
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [attr.minlength]="minlength"
        [attr.maxlength]="maxlength"
        [min]="min"
        [max]="max"
        [step]="step"
        [pattern]="pattern"
        [class]="inputClass"
        [formControl]="formControl"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      <span *ngIf="error" class="chessops-input__error">{{ error }}</span>
    </div>
  `,
  standalone: false,
})
export class InputComponent {
  @Input() id = `chessops-input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label?: string;
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() minlength?: number;
  @Input() maxlength?: number;
  @Input() min?: number | string;
  @Input() max?: number | string;
  @Input() step?: number;
  @Input() pattern?: string;
  @Input() error?: string;
  @Input() size: InputSize = 'md';
  @Input() formControl!: FormControl<string | null>;

  get inputClass(): string {
    const variant = this.error ? 'error' : 'default';
    return twMerge(inputVariants({ variant, size: this.size }));
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.formControl.set(value);
  }

  onBlur(): void {
    this.formControl.markAsTouched();
  }
}
