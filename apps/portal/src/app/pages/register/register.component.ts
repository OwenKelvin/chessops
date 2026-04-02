import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { form, required, email, minLength } from '@angular/forms';

interface RegisterModel {
  email: string;
  password: string;
  displayName: string;
}

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, HttpClientModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p class="mt-2 text-center text-gray-600">
            Or
            <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">sign in to existing account</a>
          </p>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700">Display Name</label>
              <input id="displayName" type="text" [formField]="registerForm.displayName" required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Your name">
              @if (registerForm.displayName.touched() && !registerForm.displayName.valid()) {
                <span class="text-red-500 text-xs">{{ registerForm.displayName.errors()[0]?.message }}</span>
              }
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" type="email" [formField]="registerForm.email" required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com">
              @if (registerForm.email.touched() && !registerForm.email.valid()) {
                <span class="text-red-500 text-xs">{{ registerForm.email.errors()[0]?.message }}</span>
              }
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" type="password" [formField]="registerForm.password" required minlength="8"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Minimum 8 characters">
              @if (registerForm.password.touched() && !registerForm.password.valid()) {
                <span class="text-red-500 text-xs">{{ registerForm.password.errors()[0]?.message }}</span>
              }
            </div>
          </div>

          @if (errorMessage()) {
            <div class="text-red-500 text-sm text-center">{{ errorMessage() }}</div>
          }

          <div>
            <button type="submit" [disabled]="loading() || !registerForm.valid()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              @if (loading()) {
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
  registerForm = form<RegisterModel>(
    {
      email: '',
      password: '',
      displayName: '',
    },
    (form) => {
      required(form.displayName, { message: 'Name is required' });
      required(form.email, { message: 'Email is required' });
      email(form.email, { message: 'Invalid email format' });
      required(form.password, { message: 'Password is required' });
      minLength(form.password, 8, { message: 'Password must be at least 8 characters' });
    },
  );

  errorMessage = signal('');
  loading = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.registerForm.valid()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const value = this.registerForm.value;
    this.http.post('http://localhost:3000/api/auth/register', {
      email: value.email,
      password: value.password,
      displayName: value.displayName,
    }).subscribe({
      next: (response: any) => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.router.navigate(['/account']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
