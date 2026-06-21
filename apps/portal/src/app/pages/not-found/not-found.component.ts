import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '@chessops/ui/card';

@Component({
  selector: 'chessops-not-found',
  standalone: true,
  imports: [RouterLink, CardComponent],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-background text-foreground px-6 py-8">
      <chessops-card class="block max-w-md w-full text-center">
        <h1 class="text-4xl font-display font-bold text-primary mb-4">404</h1>
        <p class="text-muted-foreground mb-6">
          The page you are looking for does not exist.
        </p>
        <a
          routerLink="/"
          class="inline-block px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
        >
          Back to Home
        </a>
      </chessops-card>
    </div>
  `,
})
export class NotFoundComponent {}
