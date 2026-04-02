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

interface MfaVerifyModel {
  token: string;
}

@Component({
  selector: 'app-mfa-setup-page',
  imports: [FormField, FormRoot],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up Two-Factor Authentication
          </h2>
        </div>

        @if (step() === 'setup') {
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-4">
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
            <p class="text-xs text-gray-500 mt-4">Secret: {{ secret() }}</p>
          </div>

          <form class="mt-8 space-y-6" [formRoot]="verifyForm">
            <div>
              <label
                for="token"
                class="block text-sm font-medium text-gray-700"
                >Enter the 6-digit code from your app</label
              >
              <input
                id="token"
                type="text"
                inputmode="numeric"
                [formField]="verifyForm.token"
                class="mt-1 text-center text-2xl tracking-widest appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="000000"
              />
              @if (verifyForm.token().touched() && !verifyForm.token().valid()) {
                <span class="text-red-500 text-xs">{{
                  verifyForm.token().errors()[0]?.message
                }}</span>
              }
            </div>

            @if (verifyForm().errors().length > 0) {
              <div class="text-red-500 text-sm text-center">
                {{ verifyForm().errors()[0]?.message }}
              </div>
            }

            <div>
              <button
                type="submit"
                [disabled]="verifyForm().submitting()"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                @if (verifyForm().submitting()) {
                  <span>Verifying...</span>
                } @else {
                  <span>Verify and enable MFA</span>
                }
              </button>
            </div>
          </form>
        } @else if (step() === 'backup') {
          <div class="rounded-md bg-yellow-50 p-4">
            <h4 class="text-sm font-medium text-yellow-800 mb-2">
              Save your backup codes
            </h4>
            <p class="text-xs text-yellow-700 mb-2">
              Store these codes in a safe place. Each code can only be used once.
            </p>
            <div class="grid grid-cols-2 gap-2 mt-2">
              @for (code of backupCodes(); track code) {
                <code class="text-xs bg-white px-2 py-1 rounded">{{ code }}</code>
              }
            </div>
          </div>
          <button
            (click)="finish()"
            class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            I've saved my backup codes
          </button>
        }

        @if (step() === 'enabled') {
          <div class="text-center">
            <div
              class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100"
            >
              <svg
                class="h-6 w-6 text-green-600"
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
            <h3 class="mt-2 text-lg font-medium text-gray-900">
              MFA enabled successfully
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class MfaSetupPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  verifyFormValue = signal<MfaVerifyModel>({ token: '' });

  submitForm = async (field: FieldTree<MfaVerifyModel>) => {
    try {
      const token = localStorage.getItem('accessToken');
      const result = await firstValueFrom(
        this.http.post(
          'http://localhost:3000/api/mfa/enable',
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
      .get('http://localhost:3000/api/mfa/setup', {
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
