import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'chessops-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="themeService.toggle()"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-pressed]="themeService.isDark()"
    >
      <span class="icon-sun" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </span>
      <span class="icon-moon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .theme-toggle {
      position: relative;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 9999px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-foreground);
      cursor: pointer;
      display: grid;
      place-items: center;
      overflow: hidden;
      transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .theme-toggle:hover {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-ring);
    }

    .theme-toggle:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--color-ring);
    }

    .icon-sun,
    .icon-moon {
      position: absolute;
      display: grid;
      place-items: center;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
    }

    :host-context(html.dark) .icon-sun,
    :host-context([data-theme='dark']) .icon-sun {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }

    :host-context(html.dark) .icon-moon,
    :host-context([data-theme='dark']) .icon-moon {
      transform: translateY(1.5rem) rotate(-90deg);
      opacity: 0;
    }

    :host-context(html:not(.dark)) .icon-sun,
    :host-context([data-theme='light']) .icon-sun {
      transform: translateY(-1.5rem) rotate(90deg);
      opacity: 0;
    }

    :host-context(html:not(.dark)) .icon-moon,
    :host-context([data-theme='light']) .icon-moon {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
  `,
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}
