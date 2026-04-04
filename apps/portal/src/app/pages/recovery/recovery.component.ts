import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  email,
  FieldTree,
  form,
  FormField,
  FormRoot,
  required,
  TreeValidationResult,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { InputComponent } from '@chessops/ui/input';
import { ButtonComponent } from '@chessops/ui/button';
import { CardComponent } from '@chessops/ui/card';
import { injectBackendUrl } from '@chessops/core/providers';

interface ForgotPasswordModel {
  email: string;
}

@Component({
  selector: 'app-recovery-page',
  imports: [
    RouterLink,
    FormField,
    FormRoot,
    InputComponent,
    ButtonComponent,
    CardComponent,
  ],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full">
        <chessops-card
          variant="default"
          [header]="true"
          title="Reset your password"
        >
          <p class="text-center text-sm text-muted mb-6">
            Enter your email and we'll send you a reset link
          </p>

          @if (success()) {
            <div class="rounded-md bg-success/10 p-4">
              <p class="text-sm text-success">
                If an account exists with that email, we've sent a password
                reset link.
              </p>
            </div>
          } @else {
            <form class="space-y-4" [formRoot]="forgotForm">
              <chessops-input
                id="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                [formField]="forgotForm.email"
              />

              @if (errorMessage()) {
                <div class="text-error text-sm text-center">
                  {{ errorMessage() }}
                </div>
              }

              <chessops-button
                type="submit"
                variant="primary"
                size="md"
                [disabled]="loading() || !forgotForm().valid()"
                [fullWidth]="true"
              >
                @if (loading()) {
                  <span>Sending...</span>
                } @else {
                  <span>Send reset link</span>
                }
              </chessops-button>
            </form>
          }

          <div class="text-center mt-4">
            <a
              routerLink="/login"
              class="font-medium text-primary hover:text-primary/80"
              >Back to login</a
            >
          </div>
        </chessops-card>
      </div>
    </div>
  `,
})
export class RecoveryPageComponent {
  private http = inject(HttpClient);
  private backendUrl = injectBackendUrl();
  forgotFormValue = signal<ForgotPasswordModel>({ email: '' });

  submitForm = async (field: FieldTree<ForgotPasswordModel>) => {
    try {
      const result = await firstValueFrom(
        this.http.post(`${this.backendUrl}/api/auth/forgot-password`, {
          email: field.email().value(),
        }),
      );
      if (result) {
        this.success.set(true);
      }
      return undefined as TreeValidationResult;
    } catch (err: any) {
      return {
        kind: 'server',
        message: err.error?.message || 'Request failed',
      } as TreeValidationResult;
    }
  };
  forgotForm = form<ForgotPasswordModel>(
    this.forgotFormValue,
    (form) => {
      required(form.email, { message: 'Email is required' });
      email(form.email, { message: 'Invalid email format' });
    },
    {
      submission: {
        action: this.submitForm,
      },
    },
  );

  errorMessage = computed(() => this.forgotForm().errors()[0].message);
  loading = computed(() => this.forgotForm().submitting());
  success = signal(false);

  constructor() {}
}
