import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  TournamentService,
  type Tournament,
} from '../../services/tournament.service';
import { BadgeComponent } from '@chessops/ui/badge';
import { CardComponent } from '@chessops/ui/card';

@Component({
  selector: 'chessops-tournament-manage',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="manage-page">
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
        <header class="page-header">
          <div>
            <h1>Manage Tournament</h1>
            <p class="tournament-name">{{ t.name }}</p>
          </div>
          <div class="header-actions">
            <a [routerLink]="['/tournaments', t.id]" class="btn btn-ghost">View Public Page</a>
            <a [routerLink]="['/tournaments', t.id, 'standings']" class="btn btn-secondary">Standings</a>
          </div>
        </header>

        <!-- Status Card -->
        <div class="status-grid">
          <div class="status-card">
            <span class="status-label">Status</span>
            <chessops-badge [variant]="getStatusBadgeVariant(t.status)">
              {{ getStatusLabel(t.status) }}
            </chessops-badge>
          </div>
          <div class="status-card">
            <span class="status-label">Players</span>
            <span class="status-value">{{ t._count?.players || 0 }} / {{ t.maxPlayers || '∞' }}</span>
          </div>
          <div class="status-card">
            <span class="status-label">Rounds</span>
            <span class="status-value">{{ t._count?.rounds || 0 }} / {{ t.maxRounds }}</span>
          </div>
          <div class="status-card">
            <span class="status-label">Format</span>
            <span class="status-value">{{ t.format | titlecase }}</span>
          </div>
        </div>

        <!-- Quick Actions -->
        <section class="actions-section">
          <h2>Quick Actions</h2>
          <div class="actions-grid">
            <button class="action-btn" (click)="navigateToPlayers()">
              <span class="action-icon">👥</span>
              <span class="action-label">Manage Players</span>
            </button>
            <button class="action-btn" (click)="navigateToRounds()">
              <span class="action-icon">📋</span>
              <span class="action-label">Create Round</span>
            </button>
            <button class="action-btn" (click)="navigateToPairings()">
              <span class="action-icon">⚔️</span>
              <span class="action-label">Generate Pairings</span>
            </button>
            <button class="action-btn" (click)="navigateToResults()">
              <span class="action-icon">📊</span>
              <span class="action-label">Submit Results</span>
            </button>
          </div>
        </section>

        <!-- Settings Section -->
        <section class="settings-section">
          <h2>Tournament Settings</h2>
          <chessops-card>
            <div class="settings-row">
              <span class="setting-label">Registration</span>
              <span class="setting-value">{{ t.registrationOpen ? 'Open' : 'Closed' }}</span>
              <button class="btn btn-sm btn-secondary" (click)="toggleRegistration()">
                {{ t.registrationOpen ? 'Close' : 'Open' }} Registration
              </button>
            </div>
            <div class="settings-row">
              <span class="setting-label">Visibility</span>
              <span class="setting-value">{{ t.isPublic ? 'Public' : 'Private' }}</span>
              <button class="btn btn-sm btn-secondary" (click)="toggleVisibility()">
                Make {{ t.isPublic ? 'Private' : 'Public' }}
              </button>
            </div>
          </chessops-card>
        </section>

        <!-- Danger Zone -->
        <section class="danger-section">
          <h2>Danger Zone</h2>
          <chessops-card>
            <p class="danger-description">Once you delete a tournament, there is no going back. Please be certain.</p>
            <button class="btn btn-danger" (click)="deleteTournament()">Delete Tournament</button>
          </chessops-card>
        </section>
      }
    </div>
  `,
  styles: `
    .manage-page {
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

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
      border: none;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .btn-secondary {
      background: var(--color-surface);
      color: var(--color-foreground);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-surface-elevated);
    }

    .btn-ghost {
      background: transparent;
      color: var(--color-foreground);
    }

    .btn-ghost:hover {
      background: var(--color-surface);
    }

    .btn-danger {
      background: var(--color-error);
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
    }

    /* Header */
    .page-header {
      max-width: 1000px;
      margin: 0 auto 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      margin: 0 0 0.25rem 0;
      color: var(--color-primary);
    }

    .tournament-name {
      color: var(--color-muted-foreground);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Status Grid */
    .status-grid {
      max-width: 1000px;
      margin: 0 auto 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .status-card {
      padding: 1rem 1.25rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .status-label {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-foreground);
    }

    /* Actions */
    .actions-section {
      max-width: 1000px;
      margin: 0 auto 2rem;
    }

    .actions-section h2 {
      font-size: 1.125rem;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      border-color: var(--color-accent);
      background: var(--color-surface-elevated);
      transform: translateY(-2px);
    }

    .action-icon {
      font-size: 2rem;
    }

    .action-label {
      font-weight: 600;
      color: var(--color-foreground);
    }

    /* Settings */
    .settings-section {
      max-width: 1000px;
      margin: 0 auto 2rem;
    }

    .settings-section h2 {
      font-size: 1.125rem;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    .settings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--color-border);
    }

    .settings-row:last-child {
      border-bottom: none;
    }

    .setting-label {
      font-weight: 500;
    }

    .setting-value {
      color: var(--color-muted-foreground);
    }

    /* Danger Zone */
    .danger-section {
      max-width: 1000px;
      margin: 0 auto;
    }

    .danger-section h2 {
      font-size: 1.125rem;
      margin-bottom: 1rem;
      color: var(--color-error);
    }

    .danger-description {
      color: var(--color-muted-foreground);
      margin-bottom: 1rem;
    }
  `,
})
export class TournamentManageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tournamentService = inject(TournamentService);

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

  navigateToPlayers(): void {
    const id = this.tournament()?.id;
    if (id) {
      this.router.navigate(['/tournaments', id, 'players']);
    }
  }

  navigateToRounds(): void {
    const id = this.tournament()?.id;
    if (id) {
      this.router.navigate(['/tournaments', id, 'rounds']);
    }
  }

  navigateToPairings(): void {
    const id = this.tournament()?.id;
    if (id) {
      this.router.navigate(['/tournaments', id, 'pairings']);
    }
  }

  navigateToResults(): void {
    const id = this.tournament()?.id;
    if (id) {
      this.router.navigate(['/tournaments', id, 'results']);
    }
  }

  async toggleRegistration(): Promise<void> {
    const t = this.tournament();
    if (!t) return;
    try {
      await this.tournamentService.updateTournament(t.id, {
        registrationOpen: !t.registrationOpen,
      });
      this.tournament.update((prev) => prev ? { ...prev, registrationOpen: !prev.registrationOpen } : null);
    } catch (e) {
      console.error('Failed to toggle registration', e);
    }
  }

  async toggleVisibility(): Promise<void> {
    const t = this.tournament();
    if (!t) return;
    try {
      await this.tournamentService.updateTournament(t.id, {
        isPublic: !t.isPublic,
      });
      this.tournament.update((prev) => prev ? { ...prev, isPublic: !prev.isPublic } : null);
    } catch (e) {
      console.error('Failed to toggle visibility', e);
    }
  }

  async deleteTournament(): Promise<void> {
    const t = this.tournament();
    if (!t) return;
    if (!confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
      return;
    }
    try {
      await this.tournamentService.deleteTournament(t.id);
      this.router.navigate(['/']);
    } catch (e) {
      console.error('Failed to delete tournament', e);
    }
  }
}
