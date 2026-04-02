import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { form, required, email } from '@angular/forms';
import { NgIf } from '@angular/common';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, HttpClientModule, NgIf],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to ChessOps</h2>
          <p class="mt-2 text-center text-gray-600">
            Or
            <a routerLink="/register" class="font-medium text-indigo-600 hover:text-indigo-500">create a new account</a>
          </p>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">Email address</label>
              <input id="email" type="email" [formField]="loginForm.email" required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address">
              @if (loginForm.email.touched() && !loginForm.email.valid()) {
                <span class="text-red-500 text-xs">{{ loginForm.email.errors()[0]?.message }}</span>
              }
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input id="password" type="password" [formField]="loginForm.password" required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password">
              @if (loginForm.password.touched() && !loginForm.password.valid()) {
                <span class="text-red-500 text-xs">{{ loginForm.password.errors()[0]?.message }}</span>
              }
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm">
              <a routerLink="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500">Forgot password?</a>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="text-red-500 text-sm text-center">{{ errorMessage() }}</div>
          }

          <div>
            <button type="submit" [disabled]="loading() || !loginForm.valid()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              @if (loading()) {
                <span>Signing in...</span>
              } @else {
                <span>Sign in</span>
              }
            </button>
          </div>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <a href="http://localhost:3000/api/auth/google"
                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Google
              </a>
              <a href="http://localhost:3000/api/auth/github"
                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                GitHub
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  loginForm = form<LoginModel>(
    {
      email: '',
      password: '',
    },
    (form) => {
      required(form.email, { message: 'Email is required' });
      email(form.email, { message: 'Invalid email format' });
      required(form.password, { message: 'Password is required' });
    },
  );

  errorMessage = computed(() => this.#errorMessage);
  loading = signal(false);
  #errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.loginForm.valid()) return;

    this.loading.set(true);
    this.#errorMessage = '';

    this.http.post('http://localhost:3000/api/auth/login', {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    }).subscribe({
      next: (response: any) => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.router.navigate(['/account']);
      },
      error: (err) => {
        this.#errorMessage = err.error?.message || 'Login failed';
        this.loading.set(false);
      },
    });
  }
}
