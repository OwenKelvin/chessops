import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TitleCasePipe } from '@angular/common';
import { AuthService, type AuthTokens } from '../../services/auth.service';
import {
  FieldTree,
  form,
  FormField,
  FormRoot,
  minLength,
  required,
  TreeValidationResult,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { InputComponent } from '@chessops/ui/input';
import { ButtonComponent } from '@chessops/ui/button';
import { CardComponent } from '@chessops/ui/card';
import { SelectComponent, type SelectOption } from '@chessops/ui/select';
import { injectBackendUrl } from '@chessops/core/providers';
import { NotificationService } from '../../services/notification.service';
import { FormErrorComponent } from '../../components/form-error/form-error.component';

interface RegisterModel {
  email: string;
  password: string;
  displayName: string;
  countryCode: string;
}

interface PasswordRequirement {
  id: string;
  label: string;
  pattern: RegExp;
  satisfied: boolean;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

interface Country {
  id: string;
  name: string;
  code: string;
  dialCode?: string;
  flagEmoji?: string;
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
    SelectComponent,
    TitleCasePipe,
    FormErrorComponent,
  ],
  template: `
    <div
      class="min-h-screen flex bg-gradient-to-br from-surface via-background to-surface-elevated"
    >
      <!-- Left side - Decorative chess pattern -->
      <div
        class="hidden lg:flex lg:w-1/2 relative bg-secondary overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10">
          <!-- Chess board pattern -->
          <div class="grid grid-cols-8 grid-rows-8 w-full h-full">
            @for (row of [0, 1, 2, 3, 4, 5, 6, 7]; track row) {
              @for (col of [0, 1, 2, 3, 4, 5, 6, 7]; track col) {
                <div
                  class="w-full h-full"
                  [class.bg-surface]="(row + col) % 2 === 0"
                  [class.bg-secondary]="(row + col) % 2 === 1"
                ></div>
              }
            }
          </div>
        </div>
        <!-- Decorative logo placeholder -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <img
              src="logo.svg"
              alt="ChessOps"
              class="mx-auto h-32 w-auto mb-8 opacity-90"
            />
            <h1 class="text-5xl font-display font-bold text-surface mb-4">
              ChessOps
            </h1>
            <p class="text-xl text-surface/80 font-body">Join the Community</p>
          </div>
        </div>
      </div>

      <!-- Right side - Register form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div class="w-full max-w-md">
          <!-- Logo for mobile -->
          <div class="lg:hidden text-center mb-8">
            <img
              src="logo.svg"
              alt="ChessOps"
              class="mx-auto h-16 w-auto mb-2"
            />
            <h1 class="text-3xl font-display font-bold text-primary">
              ChessOps
            </h1>
          </div>

          <!-- Welcome text -->
          <div class="mb-8">
            <h2 class="text-3xl font-display font-bold text-primary mb-2">
              Create your account
            </h2>
            <p class="text-muted font-body">
              Start your chess journey with us today
            </p>
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

                <!-- Country selection -->
                <chessops-select
                  label="Country"
                  placeholder="Select your country"
                  [options]="countryOptions()"
                  [formField]="registerForm.countryCode"
                  [fullWidth]="true"
                />

                <!-- Password strength indicator -->
                <div
                  class="bg-surface-elevated rounded-md p-4 border border-border"
                >
                  <!-- Strength meter -->
                  <div class="mb-3">
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-xs font-medium text-muted font-body">Password strength</span>
                      <span
                        class="text-xs font-bold font-display"
                        [class]="strengthColor()"
                      >
                        {{ passwordStrength() | titlecase }}
                      </span>
                    </div>
                    <div class="flex gap-1">
                      @for (bar of barStates(); track $index) {
                        <div
                          class="h-1.5 flex-1 rounded-full transition-all duration-300"
                          [class]="getBarColor($index)"
                        ></div>
                      }
                    </div>
                  </div>

                  <!-- Requirements list -->
                  <div class="space-y-1.5">
                    @for (req of passwordRequirements(); track req.id) {
                      <div class="flex items-center gap-2">
                        @if (req.satisfied) {
                          <svg class="w-4 h-4 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          <span class="text-xs text-success font-body">{{ req.label }}</span>
                        } @else {
                          <span class="w-4 h-4 rounded-full border-2 border-muted/40 flex-shrink-0"></span>
                          <span class="text-xs text-muted font-body">{{ req.label }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Server error display -->
                <chessops-form-error [message]="registerForm().errors()[0]?.message" />

                <chessops-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [disabled]="
                    registerForm().submitting() || registerForm().invalid()
                  "
                  [fullWidth]="true"
                >
                  @if (registerForm().submitting()) {
                    <span class="flex items-center gap-2">
                      <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                          fill="none"
                        />
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
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
  backendUrl = injectBackendUrl();
  private notification = inject(NotificationService);
  private auth = inject(AuthService);

  countries = signal<Country[]>([]);
  isLoadingCountries = signal(true);

  constructor() {
    // Fetch countries on component initialization
    this.loadCountries();
  }

  loadCountries() {
    this.http.get<Country[]>(`${this.backendUrl}/api/countries`).subscribe({
      next: (data) => {
        this.countries.set(data);
        this.isLoadingCountries.set(false);
      },
      error: () => {
        this.isLoadingCountries.set(false);
      },
    });
  }

  countryOptions = computed<SelectOption[]>(() => {
    const countries = this.countries();
    return countries.map((c) => ({
      value: c.code,
      label: `${c.flagEmoji ?? ''} ${c.name}`,
    }));
  });

  registerFormValue = signal<RegisterModel>({
    email: '',
    password: '',
    displayName: '',
    countryCode: '',
  });

  passwordRequirements = computed<PasswordRequirement[]>(() => {
    const password = this.registerFormValue().password;
    return [
      { id: 'length', label: 'At least 8 characters', pattern: /^.{8,}$/, satisfied: password.length >= 8 },
      { id: 'uppercase', label: 'One uppercase letter', pattern: /[A-Z]/, satisfied: /[A-Z]/.test(password) },
      { id: 'lowercase', label: 'One lowercase letter', pattern: /[a-z]/, satisfied: /[a-z]/.test(password) },
      { id: 'number', label: 'One number', pattern: /[0-9]/, satisfied: /[0-9]/.test(password) },
      { id: 'special', label: 'One special character', pattern: /[!@#$%^&*(),.?":{}|<>]/, satisfied: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
  });

  satisfiedCount = computed(() => {
    return this.passwordRequirements().filter(r => r.satisfied).length;
  });

  passwordStrength = computed<PasswordStrength>(() => {
    const count = this.satisfiedCount();
    if (count <= 2) return 'weak';
    if (count <= 4) return 'medium';
    return 'strong';
  });

  strengthColor = computed(() => {
    const strength = this.passwordStrength();
    if (strength === 'weak') return 'text-error';
    if (strength === 'medium') return 'text-warning';
    return 'text-success';
  });

  barStates = computed(() => {
    const strength = this.passwordStrength();
    return [
      { filled: true, active: true },
      { filled: strength !== 'weak', active: strength !== 'weak' },
      { filled: strength === 'strong', active: strength === 'strong' },
    ];
  });

  getBarColor = (index: number): string => {
    const state = this.barStates()[index];
    if (!state.filled) return 'bg-border';
    if (index === 0) return 'bg-error';
    if (index === 1) return 'bg-warning';
    return 'bg-success';
  };

  submitForm = async (field: FieldTree<RegisterModel>) => {
    try {
      const result = await firstValueFrom(
        this.http.post<AuthTokens>(`${this.backendUrl}/api/auth/register`, {
          email: field.email().value(),
          password: field.password().value(),
          displayName: field.displayName().value(),
        }),
      );
      await this.auth.storeTokens(result);
      this.notification.success('Account created successfully.');
      this.router.navigate(['/account']);
      return undefined as TreeValidationResult;
    } catch (err: any) {
      const message = err.error?.message || 'Registration failed';
      this.notification.error(message);
      if (/email/.test(message.toLowerCase())) {
        return {
          fieldTree: field.email,
          kind: 'server',
          message,
        } as TreeValidationResult;
      }

      return {
        kind: 'server',
        message,
      } as TreeValidationResult;
    }
  };

  registerForm = form<RegisterModel>(
    this.registerFormValue,
    (form) => {
      required(form.displayName, { message: 'Name is required' });
      required(form.email, { message: 'Email is required' });
      required(form.password, { message: 'Password is required' });
      required(form.countryCode, { message: 'Country is required' });
      minLength(form.password, 8, { message: 'Password must contain at least 8 characters '});
    },
    {
      submission: {
        action: this.submitForm,
      },
    },
  );
}
