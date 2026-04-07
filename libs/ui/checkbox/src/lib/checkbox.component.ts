import {
  Component,
  computed,
  ElementRef,
  input,
  InputSignal,
  model,
  viewChild,
} from '@angular/core';
import { FormCheckboxControl, ValidationError } from '@angular/forms/signals';
import { checkboxVariants, type CheckboxVariants } from './checkbox.variants';
import { twMerge } from 'tailwind-merge';

export { checkboxVariants };

export type CheckboxSize = CheckboxVariants['size'];

@Component({
  selector: 'chessops-checkbox',
  standalone: true,
  template: `
    <div class="flex items-center gap-2">
      <input
        #checkboxElement
        [id]="id()"
        type="checkbox"
        [disabled]="disabled()"
        [required]="required()"
        [checked]="checked()"
        (change)="handleChange($event)"
        (blur)="handleBlur()"
        class="sr-only"
      />
      <div
        [class]="checkboxVisualClass()"
        [attr.aria-checked]="checked()"
        role="checkbox"
        [attr.tabindex]="disabled() ? -1 : 0"
        (click)="toggleChecked()"
        (keydown.enter)="toggleChecked()"
        (keydown.space)="toggleChecked()"
      >
        @if (checked()) {
          <svg class="w-full h-full text-white" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        }
      </div>
      @if (label()) {
        <label [for]="id()" [class]="labelClass()">
          {{ label() }}
        </label>
      }
      <ng-content></ng-content>
    </div>

    @if (errors().length > 0) {
      <span
        class="text-xs font-medium text-error animate-in fade-in slide-in-from-top-1"
      >
        {{ errors()[0].message }}
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
})
export class CheckboxComponent implements FormCheckboxControl {
  // --- FormCheckboxControl Implementation ---
  readonly disabled: InputSignal<boolean> = input<boolean>(false);
  readonly touched = model<boolean>(false);
  readonly required: InputSignal<boolean> = input<boolean>(false);
  readonly errors = model<readonly ValidationError.WithOptionalFieldTree[]>([]);

  // Alias for checked to match HTML checkbox semantics
  readonly checked = model<boolean>(false);

  // --- UI Props ---
  readonly id = input<string>(
    `chessops-checkbox-${Math.random().toString(36).substring(2, 9)}`,
  );
  readonly label = input<string>();
  readonly size = input<CheckboxSize>('md');
  readonly variant = input<CheckboxVariants['variant']>('default');

  // --- View Handling ---
  private readonly checkboxRef =
    viewChild<ElementRef<HTMLInputElement>>('checkboxElement');

  readonly checkboxClass = computed(() => {
    return twMerge(
      checkboxVariants({
        variant: this.errors().length > 0 ? 'error' : this.variant(),
        size: this.size(),
      }),
    );
  });

  readonly checkboxVisualClass = computed(() => {
    return twMerge(
      checkboxVariants({
        variant: this.errors().length > 0 ? 'error' : this.variant(),
        checked: this.checked(),
        size: this.size(),
      }),
    );
  });

  readonly labelClass = computed(() => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    };
    const size = this.size();
    return `font-body text-muted hover:text-primary transition-colors cursor-pointer ${sizeClasses[size ?? 'lg']}`;
  });

  handleChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.checked.set(el.checked);
  }

  handleBlur(): void {
    this.touched.set(true);
  }

  toggleChecked(): void {
    if (!this.disabled()) {
      this.checked.set(!this.checked());
      this.handleChange({ target: { checked: this.checked() } } as unknown as Event);
    }
  }

  focus(options?: FocusOptions): void {
    this.checkboxRef()?.nativeElement.focus(options);
  }
}
