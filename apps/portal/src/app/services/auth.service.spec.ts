import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationConfig } from '@angular/core';
import { BACKEND_URL } from '@chessops/core/providers';
import { AuthService, AuthTokens, User } from './auth.service';
import { StorageService } from './storage.service';

const TEST_CONFIG: ApplicationConfig = {
  providers: [
    { provide: BACKEND_URL, useValue: '/api' },
  ],
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      ...TEST_CONFIG,
      providers: [
        ...(TEST_CONFIG.providers ?? []),
        AuthService,
        StorageService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store tokens and mark loading complete', async () => {
    const tokens: AuthTokens = {
      accessToken: 'access',
      refreshToken: 'refresh',
    };
    await service.storeTokens(tokens);
    expect(await service.getAccessToken()).toBe('access');
    expect(service.isLoading()).toBe(false);
  });

  it('should set user when loadUser resolves', async () => {
    const user: User = {
      id: '1',
      email: 'a@example.com',
      displayName: 'A',
      role: 'user',
    };

    const http = TestBed.inject(HttpTestingController);
    service.loadUser();
    http.expectOne('/api/auth/me').flush(user);
    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
    http.verify();
  });
});
