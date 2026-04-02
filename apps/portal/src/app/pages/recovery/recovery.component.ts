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

interface ForgotPasswordModel {
  email: string;
}

@Component({
  selector: 'app-recovery-page',
  imports: [RouterLink, FormField, FormRoot],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p class="mt-2 text-center text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        @if (success()) {
          <div class="rounded-md bg-green-50 p-4">
            <p class="text-sm text-green-800">
              If an account exists with that email, we've sent a password reset
              link.
            </p>
          </div>
        } @else {
          <form class="mt-8 space-y-6" [formRoot]="forgotForm">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700"
                >Email address</label
              >
              <input
                id="email"
                type="email"
                [formField]="forgotForm.email"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
              @if (
                forgotForm.email().touched() && !forgotForm.email().valid()
              ) {
                <span class="text-red-500 text-xs">{{
                  forgotForm.email().errors()[0]?.message
                }}</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="text-red-500 text-sm text-center">
                {{ errorMessage() }}
              </div>
            }

            <div>
              <button
                type="submit"
                [disabled]="loading() || !forgotForm().valid()"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                @if (loading()) {
                  <span>Sending...</span>
                } @else {
                  <span>Send reset link</span>
                }
              </button>
            </div>
          </form>
        }

        <div class="text-center">
          <a
            routerLink="/login"
            class="font-medium text-indigo-600 hover:text-indigo-500"
            >Back to login</a
          >
        </div>
      </div>
    </div>
  `,
})
export class RecoveryPageComponent {
  private http = inject(HttpClient);
  forgotFormValue = signal<ForgotPasswordModel>({ email: '' });

  submitForm = async (field: FieldTree<ForgotPasswordModel>) => {
    try {
      const result = await firstValueFrom(
        this.http.post('http://localhost:3000/api/auth/forgot-password', {
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
