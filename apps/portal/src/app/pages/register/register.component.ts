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

interface RegisterModel {
  email: string;
  password: string;
  displayName: string;
}

@Component({
  selector: 'app-register-page',
  imports: [
    RouterLink,
    FormField,
    FormRoot,
    InputComponent,
    ButtonComponent,
    CardComponent,
  ],
  template: `
    <div class="min-h-screen flex bg-gradient-to-br from-surface via-background to-surface-elevated">
      <!-- Left side - Decorative chess pattern -->
      <div class="hidden lg:flex lg:w-1/2 relative bg-secondary overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <!-- Chess board pattern -->
          <div class="grid grid-cols-8 grid-rows-8 w-full h-full">
            @for (row of [0,1,2,3,4,5,6,7]; track row) {
              @for (col of [0,1,2,3,4,5,6,7]; track col) {
                <div
                  class="w-full h-full"
                  [class.bg-surface]="(row + col) % 2 === 0"
                  [class.bg-secondary]="(row + col) % 2 === 1"
                ></div>
              }
            }
          </div>
        </div>
        <!-- Decorative queen icon placeholder -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-9xl mb-8">♛</div>
            <h1 class="text-5xl font-display font-bold text-surface mb-4">ChessOps</h1>
            <p class="text-xl text-surface/80 font-body">Join the Community</p>
          </div>
        </div>
      </div>

      <!-- Right side - Register form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div class="w-full max-w-md">
          <!-- Logo for mobile -->
          <div class="lg:hidden text-center mb-8">
            <div class="text-6xl mb-2">♔</div>
            <h1 class="text-3xl font-display font-bold text-primary">ChessOps</h1>
          </div>

          <!-- Welcome text -->
          <div class="mb-8">
            <h2 class="text-3xl font-display font-bold text-primary mb-2">Create your account</h2>
            <p class="text-muted font-body">Start your chess journey with us today</p>
          </div>

          <chessops-card variant="outlined" [header]="false" class="shadow-lg">
            <form [formRoot]="registerForm">
              <div class="flex flex-col gap-5">
                <chessops-input
                  id="displayName"
                  type="text"
                  label="Display Name"
                  placeholder="Choose a display name"
                  [formField]="registerForm.displayName"
                  size="lg"
                />

                <chessops-input
                  id="email"
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  [formField]="registerForm.email"
                  size="lg"
                />

                <chessops-input
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="Minimum 8 characters"
                  [formField]="registerForm.password"
                  size="lg"
                  autocomplete="new-password"
                />

                <!-- Password requirements -->
                <div class="bg-surface-elevated rounded-md p-3 border border-border">
                  <p class="text-xs font-medium text-muted mb-2">Password must contain:</p>
                  <ul class="text-xs text-muted space-y-1">
                    <li class="flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      At least 8 characters
                    </li>
                  </ul>
                </div>

                @if (registerForm().errors().length > 0) {
                  <div class="bg-error-light border border-error/20 rounded-md p-3 text-center">
                    <span class="text-error text-sm font-medium">{{ registerForm().errors()[0]?.message }}</span>
                  </div>
                }

                <chessops-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [disabled]="registerForm().submitting() || registerForm().invalid()"
                  [fullWidth]="true"
                >
                  @if (registerForm().submitting()) {
                    <span class="flex items-center gap-2">
                      <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating account...
                    </span>
                  } @else {
                    <span>Create account</span>
                  }
                </chessops-button>
              </div>
            </form>
          </chessops-card>

          <!-- Sign in link -->
          <p class="text-center mt-8 text-muted font-body">
            Already have an account?
            <a
              routerLink="/login"
              class="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in to existing account
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  backendUrl = injectBackendUrl()

  registerFormValue = signal<RegisterModel>({
    email: '',
    password: '',
    displayName: '',
  });

  submitForm = async (field: FieldTree<RegisterModel>) => {
    try {
      const result = await firstValueFrom(
        this.http.post(`api/auth/register`, {
          email: field.email().value(),
          password: field.password().value(),
          displayName: field.displayName().value(),
        }),
      );
      if (result) {
        // Cookies are set by the server, just navigate to account page
        this.router.navigate(['/account']);
      }
      return undefined as TreeValidationResult;
    } catch (err: any) {
      if (/email/.test(err.error?.message?.toLowerCase())) {
        return {
          fieldTree: field.email,
          kind: 'server',
          message: err.error?.message || 'Registration failed',
        } as TreeValidationResult;
      }

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
