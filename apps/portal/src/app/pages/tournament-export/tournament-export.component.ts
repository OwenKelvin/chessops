import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@chessops/ui/card';

@Component({
  selector: 'chessops-tournament-export',
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
          Export
        </h1>
        <chessops-card>
          <p class="text-muted-foreground mb-4">
            Tournament exports are coming soon. You will be able to download
            PGN and CSV files here.
          </p>
          <div class="flex gap-4">
            <button
              disabled
              class="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              Download PGN
            </button>
            <button
              disabled
              class="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              Download CSV
            </button>
          </div>
        </chessops-card>
      </div>
    </div>
  `,
})
export class TournamentExportComponent {
  private route = inject(ActivatedRoute);
  tournamentId = signal(this.route.snapshot.paramMap.get('id') ?? '');
}
