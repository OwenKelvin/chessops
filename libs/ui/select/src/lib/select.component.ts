import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { twMerge } from 'tailwind-merge';

export type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

@Component({
  selector: 'chessops-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="select-wrapper" [class]="wrapperClass">
      @if (label) {
        <label class="select-label" [for]="selectId">{{ label }}</label>
      }
      <div class="select-container" [class.focused]="focused" [class.error]="error">
        <select
          [id]="selectId"
          [value]="value"
          [disabled]="disabled"
          (change)="onChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          class="select-input"
        >
          @if (placeholder) {
            <option value="" disabled selected>{{ placeholder }}</option>
          }
          @for (option of options; track option.value) {
            <option [value]="option.value" [disabled]="option.disabled">
              {{ option.label }}
            </option>
          }
        </select>
      </div>
      @if (error) {
        <span class="select-error">{{ error }}</span>
      }
    </div>
  `,
  styles: `
    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      width: 100%;
    }

    .select-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
    }

    .select-container {
      position: relative;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      background: var(--color-surface);
      transition: all 0.15s ease;
    }

    .select-container.focused {
      border-color: var(--color-ring);
      box-shadow: 0 0 0 2px var(--color-ring-light, transparent);
    }

    .select-container.error {
      border-color: var(--color-error);
    }

    .select-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--color-foreground);
      background: transparent;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      padding-right: 2.5rem;
    }

    .select-input:focus {
      outline: none;
    }

    .select-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .select-error {
      font-size: 0.75rem;
      color: var(--color-error);
    }

    /* Dark mode adjustments */
    @media (prefers-color-scheme: dark) {
      .select-container {
        background: #2a2a2a;
      }
    }
  `,
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() label = '';
  @Input() placeholder = 'Select...';
  @Input() error = '';
  @Input() disabled = false;
  @Input() selectId = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth = false;

  value: string | number = '';
  focused = false;

  onChange: (event: Event) => void = () => {};
  onTouched: () => void = () => {};

  get wrapperClass(): string {
    return twMerge('select-wrapper', this.fullWidth ? 'w-full' : '');
  }

  writeValue(value: string | number): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      const value = target.value;
      fn(value);
    };
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlur(): void {
    this.focused = false;
    this.onTouched();
  }
}
