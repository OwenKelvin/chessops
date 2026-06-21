import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { injectBackendUrl } from '@chessops/core/providers';
import { StorageService } from './storage.service';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private backendUrl = injectBackendUrl();
  private storage = inject(StorageService);
  private platformId = inject(PLATFORM_ID);

  private isBrowser = isPlatformBrowser(this.platformId);
  private isServer = isPlatformServer(this.platformId);

  private user = signal<User | null>(null);
  private loaded = signal(false);
  private refreshPromise: Promise<AuthTokens | void> | null = null;

  readonly currentUser = computed(() => this.user());
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isLoading = computed(() => !this.loaded());

  getAccessToken(): Promise<string | null> {
    return this.storage.getAccessToken();
  }

  async loadUser(): Promise<void> {
    if (this.isServer) {
      this.loaded.set(true);
      return;
    }

    const accessToken = await this.storage.getAccessToken();
    if (!accessToken) {
      this.loaded.set(true);
      return;
    }

    try {
      const user = await this.fetchUser();
      this.user.set(user);
    } catch (err: any) {
      if (err?.status === 401) {
        try {
          await this.refreshAccessToken();
          const user = await this.fetchUser();
          this.user.set(user);
        } catch {
          this.user.set(null);
          await this.storage.clearTokens();
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
        headers: await this.authHeaders(),
      }),
    );
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.storage.getAccessToken();
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  async storeTokens(tokens: AuthTokens): Promise<void> {
    await this.storage.setTokens(tokens.accessToken, tokens.refreshToken);
  }

  async ensureAuthenticated(): Promise<void> {
    if (this.isServer) {
      return;
    }

    if (this.isAuthenticated()) {
      return;
    }

    if (this.isLoading()) {
      await this.waitForLoad();
    }

    if (this.isAuthenticated()) {
      return;
    }

    await this.refreshAccessToken();
    const user = await this.fetchUser();
    this.user.set(user);
  }

  refreshAccessToken(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise as Promise<AuthTokens>;
    }

    this.refreshPromise = this.storage
      .getRefreshToken()
      .then((refreshToken) => {
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        return firstValueFrom(
          this.http.post<AuthTokens>(
            `${this.backendUrl}/api/auth/token/refresh`,
            { refreshToken },
          ),
        );
      })
      .then(async (tokens) => {
        await this.storage.setTokens(tokens.accessToken, tokens.refreshToken);
        return tokens;
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise as Promise<AuthTokens>;
  }

  private waitForLoad(): Promise<void> {
    return new Promise<void>((resolve) => {
      const poll = () => {
        if (!this.isLoading()) {
          resolve();
        } else if (this.isBrowser) {
          setTimeout(poll, 100);
        } else {
          resolve();
        }
      };
      poll();
    });
  }

  async logout(): Promise<void> {
    this.user.set(null);
    this.loaded.set(true);
    await this.storage.clearTokens();
  }

  isOwner(ownerId: string): boolean {
    return this.user()?.id === ownerId;
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }
}
