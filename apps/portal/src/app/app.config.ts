import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideBackendUrl } from '@chessops/core/providers';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { errorInterceptor } from '@chessops/core/interceptors';
import { provideClientHydration } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { authTokenInterceptor } from './services/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideBackendUrl('http://localhost:8082'),
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor, authTokenInterceptor]),
    ),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const theme = inject(ThemeService);
      theme.initialize();
      return auth.loadUser();
    }),
  ],
};
