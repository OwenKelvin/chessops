import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER, provideAppInitializer, inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideBackendUrl  } from '@chessops/core/providers';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@chessops/core/interceptors';
import { provideClientHydration } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideBackendUrl('http://localhost:8082'),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer((auth = inject(AuthService)) => auth.loadUser()),
  ],
};
