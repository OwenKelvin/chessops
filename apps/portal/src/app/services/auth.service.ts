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

  readonly currentUser = computed(() => this.user());
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isLoading = computed(() => !this.loaded());

  async loadUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${this.backendUrl}/api/auth/me`, {
          withCredentials: true,
        }),
      );
      this.user.set(user);
    } catch {
      this.user.set(null);
    } finally {
      this.loaded.set(true);
    }
  }

  isOwner(ownerId: string): boolean {
    return this.user()?.id === ownerId;
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }
}
