import {
  Injectable,
  inject,
  signal,
  computed,
  DOCUMENT,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
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
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID); // ✅ Needed for platform checks

  private isBrowser = isPlatformBrowser(this.platformId);
  private isServer = isPlatformServer(this.platformId);

  private user = signal<User | null>(null);
  private loaded = signal(false);
  private refreshPromise: Promise<{ accessToken: string } | void> | null = null;

  readonly currentUser = computed(() => this.user());
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isLoading = computed(() => !this.loaded());

  async loadUser(): Promise<void> {
    // ✅ Skip auth entirely on the server — cookies aren't forwarded
    //    unless you explicitly configure SSR transfer of auth headers.
    //    Mark as loaded so guards/resolvers don't hang.
    if (this.isServer) {
      this.loaded.set(true);
      return;
    }

    try {
      const user = await this.fetchUser();
      this.user.set(user);
    } catch (err: any) {
      if (err?.status === 401) {
        try {
          await this.refreshToken();
          const user = await this.fetchUser();
          this.user.set(user);
        } catch {
          this.user.set(null);
          this.clearAuthCookies(); // ✅ Extracted to a guarded helper
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
    // ✅ No-op on the server — authentication requires browser cookies
    if (this.isServer) {
      return;
    }

    if (this.isAuthenticated()) {
      return;
    }

    if (this.isLoading()) {
      await this.waitForLoad(); // ✅ Extracted to avoid raw setTimeout in SSR
    }

    if (this.isAuthenticated()) {
      return;
    }

    await this.refreshToken();
    const user = await this.fetchUser();
    this.user.set(user);
  }

  refreshToken(): Promise<{ accessToken: string }> {
    if (this.refreshPromise) {
      return this.refreshPromise as Promise<{ accessToken: string }>;
    }

    this.refreshPromise = firstValueFrom(
      this.http.post<{ accessToken: string }>(
        `${this.backendUrl}/api/auth/token/refresh`,
        {},
        { withCredentials: true },
      ),
    )
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise as Promise<{ accessToken: string }>;
  }

  // ✅ setTimeout is browser-safe, but guard it anyway so the pattern
  //    is explicit and won't hang if called unexpectedly on the server.
  private waitForLoad(): Promise<void> {
    return new Promise<void>((resolve) => {
      const poll = () => {
        if (!this.isLoading()) {
          resolve();
        } else if (this.isBrowser) {
          setTimeout(poll, 100);
        } else {
          resolve(); // Don't hang on server
        }
      };
      poll();
    });
  }

  // ✅ Cookie manipulation is browser-only; document.cookie is a no-op
  //    in Angular Universal's server DOM, but guard explicitly for clarity.
  private clearAuthCookies(): void {
    if (!this.isBrowser) return;
    this.document.cookie =
      'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    this.document.cookie =
      'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }

  logout(): void {
    this.user.set(null);
    this.loaded.set(true);
    this.clearAuthCookies();
  }

  isOwner(ownerId: string): boolean {
    return this.user()?.id === ownerId;
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }
}
