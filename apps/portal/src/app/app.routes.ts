import { Route } from '@angular/router';
import { LoginPageComponent } from './pages/login/login.component';
import { RegisterPageComponent } from './pages/register/register.component';
import { RecoveryPageComponent } from './pages/recovery/recovery.component';
import { MfaSetupPageComponent } from './pages/mfa-setup/mfa-setup.component';
import { AccountPageComponent } from './pages/account/account.component';
import { ApiDocsComponent } from './pages/api-docs/api-docs.component';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'forgot-password', component: RecoveryPageComponent },
  { path: 'mfa-setup', component: MfaSetupPageComponent },
  { path: 'account', component: AccountPageComponent },
  { path: 'docs/api', component: ApiDocsComponent },
];
