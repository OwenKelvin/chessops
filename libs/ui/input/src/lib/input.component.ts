import {
  Component,
  input,
  model,
  computed,
  ElementRef,
  viewChild, InputSignal, InputSignalWithTransform,
} from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { inputVariants, type InputVariants } from './input.variants';
import { twMerge } from 'tailwind-merge';

export { inputVariants };

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date';
export type InputSize = InputVariants['size'];

@Component({
  selector: 'chessops-input',
  standalone: true,
  template: `
    <div class="flex flex-col gap-1.5 w-full">
      @if (label()) {
        <label [for]="id()" class="text-sm font-bold text-primary font-display">
          {{ label() }}
        </label>
      }

      <input
        #inputElement
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.minlength]="minLength()"
        [attr.maxlength]="maxLength()"
        [min]="min()"
        [max]="max()"
        [class]="inputClass()"
        [value]="value() ?? ''"
        (input)="handleInput($event)"
        (blur)="handleBlur()"
        [autocomplete]="autocomplete()"
      />

      @if (errors().length > 0 && touched()) {
        <span
          class="text-xs font-medium text-error animate-in fade-in slide-in-from-top-1"
        >
          {{ errors()[0].message }}
        </span>
      }
    </div>
  `,
})
export class InputComponent
  implements FormValueControl<string | number | null>
{
  // --- FormValueControl Implementation ---
  // The 'value' is now a model signal that handles 2-way syncing automatically
  readonly value = model<string | number | null>(null);

  // Signal Forms automatically binds these if defined as inputs/models
  readonly disabled = input<boolean>(false);
  readonly touched = model<boolean>(false);
  readonly required = input<boolean>(false);
  readonly min = input<string | number | undefined>(undefined);
  readonly max = input<string | number | undefined>(undefined);
  readonly minLength = input<number | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly autocomplete = input<string>();

  // --- UI Props ---
  readonly id = input<string>(
    `chessops-input-${Math.random().toString(36).substring(2, 9)}`,
  );
  readonly label = input<string>();
  readonly type = input<InputType>('text');
  readonly placeholder = input<string>('');
  readonly step = input<number>();
  readonly pattern = input<readonly RegExp[]>([]);
  readonly size = input<InputSize>('md');
  readonly errors = model<readonly ValidationError.WithOptionalFieldTree[]>([]);

  // --- View Handling ---
  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement>>('inputElement');

  readonly inputClass = computed(() => {
    return twMerge(
      inputVariants({
        variant: this.errors().length > 0 ? 'error' : 'default',
        size: this.size(),
      }),
    );
  });

  handleInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.value.set(el.value);
  }

  handleBlur(): void {
    this.touched.set(true);
  }

  // Implementation of FormValueControl focus method
  focus(options?: FocusOptions): void {
    this.inputRef()?.nativeElement.focus(options);
  }
}
