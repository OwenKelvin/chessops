import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { injectBackendUrl } from '@chessops/core/providers';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private backendUrl = injectBackendUrl();

  private user = signal<User | null>(null);
  private loaded = signal(false);
  private refreshPromise: Promise<void> | null = null;

  readonly currentUser = computed(() => this.user());
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isLoading = computed(() => !this.loaded());

  async loadUser(): Promise<void> {
    try {
      const user = await this.fetchUser();
      this.user.set(user);
    } catch (err: any) {
      // If 401, try to refresh token and retry
      if (err?.status === 401) {
        try {
          await this.refreshToken();
          const user = await this.fetchUser();
          this.user.set(user);
        } catch {
          this.user.set(null);
        }
      } else {
        this.user.set(null);
      }
    } finally {
      this.loaded.set(true);
    }
  }

  private async fetchUser(): Promise<User> {
    return firstValueFrom(
      this.http.get<User>(`${this.backendUrl}/api/auth/me`, {
        withCredentials: true,
      }),
    );
  }

  async ensureAuthenticated(): Promise<void> {
    if (this.isAuthenticated()) {
      return;
    }
    if (this.isLoading()) {
      // Wait for initial load
      while (this.isLoading()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    if (this.isAuthenticated()) {
      return;
    }
    // Try to refresh and fetch user
    await this.refreshToken();
    const user = await this.fetchUser();
    this.user.set(user);
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = firstValueFrom(
      this.http.post<{ accessToken: string }>(
        `${this.backendUrl}/api/auth/token/refresh`,
        {},
        { withCredentials: true },
      ),
    ).then(() => {}).catch((err) => {
      throw err;
    });

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  isOwner(ownerId: string): boolean {
    return this.user()?.id === ownerId;
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }
}
