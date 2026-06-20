import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@Component({
  imports: [RouterOutlet, RouterLink, ThemeToggleComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  protected title = 'portal';

  ngOnInit(): void {
    this.themeService.initialize();
  }
}
