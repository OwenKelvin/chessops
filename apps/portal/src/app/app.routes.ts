import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { tournamentOwnerGuard } from './guards/tournament-owner.guard';
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
import { TournamentRoundsComponent } from './pages/tournament-rounds/tournament-rounds.component';
import { TournamentPairingsComponent } from './pages/tournament-pairings/tournament-pairings.component';
import { TournamentResultsComponent } from './pages/tournament-results/tournament-results.component';
import { TournamentExportComponent } from './pages/tournament-export/tournament-export.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PlayerCreateComponent } from './pages/player-create/player-create.component';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent, title: 'ChessOps' },
  { path: 'login', component: LoginPageComponent, title: 'Sign In' },
  { path: 'register', component: RegisterPageComponent, title: 'Create Account' },
  { path: 'forgot-password', component: RecoveryPageComponent, title: 'Reset Password' },
  { path: 'mfa-setup', component: MfaSetupPageComponent, title: 'Setup MFA' },
  { path: 'account', component: AccountPageComponent, canActivate: [authGuard], title: 'Account' },
  { path: 'docs/api', component: ApiDocsComponent, title: 'API Docs' },
  {
    path: 'tournaments/create',
    component: TournamentCreateComponent,
    canActivate: [authGuard],
    title: 'Create Tournament',
  },
  { path: 'tournaments/:id', component: TournamentDetailComponent, title: 'Tournament' },
  { path: 'tournaments/:id/standings', component: TournamentStandingsComponent, title: 'Standings' },
  {
    path: 'tournaments/:id/manage',
    component: TournamentManageComponent,
    canActivate: [authGuard, tournamentOwnerGuard],
    title: 'Manage Tournament',
  },
  {
    path: 'tournaments/:id/players',
    component: TournamentPlayersComponent,
    canActivate: [authGuard],
    title: 'Tournament Players',
  },
  {
    path: 'tournaments/:id/admins',
    component: TournamentAdminsComponent,
    canActivate: [authGuard],
    title: 'Tournament Admins',
  },
  {
    path: 'tournaments/:id/rounds',
    component: TournamentRoundsComponent,
    canActivate: [authGuard],
    title: 'Rounds',
  },
  {
    path: 'tournaments/:id/pairings',
    component: TournamentPairingsComponent,
    canActivate: [authGuard],
    title: 'Pairings',
  },
  {
    path: 'tournaments/:id/results',
    component: TournamentResultsComponent,
    canActivate: [authGuard],
    title: 'Results',
  },
  {
    path: 'tournaments/:id/export',
    component: TournamentExportComponent,
    canActivate: [authGuard],
    title: 'Export',
  },
  {
    path: 'players/create',
    component: PlayerCreateComponent,
    canActivate: [authGuard],
    title: 'Create Player',
  },
  { path: '**', component: NotFoundComponent, title: 'Not Found' },
];
