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
  type Tournament,
} from '../../services/tournament.service';
import { AuthService } from '../../services/auth.service';
import { BadgeComponent } from '@chessops/ui/badge';

@Component({
  selector: 'chessops-tournament-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tournament-detail-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading tournament...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <h2>Error</h2>
          <p>{{ error() }}</p>
          <a routerLink="/" class="btn btn-secondary">Back to Home</a>
        </div>
      } @else if (tournament(); as t) {
        <!-- Header -->
        <header class="tournament-header">
          <div class="tournament-title-section">
            <h1 class="tournament-name">{{ t.name }}</h1>
            <div class="tournament-badges">
              <chessops-badge [variant]="getStatusBadgeVariant(t.status)">
                {{ getStatusLabel(t.status) }}
              </chessops-badge>
              <chessops-badge variant="info">{{ t.format | titlecase }}</chessops-badge>
            </div>
          </div>
          @if (t.countryName) {
            <p class="tournament-country">
              <span class="country-flag">{{ getCountryFlag(t.country) }}</span>
              {{ t.countryName }}
              @if (t.location) {
                <span class="location-separator">•</span>
                {{ t.location }}
              }
            </p>
          }
        </header>

        <!-- Info Cards -->
        <div class="info-grid">
          <div class="info-card">
            <span class="info-label">Start Date</span>
            <span class="info-value">{{ t.startDate | date:'EEEE, MMMM d, y' }}</span>
          </div>
          @if (t.endDate) {
            <div class="info-card">
              <span class="info-label">End Date</span>
              <span class="info-value">{{ t.endDate | date:'EEEE, MMMM d, y' }}</span>
            </div>
          }
          @if (t.timeControl) {
            <div class="info-card">
              <span class="info-label">Time Control</span>
              <span class="info-value">{{ t.timeControl }}</span>
            </div>
          }
          <div class="info-card">
            <span class="info-label">Players</span>
            <span class="info-value">{{ t._count?.players || 0 }} / {{ t.maxPlayers || '∞' }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Rounds</span>
            <span class="info-value">{{ t._count?.rounds || 0 }} / {{ t.maxRounds }}</span>
          </div>
          @if (t.registrationOpen) {
            <div class="info-card">
              <span class="info-label">Registration</span>
              <span class="info-value status-open">Open</span>
            </div>
          }
        </div>

        @if (t.description) {
          <section class="description-section">
            <h2>Description</h2>
            <p>{{ t.description }}</p>
          </section>
        }

        <!-- Actions -->
        <section class="actions-section">
          <a [routerLink]="['/tournaments', t.id, 'standings']" class="btn btn-primary">
            View Standings
          </a>
          @if (isOwner()) {
            <a [routerLink]="['/tournaments', t.id, 'manage']" class="btn btn-secondary">
              Manage Tournament
            </a>
            <a [routerLink]="['/tournaments', t.id, 'admins']" class="btn btn-secondary">
              Manage Admins
            </a>
          }
        </section>

        <!-- Players List -->
        @if (t.players && t.players.length > 0) {
          <section class="players-section">
            <h2>Players ({{ t.players.length }})</h2>
            <div class="players-list">
              @for (tp of t.players; track tp.playerId) {
                <div class="player-item">
                  <span class="player-seed">{{ tp.seed }}</span>
                  <span class="player-name">{{ tp.player.firstName }} {{ tp.player.lastName }}</span>
                  @if (tp.player.rating) {
                    <span class="player-rating">{{ tp.player.rating }}</span>
                  }
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: `
    .tournament-detail-page {
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

    .btn-primary {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .btn-primary:hover {
      background: var(--color-primary-hover);
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
    .tournament-header {
      max-width: 900px;
      margin: 0 auto 2rem;
    }

    .tournament-title-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .tournament-name {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      color: var(--color-primary);
    }

    .tournament-badges {
      display: flex;
      gap: 0.5rem;
    }

    .tournament-country {
      font-size: 1rem;
      color: var(--color-muted-foreground);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .country-flag {
      font-size: 1.25rem;
    }

    .location-separator {
      margin: 0 0.5rem;
    }

    /* Info Grid */
    .info-grid {
      max-width: 900px;
      margin: 0 auto 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .info-card {
      padding: 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-foreground);
    }

    .status-open {
      color: var(--color-success);
    }

    /* Description */
    .description-section {
      max-width: 900px;
      margin: 0 auto 2rem;
      padding: 1.5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
    }

    .description-section h2 {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
      color: var(--color-primary);
    }

    .description-section p {
      color: var(--color-foreground);
      line-height: 1.6;
    }

    /* Actions */
    .actions-section {
      max-width: 900px;
      margin: 0 auto 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    /* Players */
    .players-section {
      max-width: 900px;
      margin: 0 auto;
    }

    .players-section h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    .players-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .player-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
    }

    .player-seed {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-muted-foreground);
      min-width: 2rem;
    }

    .player-name {
      flex: 1;
      font-weight: 500;
    }

    .player-rating {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
    }
  `,
})
export class TournamentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tournamentService = inject(TournamentService);
  private authService = inject(AuthService);

  tournament = signal<Tournament | null>(null);
  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTournament(id);
    }
  }

  async loadTournament(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const data = await this.tournamentService.getTournament(id);
      this.tournament.set(data);
    } catch (e) {
      this.error.set('Tournament not found');
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  isOwner(): boolean {
    const t = this.tournament();
    if (!t) return false;
    return this.authService.isOwner(t.ownerId);
  }

  getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'live' {
    const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'live'> = {
      active: 'live',
      registration: 'success',
      completed: 'info',
      draft: 'warning',
      cancelled: 'error',
    };
    return map[status] || 'info';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Live',
      registration: 'Registration Open',
      completed: 'Completed',
      draft: 'Draft',
      cancelled: 'Cancelled',
    };
    return map[status] || status;
  }

  getCountryFlag(countryCode?: string): string {
    if (!countryCode) return '';
    const code = countryCode.toUpperCase();
    const offset = 0x1f1e6;
    return String.fromCodePoint(
      ...code.split('').map(c => offset + c.charCodeAt(0) - 65)
    );
  }
}
