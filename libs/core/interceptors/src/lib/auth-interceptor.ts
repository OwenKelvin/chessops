import { HttpInterceptorFn } from '@angular/common/http';
import { injectBackendUrl } from '@chessops/core/providers';
import { PLATFORM_ID } from '@angular/core';
import { inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const backendUrl = injectBackendUrl();
  const platformId = inject(PLATFORM_ID);

  // Get token from localStorage (client-side only)
  let token: string | null = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('accessToken');
  }

  // Check if request URL is relative (not full http/https URL)
  const isRelativeUrl = !/^https?:\/\//i.test(req.url);

  // Append backend URL only for relative URLs
  const apiUrl = isRelativeUrl ? `${backendUrl}/${req.url}` : req.url;

  // For cookie-based auth, we need to send requests with credentials
  const clonedReq = req.clone({
    url: apiUrl,
    withCredentials: true,
    setHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  return next(clonedReq);
};
