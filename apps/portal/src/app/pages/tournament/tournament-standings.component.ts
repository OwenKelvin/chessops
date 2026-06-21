import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  TournamentService,
  type StandingsEntry,
} from '../../services/tournament.service';

@Component({
  selector: 'chessops-tournament-standings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="standings-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading standings...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <h2>Error</h2>
          <p>{{ error() }}</p>
          <a routerLink="/" class="btn btn-secondary">Back to Home</a>
        </div>
      } @else if (standings().length > 0) {
        <header class="standings-header">
          <div class="header-content">
            <h1>Tournament Standings</h1>
            @if (tournamentName()) {
              <p class="tournament-name">{{ tournamentName() }}</p>
            }
          </div>
          <a [routerLink]="['/tournaments', tournamentId()]" class="btn btn-secondary">
            ← Back to Tournament
          </a>
        </header>

        <div class="standings-table-wrapper">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="col-rank">#</th>
                <th class="col-player">Player</th>
                <th class="col-rating">Rating</th>
                <th class="col-games">Games</th>
                <th class="col-wins">W</th>
                <th class="col-draws">D</th>
                <th class="col-losses">L</th>
                <th class="col-points">Points</th>
                <th class="col-tiebreak" title="Buchholz">Buch</th>
                <th class="col-tiebreak" title="Sonneborn-Berger">SB</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of standings(); track entry.playerId) {
                <tr>
                  <td class="col-rank">
                    @if (entry.rank === 1) {
                      <span class="rank-gold">{{ entry.rank }}</span>
                    } @else if (entry.rank === 2) {
                      <span class="rank-silver">{{ entry.rank }}</span>
                    } @else if (entry.rank === 3) {
                      <span class="rank-bronze">{{ entry.rank }}</span>
                    } @else {
                      {{ entry.rank }}
                    }
                  </td>
                  <td class="col-player">
                    <span class="player-name">{{ entry.name }}</span>
                    @if (entry.seed) {
                      <span class="player-seed">({{ entry.seed }})</span>
                    }
                  </td>
                  <td class="col-rating">{{ entry.rating || '-' }}</td>
                  <td class="col-games">{{ entry.games }}</td>
                  <td class="col-wins">{{ entry.wins }}</td>
                  <td class="col-draws">{{ entry.draws }}</td>
                  <td class="col-losses">{{ entry.losses }}</td>
                  <td class="col-points"><strong>{{ entry.points }}</strong></td>
                  <td class="col-tiebreak">{{ entry.tiebreaks.buchholz | number:'1.1-1' }}</td>
                  <td class="col-tiebreak">{{ entry.tiebreaks.sonnebornBerger | number:'1.1-1' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .standings-page {
      min-height: 100vh;
      background: var(--color-background);
      color: var(--color-foreground);
      padding: 2rem 1.5rem;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state h2 {
      color: var(--color-error);
      margin-bottom: 0.5rem;
    }

    .error-state p {
      color: var(--color-muted-foreground);
      margin-bottom: 1.5rem;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .btn-secondary {
      background: var(--color-surface);
      color: var(--color-foreground);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-surface-elevated);
    }

    /* Header */
    .standings-header {
      max-width: 1200px;
      margin: 0 auto 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 1.75rem;
      margin: 0 0 0.25rem 0;
      color: var(--color-primary);
    }

    .tournament-name {
      color: var(--color-muted-foreground);
      margin: 0;
    }

    /* Table */
    .standings-table-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
    }

    .standings-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .standings-table th {
      padding: 0.75rem 1rem;
      background: var(--color-surface-elevated);
      border-bottom: 2px solid var(--color-border);
      text-align: left;
      font-weight: 600;
      color: var(--color-foreground);
      white-space: nowrap;
    }

    .standings-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-foreground);
    }

    .standings-table tbody tr:hover {
      background: var(--color-surface);
    }

    .standings-table tbody tr:last-child td {
      border-bottom: none;
    }

    .col-rank {
      width: 3rem;
      text-align: center;
      font-weight: 600;
    }

    .rank-gold {
      color: #fbbf24;
      font-size: 1.125rem;
    }

    .rank-silver {
      color: #9ca3af;
      font-size: 1.125rem;
    }

    .rank-bronze {
      color: #b45309;
      font-size: 1.125rem;
    }

    .col-player {
      min-width: 200px;
    }

    .player-name {
      font-weight: 500;
    }

    .player-seed {
      color: var(--color-muted-foreground);
      font-size: 0.75rem;
      margin-left: 0.25rem;
    }

    .col-rating, .col-games, .col-wins, .col-draws, .col-losses {
      text-align: center;
    }

    .col-points {
      text-align: center;
      font-weight: 700;
      font-size: 1rem;
    }

    .col-tiebreak {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
    }
  `,
})
export class TournamentStandingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tournamentService = inject(TournamentService);

  standings = signal<StandingsEntry[]>([]);
  tournamentName = signal('');
  loading = signal(false);
  error = signal('');

  private tournamentIdValue = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tournamentIdValue.set(id);
      this.loadStandings(id);
    }
  }

  async loadStandings(tournamentId: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const [tournament, result] = await Promise.all([
        this.tournamentService.getTournament(tournamentId),
        this.tournamentService.getStandings(tournamentId),
      ]);
      this.tournamentName.set(tournament.name);
      this.standings.set(result.standings);
    } catch (e) {
      this.error.set('Failed to load standings');
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  tournamentId(): string {
    return this.tournamentIdValue();
  }
}
