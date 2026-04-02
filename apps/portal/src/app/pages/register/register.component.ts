import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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

interface RegisterModel {
  email: string;
  password: string;
  displayName: string;
}

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, FormField, FormRoot],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-gray-600">
            Or
            <a
              routerLink="/login"
              class="font-medium text-indigo-600 hover:text-indigo-500"
              >sign in to existing account</a
            >
          </p>
        </div>
        <form class="mt-8 space-y-6" [formRoot]="registerForm">
          <div class="space-y-4">
            <div>
              <label
                for="displayName"
                class="block text-sm font-medium text-gray-700"
                >Display Name</label
              >
              <input
                id="displayName"
                type="text"
                [formField]="registerForm.displayName"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Your name"
              />
              @if (
                registerForm.displayName().touched() &&
                !registerForm.displayName().valid()
              ) {
                <span class="text-red-500 text-xs">{{
                  registerForm.displayName().errors()[0]?.message
                }}</span>
              }
            </div>
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700"
                >Email address</label
              >
              <input
                id="email"
                type="email"
                [formField]="registerForm.email"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
              @if (
                registerForm.email().touched() && !registerForm.email().valid()
              ) {
                <span class="text-red-500 text-xs">{{
                  registerForm.email().errors()[0]?.message
                }}</span>
              }
            </div>
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700"
                >Password</label
              >
              <input
                id="password"
                type="password"
                [formField]="registerForm.password"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Minimum 8 characters"
              />
              @if (
                registerForm.password().touched() &&
                !registerForm.password().valid()
              ) {
                <span class="text-red-500 text-xs">{{
                  registerForm.password().errors()[0]?.message
                }}</span>
              }
            </div>
          </div>

          @if (registerForm().errors().length > 0) {
            <div class="text-red-500 text-sm text-center">
              {{ registerForm().errors()[0]?.message }}
            </div>
          }

          <div>
            <button
              type="submit"
              [disabled]="registerForm().submitting()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              @if (registerForm().submitting()) {
                <span>Creating account...</span>
              } @else {
                <span>Create account</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RegisterPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  registerFormValue = signal<RegisterModel>({
    email: '',
    password: '',
    displayName: '',
  });

  submitForm = async (field: FieldTree<RegisterModel>) => {
    try {
      const result = await firstValueFrom(
        this.http.post('http://localhost:3000/api/auth/register', {
          email: field.email().value(),
          password: field.password().value(),
          displayName: field.displayName().value(),
        }),
      );
      if (result) {
        localStorage.setItem('accessToken', (result as any).accessToken);
        localStorage.setItem('refreshToken', (result as any).refreshToken);
        this.router.navigate(['/account']);
      }
      return undefined as TreeValidationResult;
    } catch (err: any) {
      return {
        kind: 'server',
        message: err.error?.message || 'Registration failed',
      } as TreeValidationResult;
    }
  };

  registerForm = form<RegisterModel>(
    this.registerFormValue,
    (form) => {
      required(form.displayName, { message: 'Name is required' });
      required(form.email, { message: 'Email is required' });
      required(form.password, { message: 'Password is required' });
    },
    {
      submission: {
        action: this.submitForm,
      },
    },
  );
}
