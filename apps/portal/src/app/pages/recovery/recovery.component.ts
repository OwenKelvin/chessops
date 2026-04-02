import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { form, required, email } from '@angular/forms';

interface ForgotPasswordModel {
  email: string;
}

@Component({
  selector: 'app-recovery-page',
  imports: [RouterLink, HttpClientModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
          <p class="mt-2 text-center text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        @if (success()) {
          <div class="rounded-md bg-green-50 p-4">
            <p class="text-sm text-green-800">
              If an account exists with that email, we've sent a password reset link.
            </p>
          </div>
        } @else {
          <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" type="email" [formField]="forgotForm.email" required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com">
              @if (forgotForm.email.touched() && !forgotForm.email.valid()) {
                <span class="text-red-500 text-xs">{{ forgotForm.email.errors()[0]?.message }}</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="text-red-500 text-sm text-center">{{ errorMessage() }}</div>
            }

            <div>
              <button type="submit" [disabled]="loading() || !forgotForm.valid()"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
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
          <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">Back to login</a>
        </div>
      </div>
    </div>
  `,
})
export class RecoveryPageComponent {
  forgotForm = form<ForgotPasswordModel>(
    { email: '' },
    (form) => {
      required(form.email, { message: 'Email is required' });
      email(form.email, { message: 'Invalid email format' });
    },
  );

  errorMessage = signal('');
  loading = signal(false);
  success = signal(false);

  constructor(private http: HttpClient) {}

  onSubmit() {
    if (!this.forgotForm.valid()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.http.post('http://localhost:3000/api/auth/forgot-password', {
      email: this.forgotForm.value.email,
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Request failed');
        this.loading.set(false);
      },
    });
  }
}
