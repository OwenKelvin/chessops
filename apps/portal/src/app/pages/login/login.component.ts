import { Component, inject, signal } from '@angular/core';
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
import { CheckboxComponent } from '@chessops/ui/checkbox';
import { injectBackendUrl } from '@chessops/core/providers';
import { NotificationService } from '../../services/notification.service';
import { AuthService, type AuthTokens } from '../../services/auth.service';
import { FormErrorComponent } from '../../components/form-error/form-error.component';

interface LoginModel {
  email: string;
  password: string;
  rememberMe: boolean;
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
    CheckboxComponent,
    FormErrorComponent,
  ],
  template: `
    <div class="min-h-screen flex bg-gradient-to-br from-surface via-background to-surface-elevated">
      <!-- Left side - Decorative chess pattern -->
      <div class="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <!-- Chess board pattern -->
          <div class="grid grid-cols-8 grid-rows-8 w-full h-full">
            @for (row of [0,1,2,3,4,5,6,7]; track row) {
              @for (col of [0,1,2,3,4,5,6,7]; track col) {
                <div
                  class="w-full h-full"
                  [class.bg-surface]="(row + col) % 2 === 0"
                  [class.bg-primary]="(row + col) % 2 === 1"
                ></div>
              }
            }
          </div>
        </div>
        <!-- Decorative logo placeholder -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <img src="logo.svg" alt="ChessOps" class="mx-auto h-32 w-auto mb-8 opacity-90" />
            <h1 class="text-5xl font-display font-bold text-surface mb-4">ChessOps</h1>
            <p class="text-xl text-surface/80 font-body">Master Your Game</p>
          </div>
        </div>
      </div>

      <!-- Right side - Login form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div class="w-full max-w-md">
          <!-- Logo for mobile -->
          <div class="lg:hidden text-center mb-8">
            <img src="logo.svg" alt="ChessOps" class="mx-auto h-16 w-auto mb-2" />
            <h1 class="text-3xl font-display font-bold text-primary">ChessOps</h1>
          </div>

          <!-- Welcome text -->
          <div class="mb-8">
            <h2 class="text-3xl font-display font-bold text-primary mb-2">Welcome back</h2>
            <p class="text-muted font-body">Sign in to continue your chess journey</p>
          </div>

          <chessops-card variant="outlined" [header]="false" class="shadow-lg">
            <form class="space-y-5" [formRoot]="loginForm">
              <chessops-input
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                [formField]="loginForm.email"
                size="lg"
              />

              <chessops-input
                id="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                [formField]="loginForm.password"
                size="lg"
              />

              <div class="flex items-center justify-between">
                <chessops-checkbox
                  id="rememberMe"
                  label="Remember me"
                  [formField]="loginForm.rememberMe"
                />
                <a
                  routerLink="/forgot-password"
                  class="text-sm font-medium text-primary hover:text-primary/80 font-body transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <chessops-form-error [message]="loginForm().errors()[0]?.message" />

              <chessops-button
                type="submit"
                variant="primary"
                size="lg"
                [disabled]="loginForm().submitting()"
                [fullWidth]="true"
              >
                @if (loginForm().submitting()) {
                  <span class="flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                } @else {
                  <span>Sign in</span>
                }
              </chessops-button>
            </form>

            <!-- Divider -->
            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-surface text-muted font-body">or continue with</span>
              </div>
            </div>

            <!-- Social login -->
            <div class="grid grid-cols-2 gap-4">
              <a
                href="http://localhost:8050/api/auth/google"
                class="inline-flex items-center justify-center gap-2 py-3 px-4 border border-border rounded-md bg-surface text-sm font-medium text-foreground hover:bg-surface-elevated hover:shadow-md transition-all duration-200"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </a>
              <a
                href="http://localhost:8050/api/auth/github"
                class="inline-flex items-center justify-center gap-2 py-3 px-4 border border-border rounded-md bg-surface text-sm font-medium text-foreground hover:bg-surface-elevated hover:shadow-md transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
                </svg>
                GitHub
              </a>
            </div>
          </chessops-card>

          <!-- Sign up link -->
          <p class="text-center mt-8 text-muted font-body">
            Don't have an account?
            <a
              routerLink="/register"
              class="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Create a new account
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private backendUrl = injectBackendUrl();
  private notification = inject(NotificationService);
  private auth = inject(AuthService);

  loginFormValue = signal<LoginModel>({ email: '', password: '', rememberMe: false });

  submitForm = async (field: FieldTree<LoginModel>) => {
    try {
      const result = await firstValueFrom(
        this.http.post<AuthTokens>(`${this.backendUrl}/api/auth/login`, {
          email: field.email().value(),
          password: field.password().value(),
          rememberMe: field.rememberMe().value(),
        }),
      );
      await this.auth.storeTokens(result);
      this.notification.success('Signed in successfully.');
      this.router.navigate(['/account']);
      return undefined as TreeValidationResult;
    } catch (err: any) {
      const message = err.error?.message || 'Login failed';
      this.notification.error(message);
      return {
        kind: 'server',
        message,
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
