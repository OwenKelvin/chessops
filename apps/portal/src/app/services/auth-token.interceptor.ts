import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { StorageService } from './storage.service';
import { SKIP_AUTH } from './auth-context';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const storage = inject(StorageService);

  return from(storage.getAccessToken()).pipe(
    switchMap((token) => {
      if (token && !req.headers.has('Authorization')) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return next(req);
    }),
  );
};
