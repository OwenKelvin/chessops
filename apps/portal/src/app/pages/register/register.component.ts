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
    <div
      class="min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full">
        <chessops-card variant="default" [header]="true" title="">
          <p class="text-center">Create your account</p>
          <p class="text-center text-sm text-muted mb-6">
            Or
            <a
              routerLink="/login"
              class="font-medium text-primary hover:text-primary/80"
              >sign in to existing account</a
            >
          </p>

          <form [formRoot]="registerForm">
            <div class="flex gap-4 flex-col">
              <chessops-input
                id="displayName"
                type="text"
                label="Display Name"
                placeholder="Your name"
                [formField]="registerForm.displayName"
              />

              <chessops-input
                id="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                [formField]="registerForm.email"
              />

              <chessops-input
                id="password"
                type="password"
                label="Password"
                placeholder="Minimum 8 characters"
                [formField]="registerForm.password"
              />

              @if (registerForm().errors().length > 0) {
                <div class="text-error text-sm text-center">
                  {{ registerForm().errors()[0]?.message }}
                </div>
              }

              <chessops-button
                type="submit"
                variant="primary"
                size="md"
                [disabled]="registerForm().submitting()"
                [fullWidth]="true"
              >
                @if (registerForm().submitting()) {
                  <span>Creating account...</span>
                } @else {
                  <span>Create account</span>
                }
              </chessops-button>
            </div>
          </form>
        </chessops-card>
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
