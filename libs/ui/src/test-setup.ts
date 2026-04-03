import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach } from 'vitest';

beforeEach(() => {
  // Zoneless change detection setup
});

export const globalProviders = [provideZonelessChangeDetection()];
