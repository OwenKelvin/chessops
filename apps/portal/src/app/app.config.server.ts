import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';
import { appConfig } from './app.config';
import { App } from './app';

const serverConfig: ApplicationConfig = {
  providers: [
    ...appConfig.providers,
    provideServerRendering(withRoutes(serverRoutes)),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
export { App };
