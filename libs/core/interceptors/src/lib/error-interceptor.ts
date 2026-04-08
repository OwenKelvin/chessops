import { HttpInterceptorFn } from '@angular/common/http';
import { injectBackendUrl } from '@chessops/core/providers';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const backendUrl = injectBackendUrl();

  // Check if request URL is relative (not full http/https URL)
  const isRelativeUrl = !/^https?:\/\//i.test(req.url);

  // Append backend URL only for relative URLs
  const apiUrl = isRelativeUrl ? `${backendUrl}/${req.url}` : req.url;

  const clonedReq = req.clone({
    url: apiUrl,
    withCredentials: true,
  });

  return next(clonedReq);
};
