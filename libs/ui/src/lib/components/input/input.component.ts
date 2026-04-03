import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
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
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <span *ngIf="error" class="chessops-input__error">{{ error }}</span>
    </div>
  `,
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputComponent,
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
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

  value: any = '';

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  get inputClass(): string {
    const variant = this.error ? 'error' : 'default';
    return twMerge(inputVariants({ variant, size: this.size }));
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }
}
