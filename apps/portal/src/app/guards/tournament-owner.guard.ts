import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  CanActivateFn,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { injectBackendUrl } from '@chessops/core/providers';

interface Tournament {
  id: string;
  ownerId: string;
}

export const tournamentOwnerGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);
  const router = inject(Router);
  const backendUrl = injectBackendUrl();

  try {
    await auth.ensureAuthenticated();
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const id = route.paramMap.get('id');
  if (!id) {
    return router.createUrlTree(['/']);
  }

  try {
    const tournament = await firstValueFrom(
      http.get<Tournament>(`${backendUrl}/api/tournaments/${id}`),
    );
    if (auth.isOwner(tournament.ownerId) || auth.isAdmin()) {
      return true;
    }
  } catch {
    // fall through to deny
  }

  return router.createUrlTree(['/tournaments', id]);
};

export const tournamentAdminGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    await auth.ensureAuthenticated();
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // Backend enforces admin rights for mutations; allow the UI route
  return true;
};
