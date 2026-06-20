import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  computed,
} from '@angular/core';
import {
  FormValueControl,
  ValidationError,
  WithOptionalFieldTree,
  DisabledReason,
} from '@angular/forms/signals';
import { twMerge } from 'tailwind-merge';

export type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

@Component({
  selector: 'chessops-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="wrapperClass()">
      @if (label()) {
        <label
          [for]="selectId()"
          class="text-sm font-medium text-foreground font-body"
        >
          {{ label() }}
        </label>
      }
      <div
        class="relative rounded-lg border transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:border-primary bg-surface/60 backdrop-blur-sm hover:border-primary/50"
        [class.border-error]="invalid()"
      >
        <select
          [id]="selectId()"
          [disabled]="disabled()"
          [value]="value()"
          (change)="value.set($any($event.target).value)"
          (blur)="touched.set(true)"
          class="w-full py-2 pl-3 pr-8 text-sm font-body text-foreground bg-transparent
                 border-none rounded-md cursor-pointer appearance-none focus:outline-none
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (placeholder()) {
            <option value="">{{ placeholder() }}</option>
          }
          @for (option of options(); track option.value) {
            <option
              [value]="option.value"
              [disabled]="option.disabled ?? false"
            >
              {{ option.label }}
            </option>
          }
        </select>
        <div
          class="pointer-events-none absolute inset-y-0 right-2 flex items-center"
        >
          <svg
            class="w-4 h-4 text-border"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <polyline
              points="6 9 12 15 18 9"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
      @if (invalid()) {
        @for (error of errors(); track error) {
          <span class="text-xs text-error font-body">{{ error.message }}</span>
        }
      }
    </div>
  `,
})
export class SelectComponent implements FormValueControl<string> {
  // Required by FormValueControl — the form system binds to this
  value = model<string>('');

  // Writable interaction state — control updates this on blur
  touched = model<boolean>(false);

  // Read-only state — FormField directive writes these
  disabled = input<boolean>(false);
  disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly = input<boolean>(false);
  hidden = input<boolean>(false);
  invalid = input<boolean>(false);
  errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);

  // Component-specific inputs
  options = input<SelectOption[]>([]);
  label = input('');
  placeholder = input('');
  selectId = input('');
  fullWidth = input(false);

  wrapperClass = computed(() =>
    twMerge('flex flex-col gap-1.5', this.fullWidth() ? 'w-full' : 'w-auto'),
  );
}
