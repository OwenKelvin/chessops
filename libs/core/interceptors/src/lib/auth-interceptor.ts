import { HttpInterceptorFn } from '@angular/common/http';
import { injectBackendUrl } from '@chessops/core/providers';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const backendUrl = injectBackendUrl();

  // Check if request URL is relative (not full http/https URL)
  const isRelativeUrl = !/^https?:\/\//i.test(req.url);

  // Append backend URL only for relative URLs
  const apiUrl = isRelativeUrl ? `${backendUrl}/${req.url}` : req.url;
  alert(apiUrl);

  const clonedReq = req.clone({
    url: apiUrl,
    setHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  return next(clonedReq);
};
