import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';


export const BACKEND_URL = new InjectionToken<string>('BACKEND_URL');

export const provideBackendUrl = (url: string) => {
  return makeEnvironmentProviders([
    {
      provide: BACKEND_URL,
      useValue: url,
    },
  ]);
};

export const injectBackendUrl = () => inject(BACKEND_URL)
