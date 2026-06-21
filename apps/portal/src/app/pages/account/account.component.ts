import { Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import {
  FieldTree,
  FormField,
  FormRoot,
  form,
  required,
  minLength,
  TreeValidationResult,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { InputComponent } from '@chessops/ui/input';
import { ButtonComponent } from '@chessops/ui/button';
import { CardComponent } from '@chessops/ui/card';
import { injectBackendUrl } from '@chessops/core/providers';
import { NotificationService } from '../../services/notification.service';
import { FormErrorComponent } from '../../components/form-error/form-error.component';

interface PasswordChangeModel {
  currentPassword: string;
  newPassword: string;
}

@Component({
  selector: 'app-account-page',
  imports: [
    FormField,
    FormRoot,
    InputComponent,
    ButtonComponent,
    CardComponent,
    FormErrorComponent,
  ],
  template: `
    <div class="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-foreground">Account Settings</h1>
          <chessops-button (onClick)="logout()" variant="ghost" size="sm"
            >Sign out</chessops-button
          >
        </div>

        <!-- Profile Section -->
        <chessops-card
          variant="default"
          [header]="true"
          title="Profile"
          [padding]="true"
        >
          @if (user()) {
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-muted"
                  >Email</label
                >
                <p class="mt-1 text-foreground">{{ user()?.email }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-muted"
                  >Display Name</label
                >
                <p class="mt-1 text-foreground">{{ user()?.displayName }}</p>
              </div>
            </div>
          } @else {
            <p class="text-muted">Loading...</p>
          }
        </chessops-card>

        <!-- MFA Section -->
        <chessops-card
          variant="default"
          [header]="true"
          title="Two-Factor Authentication"
          [padding]="true"
        >
          @if (mfaEnabled() === null) {
            <p class="text-muted">Loading...</p>
          } @else if (mfaEnabled()) {
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <svg
                  class="h-6 w-6 text-success mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
                <span class="text-foreground">MFA is enabled</span>
              </div>
              <chessops-button
                (onClick)="disableMfa()"
                variant="ghost"
                size="sm"
                >Disable</chessops-button
              >
            </div>
          } @else {
            <p class="text-muted mb-4">
              Two-factor authentication is not enabled
            </p>
            <chessops-button (onClick)="enableMfa()" variant="primary" size="sm"
              >Enable MFA</chessops-button
            >
          }
        </chessops-card>

        <!-- Change Password Section -->
        <chessops-card
          variant="default"
          [header]="true"
          title="Change Password"
          [padding]="true"
        >
          <form class="space-y-4" [formRoot]="passwordForm">
            <chessops-input
              id="currentPassword"
              type="password"
              label="Current Password"
              placeholder="Your current password"
              [formField]="passwordForm.currentPassword"
            />

            <chessops-input
              id="newPassword"
              type="password"
              label="New Password"
              placeholder="Minimum 8 characters"
              [formField]="passwordForm.newPassword"
            />

            <chessops-form-error [message]="passwordForm().errors()[0]?.message" />

            @if (passwordMessage()) {
              <p [class]="passwordMessageClass()">{{ passwordMessage() }}</p>
            }

            <chessops-button
              type="submit"
              variant="primary"
              size="md"
              [disabled]="passwordForm().submitting()"
            >
              @if (passwordForm().submitting()) {
                <span>Updating...</span>
              } @else {
                <span>Update Password</span>
              }
            </chessops-button>
          </form>
        </chessops-card>

        <!-- Sessions Section -->
        <chessops-card
          variant="default"
          [header]="true"
          title="Security"
          [padding]="true"
        >
          <chessops-button
            (onClick)="revokeAllSessions()"
            variant="ghost"
            size="sm"
          >
            Sign out of all sessions
          </chessops-button>
        </chessops-card>
      </div>
    </div>
  `,
})
export class AccountPageComponent implements OnInit {
  private backendUrl = injectBackendUrl();
  private notification = inject(NotificationService);
  private auth = inject(AuthService);
  passwordFormValue = signal<PasswordChangeModel>({
    currentPassword: '',
    newPassword: '',
  });

  submitPasswordChange = async (field: FieldTree<PasswordChangeModel>) => {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.backendUrl}/api/auth/change-password`,
          {
            currentPassword: field.currentPassword().value(),
            newPassword: field.newPassword().value(),
          },
        ),
      );
      this.passwordMessage.set('Password updated successfully');
      this.passwordMessageClass.set('text-sm text-green-600');
      this.notification.success('Password updated successfully.');
      return undefined as TreeValidationResult;
    } catch (err: any) {
      const message = err.error?.message || 'Failed to update password';
      this.notification.error(message);
      return {
        kind: 'server',
        message,
      } as TreeValidationResult;
    }
  };

  passwordForm = form<PasswordChangeModel>(
    this.passwordFormValue,
    (form) => {
      required(form.currentPassword, {
        message: 'Current password is required',
      });
      required(form.newPassword, { message: 'New password is required' });
      minLength(form.newPassword, 8, {
        message: 'Password must be at least 8 characters',
      });
    },
    {
      submission: {
        action: this.submitPasswordChange,
      },
    },
  );

  user = signal<User | null>(null);
  mfaEnabled = signal<boolean | null>(null);
  passwordMessage = signal('');
  passwordMessageClass = signal('text-sm');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadUser();
    this.checkMfaStatus();
  }

  async loadUser() {
    try {
      const response = await firstValueFrom(
        this.http.get<User>(`${this.backendUrl}/api/auth/me`),
      );
      this.user.set(response);
    } catch {
      await this.auth.logout();
      this.router.navigate(['/login']);
    }
  }

  async checkMfaStatus() {
    try {
      const response = await firstValueFrom(
        this.http.get<{ enabled: boolean }>(`${this.backendUrl}/api/mfa/status`),
      );
      this.mfaEnabled.set(response.enabled);
    } catch {
      this.mfaEnabled.set(false);
    }
  }

  enableMfa() {
    this.router.navigate(['/mfa-setup']);
  }

  async disableMfa() {
    const code = prompt('Enter your 6-digit MFA code to disable:');
    if (!code) return;

    try {
      await firstValueFrom(
        this.http.post(`${this.backendUrl}/api/mfa/disable`, { token: code }),
      );
      this.mfaEnabled.set(false);
      this.passwordMessage.set('MFA disabled successfully');
      this.passwordMessageClass.set('text-sm text-green-600');
      this.notification.success('MFA disabled successfully.');
    } catch (err: any) {
      const message = err.error?.message || 'Failed to disable MFA';
      this.passwordMessage.set(message);
      this.passwordMessageClass.set('text-sm text-red-600');
      this.notification.error(message);
    }
  }

  async revokeAllSessions() {
    if (!confirm('This will sign you out of all devices. Continue?')) return;

    try {
      await firstValueFrom(
        this.http.post(`${this.backendUrl}/api/auth/revoke-sessions`, {}),
      );
      this.notification.success('Signed out of all other sessions.');
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch {
      this.notification.error('Failed to revoke sessions.');
    }
  }

  async logout() {
    try {
      await firstValueFrom(
        this.http.post(`${this.backendUrl}/api/auth/logout`, {}),
      );
      this.notification.success('Signed out successfully.');
    } catch {
      this.notification.error('Failed to sign out.');
    } finally {
      await this.auth.logout();
      this.router.navigate(['/login']);
    }
  }
}
