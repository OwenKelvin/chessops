import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { form, required, minLength } from '@angular/forms';

interface PasswordChangeModel {
  currentPassword: string;
  newPassword: string;
}

@Component({
  selector: 'app-account-page',
  imports: [HttpClientModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto space-y-8">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
          <button (click)="logout()" class="text-sm text-red-600 hover:text-red-500">Sign out</button>
        </div>

        <!-- Profile Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Profile</h2>
          @if (user()) {
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-500">Email</label>
                <p class="mt-1 text-gray-900">{{ user()?.email }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Display Name</label>
                <p class="mt-1 text-gray-900">{{ user()?.displayName }}</p>
              </div>
            </div>
          } @else {
            <p class="text-gray-500">Loading...</p>
          }
        </div>

        <!-- MFA Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h2>
          @if (mfaEnabled() === null) {
            <p class="text-gray-500">Loading...</p>
          } @else if (mfaEnabled()) {
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <svg class="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                <span class="text-gray-900">MFA is enabled</span>
              </div>
              <button (click)="disableMfa()" class="text-sm text-red-600 hover:text-red-500">Disable</button>
            </div>
          } @else {
            <p class="text-gray-500 mb-4">Two-factor authentication is not enabled</p>
            <button (click)="enableMfa()" class="text-sm text-indigo-600 hover:text-indigo-500">Enable MFA</button>
          }
        </div>

        <!-- Change Password Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
          <form (ngSubmit)="onChangePassword()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Current Password</label>
              <input type="password" [formField]="passwordForm.currentPassword"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              @if (passwordForm.currentPassword.touched() && !passwordForm.currentPassword.valid()) {
                <span class="text-red-500 text-xs">{{ passwordForm.currentPassword.errors()[0]?.message }}</span>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">New Password</label>
              <input type="password" [formField]="passwordForm.newPassword"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              @if (passwordForm.newPassword.touched() && !passwordForm.newPassword.valid()) {
                <span class="text-red-500 text-xs">{{ passwordForm.newPassword.errors()[0]?.message }}</span>
              }
            </div>

            @if (passwordMessage()) {
              <p [class]="passwordMessageClass()">{{ passwordMessage() }}</p>
            }

            <button type="submit" [disabled]="loading() || !passwordForm.valid()"
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {{ loading() ? 'Updating...' : 'Update Password' }}
            </button>
          </form>
        </div>

        <!-- Sessions Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Security</h2>
          <button (click)="revokeAllSessions()" class="text-sm text-red-600 hover:text-red-500">
            Sign out of all sessions
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AccountPageComponent implements OnInit {
  passwordForm = form<PasswordChangeModel>(
    {
      currentPassword: '',
      newPassword: '',
    },
    (form) => {
      required(form.currentPassword, { message: 'Current password is required' });
      required(form.newPassword, { message: 'New password is required' });
      minLength(form.newPassword, 8, { message: 'Password must be at least 8 characters' });
    },
  );

  user = signal<{ email: string; displayName: string } | null>(null);
  mfaEnabled = signal<boolean | null>(null);
  passwordMessage = signal('');
  passwordMessageClass = signal('text-sm');
  loading = signal(false);

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadUser();
    this.checkMfaStatus();
  }

  loadUser() {
    const token = localStorage.getItem('accessToken');
    this.http.get('http://localhost:3000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).subscribe({
      next: (response: any) => this.user.set(response),
      error: () => this.router.navigate(['/login']),
    });
  }

  checkMfaStatus() {
    const token = localStorage.getItem('accessToken');
    this.http.get('http://localhost:3000/api/mfa/status', {
      headers: { Authorization: `Bearer ${token}` },
    }).subscribe({
      next: (response: any) => this.mfaEnabled.set(response.enabled),
      error: () => this.mfaEnabled.set(false),
    });
  }

  enableMfa() {
    this.router.navigate(['/mfa-setup']);
  }

  disableMfa() {
    const token = localStorage.getItem('accessToken');
    const code = prompt('Enter your 6-digit MFA code to disable:');
    if (!code) return;

    this.http.post('http://localhost:3000/api/mfa/disable', { token: code }, {
      headers: { Authorization: `Bearer ${token}` },
    }).subscribe({
      next: () => {
        this.mfaEnabled.set(false);
        this.passwordMessage.set('MFA disabled successfully');
        this.passwordMessageClass.set('text-sm text-green-600');
      },
      error: (err) => {
        this.passwordMessage.set(err.error?.message || 'Failed to disable MFA');
        this.passwordMessageClass.set('text-sm text-red-600');
      },
    });
  }

  onChangePassword() {
    if (!this.passwordForm.valid()) return;

    this.loading.set(true);
    this.passwordMessage.set('');

    const value = this.passwordForm.value;
    this.http.post('http://localhost:3000/api/auth/change-password', {
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).subscribe({
      next: () => {
        this.passwordMessage.set('Password updated successfully');
        this.passwordMessageClass.set('text-sm text-green-600');
        this.passwordForm.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.passwordMessage.set(err.error?.message || 'Failed to update password');
        this.passwordMessageClass.set('text-sm text-red-600');
        this.loading.set(false);
      },
    });
  }

  revokeAllSessions() {
    if (!confirm('This will sign you out of all devices. Continue?')) return;

    this.http.post('http://localhost:3000/api/auth/revoke-sessions', {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.passwordMessage.set('Failed to revoke sessions');
        this.passwordMessageClass.set('text-sm text-red-600');
      },
    });
  }

  logout() {
    this.http.post('http://localhost:3000/api/auth/logout', {
      refreshToken: localStorage.getItem('refreshToken'),
    }).subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
    });
  }
}
