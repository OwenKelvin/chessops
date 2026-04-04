import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
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

interface MfaVerifyModel {
  token: string;
}

@Component({
  selector: 'app-mfa-setup-page',
  imports: [
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
          title="Set up Two-Factor Authentication"
        >
          @if (step() === 'setup') {
            <div class="text-center">
              <p class="text-sm text-muted mb-4">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.)
              </p>
              @if (qrCodeUrl()) {
                <img
                  [src]="qrCodeUrl()"
                  alt="QR Code"
                  class="mx-auto w-48 h-48"
                />
              }
              <p class="text-xs text-muted mt-4">Secret: {{ secret() }}</p>
            </div>

            <form class="space-y-4" [formRoot]="verifyForm">
              <chessops-input
                id="token"
                type="text"
                label="Enter the 6-digit code from your app"
                placeholder="000000"
                [formField]="verifyForm.token"
              />

              @if (verifyForm().errors().length > 0) {
                <div class="text-error text-sm text-center">
                  {{ verifyForm().errors()[0]?.message }}
                </div>
              }

              <chessops-button
                type="submit"
                variant="primary"
                size="md"
                [disabled]="verifyForm().submitting()"
                [fullWidth]="true"
              >
                @if (verifyForm().submitting()) {
                  <span>Verifying...</span>
                } @else {
                  <span>Verify and enable MFA</span>
                }
              </chessops-button>
            </form>
          } @else if (step() === 'backup') {
            <div class="rounded-md bg-warning/10 p-4">
              <h4 class="text-sm font-medium text-warning mb-2">
                Save your backup codes
              </h4>
              <p class="text-xs text-warning/80 mb-2">
                Store these codes in a safe place. Each code can only be used
                once.
              </p>
              <div class="grid grid-cols-2 gap-2 mt-2">
                @for (code of backupCodes(); track code) {
                  <code class="text-xs bg-surface px-2 py-1 rounded">{{
                    code
                  }}</code>
                }
              </div>
            </div>
            <chessops-button
              (onClick)="finish()"
              variant="primary"
              size="md"
              [fullWidth]="true"
            >
              I've saved my backup codes
            </chessops-button>
          }

          @if (step() === 'enabled') {
            <div class="text-center">
              <div
                class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/10"
              >
                <svg
                  class="h-6 w-6 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 class="mt-2 text-lg font-medium text-foreground">
                MFA enabled successfully
              </h3>
              <p class="mt-1 text-sm text-muted">
                Your account is now protected with two-factor authentication.
              </p>
            </div>
          }
        </chessops-card>
      </div>
    </div>
  `,
})
export class MfaSetupPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private backendUrl = injectBackendUrl();

  verifyFormValue = signal<MfaVerifyModel>({ token: '' });

  submitForm = async (field: FieldTree<MfaVerifyModel>) => {
    try {
      const token = localStorage.getItem('accessToken');
      const result = await firstValueFrom(
        this.http.post(
          `${this.backendUrl}/api/mfa/enable`,
          {
            token: field.token().value(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );
      if (result) {
        this.backupCodes.set((result as any).backupCodes);
        this.step.set('backup');
      }
      return undefined as TreeValidationResult;
    } catch (err: any) {
      return {
        kind: 'server',
        message: err.error?.message || 'Invalid code',
      } as TreeValidationResult;
    }
  };

  verifyForm = form<MfaVerifyModel>(
    this.verifyFormValue,
    (form) => {
      required(form.token, { message: 'Verification code is required' });
    },
    {
      submission: {
        action: this.submitForm,
      },
    },
  );

  step = signal<'setup' | 'backup' | 'enabled'>('setup');
  qrCodeUrl = signal('');
  secret = signal('');
  backupCodes = signal<string[]>([]);

  constructor() {}

  ngOnInit() {
    this.loadMfaSetup();
  }

  loadMfaSetup() {
    const token = localStorage.getItem('accessToken');
    this.http
      .get(`${this.backendUrl}/api/mfa/setup`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response: any) => {
          this.qrCodeUrl.set(response.qrCodeUrl);
          this.secret.set(response.secret);
        },
        error: () => {
          alert('Failed to load MFA setup');
        },
      });
  }

  finish() {
    this.step.set('enabled');
    setTimeout(() => this.router.navigate(['/account']), 2000);
  }
}
