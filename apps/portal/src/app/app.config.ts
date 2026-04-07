import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideBackendUrl  } from '@chessops/core/providers';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@chessops/core/interceptors';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideBackendUrl('http://localhost:8082'),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
