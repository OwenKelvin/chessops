import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, type ToastType } from '../../services/notification.service';

@Component({
  selector: 'chessops-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast--success]="toast.type === 'success'"
          [class.toast--error]="toast.type === 'error'"
          [class.toast--info]="toast.type === 'info'"
          role="alert"
        >
          <span class="toast__icon" aria-hidden="true">{{ iconFor(toast.type) }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            type="button"
            class="toast__close"
            (click)="notificationService.dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 280px;
      max-width: 420px;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-foreground);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      animation: toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(120%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .toast--success {
      border-left: 4px solid var(--color-success);
    }

    .toast--error {
      border-left: 4px solid var(--color-error);
    }

    .toast--info {
      border-left: 4px solid var(--color-info);
    }

    .toast__icon {
      font-size: 1.1rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .toast__message {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 500;
      line-height: 1.4;
    }

    .toast__close {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--color-muted);
      font-size: 1.25rem;
      cursor: pointer;
      border-radius: 0.375rem;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .toast__close:hover {
      color: var(--color-foreground);
      background: var(--color-ghost-hover);
    }
  `,
})
export class ToastContainerComponent {
  notificationService = inject(NotificationService);

  iconFor(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '!';
      case 'info':
      default:
        return 'ℹ';
    }
  }
}
