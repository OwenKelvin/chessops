import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginPageComponent } from './pages/login/login.component';
import { RegisterPageComponent } from './pages/register/register.component';
import { RecoveryPageComponent } from './pages/recovery/recovery.component';
import { MfaSetupPageComponent } from './pages/mfa-setup/mfa-setup.component';
import { AccountPageComponent } from './pages/account/account.component';
import { ApiDocsComponent } from './pages/api-docs/api-docs.component';
import { HomeComponent } from './pages/home/home.component';
import { TournamentDetailComponent } from './pages/tournament/tournament-detail.component';
import { TournamentStandingsComponent } from './pages/tournament/tournament-standings.component';
import { TournamentCreateComponent } from './pages/tournament-create/tournament-create.component';
import { TournamentManageComponent } from './pages/tournament-manage/tournament-manage.component';
import { TournamentPlayersComponent } from './pages/tournament-players/tournament-players.component';
import { TournamentAdminsComponent } from './pages/tournament-admins/tournament-admins.component';
import { PlayerCreateComponent } from './pages/player-create/player-create.component';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'forgot-password', component: RecoveryPageComponent },
  { path: 'mfa-setup', component: MfaSetupPageComponent },
  { path: 'account', component: AccountPageComponent, canActivate: [authGuard] },
  { path: 'docs/api', component: ApiDocsComponent },
  {
    path: 'tournaments/create',
    component: TournamentCreateComponent,
    canActivate: [authGuard],
  },
  { path: 'tournaments/:id', component: TournamentDetailComponent },
  { path: 'tournaments/:id/standings', component: TournamentStandingsComponent },
  {
    path: 'tournaments/:id/manage',
    component: TournamentManageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tournaments/:tournamentId/players',
    component: TournamentPlayersComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tournaments/:id/admins',
    component: TournamentAdminsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'players/create',
    component: PlayerCreateComponent,
    canActivate: [authGuard],
  },
];
