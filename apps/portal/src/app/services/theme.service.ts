import {
  signal,
  computed,
  PLATFORM_ID,
  inject,
  Service,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'chessops-theme';

@Service()
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly theme = signal<AppTheme>(this.resolveInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    if (this.isBrowser) {
      // Listen for system preference changes when no explicit stored choice exists
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (event) => {
        if (!this.hasStoredTheme()) {
          this.set(event.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  set(theme: AppTheme, persist = true): void {
    this.theme.set(theme);
    this.apply(theme);
    if (persist && this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  /** Apply to documentElement immediately. Safe for SSR because it only touches DOM in browser. */
  apply(theme: AppTheme): void {
    if (this.isBrowser) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }

  /** Called from APP_INITIALIZER to set the theme class before first paint. */
  initialize(): void {
    this.apply(this.theme());
  }

  private resolveInitialTheme(): AppTheme {
    if (this.isBrowser) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'dark';
  }

  private hasStoredTheme(): boolean {
    if (!this.isBrowser) return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light';
  }
}
