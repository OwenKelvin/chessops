import { Component, Input } from '@angular/core';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'live';

@Component({
  selector: 'chessops-badge',
  standalone: true,
  template: `<span [class]="badgeClass"><ng-content></ng-content></span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .badge-default {
      background: var(--color-muted);
      color: var(--color-muted-foreground);
    }

    .badge-success {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .badge-warning {
      background: var(--color-warning-light);
      color: var(--color-warning);
    }

    .badge-error {
      background: var(--color-error-light);
      color: var(--color-error);
    }

    .badge-info {
      background: var(--color-info-light);
      color: var(--color-info);
    }

      .badge-live {
        background: var(--color-error-light);
        color: var(--color-error);
        animation: pulse 2s infinite;
      }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .badge-default {
      background: var(--color-info-light);
      color: var(--color-info);
    }
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';

  get badgeClass(): string {
    return twMerge('badge', `badge-${this.variant}`, `badge-${this.size}`);
  }
}
