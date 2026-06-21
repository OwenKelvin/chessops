import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  imports: [RouterOutlet, RouterLink, ThemeToggleComponent, ToastContainerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  protected auth = inject(AuthService);
  protected title = 'portal';

  ngOnInit(): void {
    this.themeService.initialize();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
