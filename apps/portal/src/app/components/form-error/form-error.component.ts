import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'chessops-form-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message()) {
      <div class="form-error" role="alert">
        <span class="form-error__icon" aria-hidden="true">⚠</span>
        <span class="form-error__message">{{ message() }}</span>
      </div>
    }
  `,
  styles: `
    .form-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: var(--color-error-light);
      border: 1px solid color-mix(in srgb, var(--color-error), transparent 70%);
      color: var(--color-error);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .form-error__icon {
      font-size: 1rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .form-error__message {
      flex: 1;
      line-height: 1.4;
    }
  `,
})
export class FormErrorComponent {
  message = input<string | undefined | null>();
}
