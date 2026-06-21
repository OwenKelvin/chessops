import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@chessops/ui/card';

@Component({
  selector: 'chessops-tournament-pairings',
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
          Pairings
        </h1>
        <chessops-card>
          <p class="text-muted-foreground">
            Pairing generation is coming soon. You will be able to generate
            Swiss and round-robin pairings here.
          </p>
        </chessops-card>
      </div>
    </div>
  `,
})
export class TournamentPairingsComponent {
  private route = inject(ActivatedRoute);
  tournamentId = signal(this.route.snapshot.paramMap.get('id') ?? '');
}
