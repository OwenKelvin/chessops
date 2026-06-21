import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@chessops/ui/card';

@Component({
  selector: 'chessops-tournament-results',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground px-6 py-8">
      <div class="max-w-4xl mx-auto">
        <a
          [routerLink]="['/tournaments', tournamentId(), 'manage']"
          class="text-muted hover:text-primary transition-colors"
        >
          ← Back to Manage
        </a>
        <h1 class="text-2xl font-display font-bold text-primary mt-4 mb-6">
          Results
        </h1>
        <chessops-card>
          <p class="text-muted-foreground">
            Result submission is coming soon. You will be able to enter game
            results and update standings here.
          </p>
        </chessops-card>
      </div>
    </div>
  `,
})
export class TournamentResultsComponent {
  private route = inject(ActivatedRoute);
  tournamentId = signal(this.route.snapshot.paramMap.get('id') ?? '');
}
