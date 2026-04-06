import { Route } from '@angular/router';
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

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'forgot-password', component: RecoveryPageComponent },
  { path: 'mfa-setup', component: MfaSetupPageComponent },
  { path: 'account', component: AccountPageComponent },
  { path: 'docs/api', component: ApiDocsComponent },
  { path: 'tournaments/create', component: TournamentCreateComponent },
  { path: 'tournaments/:id', component: TournamentDetailComponent },
  { path: 'tournaments/:id/standings', component: TournamentStandingsComponent },
  { path: 'tournaments/:id/manage', component: TournamentManageComponent },
];
