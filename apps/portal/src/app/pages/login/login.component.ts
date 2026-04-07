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
import { InputComponent } from '@chessops/ui/input';
import { ButtonComponent } from '@chessops/ui/button';
import { CardComponent } from '@chessops/ui/card';
import { injectBackendUrl } from '@chessops/core/providers';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-page',
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
          title="Sign in to ChessOps"
        >
          <p class="text-center text-sm text-muted mb-6">
            Or
            <a
              routerLink="/register"
              class="font-medium text-primary hover:text-primary/80"
              >create a new account</a
            >
          </p>

          <form class="space-y-4" [formRoot]="loginForm">
            <chessops-input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              [formField]="loginForm.email"
            />

            <chessops-input
              id="password"
              type="password"
              label="Password"
              placeholder="Your password"
              [formField]="loginForm.password"
            />

            <div class="flex items-center justify-between">
              <div class="text-sm">
                <a
                  routerLink="/forgot-password"
                  class="font-medium text-primary hover:text-primary/80"
                  >Forgot password?</a
                >
              </div>
            </div>

            @if (loginForm().errors().length > 0) {
              <div class="text-error text-sm text-center">
                {{ loginForm().errors()[0]?.message }}
              </div>
            }

            <chessops-button
              type="submit"
              variant="primary"
              size="md"
              [disabled]="loginForm().submitting()"
              [fullWidth]="true"
            >
              @if (loginForm().submitting()) {
                <span>Signing in...</span>
              } @else {
                <span>Sign in</span>
              }
            </chessops-button>
          </form>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-surface text-muted">Or continue with</span>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <a
                href="http://localhost:8050/api/auth/google"
                class="inline-flex justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-surface text-sm font-medium text-foreground hover:bg-surface-elevated"
              >
                Google
              </a>
              <a
                href="http://localhost:8050/api/auth/github"
                class="inline-flex justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-surface text-sm font-medium text-foreground hover:bg-surface-elevated"
              >
                GitHub
              </a>
            </div>
          </div>
        </chessops-card>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private backendUrl = injectBackendUrl()

  loginFormValue = signal<LoginModel>({ email: '', password: '' });

  submitForm = async (field: FieldTree<LoginModel>) => {
    try {
      const result = await firstValueFrom(
        this.http.post(`${this.backendUrl}/api/auth/login`, {
          email: field.email().value(),
          password: field.password().value(),
        }),
      );
      if (result) {
        // Cookies are set by the server, just navigate to account page
        this.router.navigate(['/account']);
      }
      return undefined as TreeValidationResult;
    } catch (err: any) {
      return {
        kind: 'server',
        message: err.error?.message || 'Login failed',
      } as TreeValidationResult;
    }
  };

  loginForm = form<LoginModel>(
    this.loginFormValue,
    (form) => {
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
