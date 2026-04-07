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

const STATUS_BADGE_VARIANT: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'live'
> = {
  active: 'live',
  registration: 'success',
  completed: 'info',
  draft: 'warning',
  cancelled: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Live',
  registration: 'Registration Open',
  completed: 'Completed',
  draft: 'Draft',
  cancelled: 'Cancelled',
};

@Component({
  selector: 'chessops-tournament-manage',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background text-foreground px-6 py-8">
      @if (loading()) {
        <div class="py-20 text-center">
          <div
            class="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-muted-foreground">Loading tournament...</p>
        </div>
      } @else if (error()) {
        <div class="py-20 text-center">
          <h2 class="text-xl font-display font-bold text-error mb-2">Error</h2>
          <p class="text-muted-foreground mb-4">{{ error() }}</p>
          <a
            routerLink="/"
            class="inline-block px-5 py-2.5 bg-surface border border-border
                                   rounded-lg text-sm font-semibold hover:bg-surface-elevated
                                   transition-colors"
          >
            Back to Home
          </a>
        </div>
      } @else if (enrichedTournament(); as t) {
        <div class="max-w-4xl mx-auto space-y-8">
          <!-- Header -->
          <header class="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 class="text-2xl font-display font-bold text-primary mb-1">
                Manage Tournament
              </h1>
              <p class="text-muted-foreground">{{ t.name }}</p>
            </div>
            <div class="flex gap-2">
              <a
                [routerLink]="['/tournaments', t.id]"
                class="px-4 py-2 text-sm font-semibold text-foreground rounded-lg
                        hover:bg-surface transition-colors"
              >
                View Public Page
              </a>
              <a
                [routerLink]="['/tournaments', t.id, 'standings']"
                class="px-4 py-2 text-sm font-semibold bg-surface border border-border
                        rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Standings
              </a>
            </div>
          </header>

          <!-- Status Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              class="flex flex-col gap-2 p-4 bg-surface border border-border rounded-lg"
            >
              <span
                class="text-xs uppercase tracking-wider text-muted-foreground"
                >Status</span
              >
              <chessops-badge [variant]="t.badgeVariant">{{
                t.statusLabel
              }}</chessops-badge>
            </div>
            <div
              class="flex flex-col gap-2 p-4 bg-surface border border-border rounded-lg"
            >
              <span
                class="text-xs uppercase tracking-wider text-muted-foreground"
                >Players</span
              >
              <span class="text-xl font-semibold font-display text-foreground">
                {{ t._count?.players || 0 }} / {{ t.maxPlayers || '∞' }}
              </span>
            </div>
            <div
              class="flex flex-col gap-2 p-4 bg-surface border border-border rounded-lg"
            >
              <span
                class="text-xs uppercase tracking-wider text-muted-foreground"
                >Rounds</span
              >
              <span class="text-xl font-semibold font-display text-foreground">
                {{ t._count?.rounds || 0 }} / {{ t.maxRounds }}
              </span>
            </div>
            <div
              class="flex flex-col gap-2 p-4 bg-surface border border-border rounded-lg"
            >
              <span
                class="text-xs uppercase tracking-wider text-muted-foreground"
                >Format</span
              >
              <span
                class="text-xl font-semibold font-display text-foreground capitalize"
              >
                {{ t.format }}
              </span>
            </div>
          </div>

          <!-- Quick Actions -->
          <section>
            <h2 class="text-lg font-display font-bold text-primary mb-4">
              Quick Actions
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (action of actions; track action.label) {
                <button
                  (click)="action.handler()"
                  class="flex flex-col items-center gap-3 p-6 bg-surface border border-border
                         rounded-xl cursor-pointer transition-all duration-150
                         hover:border-accent hover:bg-surface-elevated hover:-translate-y-0.5"
                >
                  <span class="text-3xl">{{ action.icon }}</span>
                  <span class="text-sm font-semibold text-foreground">{{
                    action.label
                  }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Tournament Settings -->
          <section>
            <h2 class="text-lg font-display font-bold text-primary mb-4">
              Tournament Settings
            </h2>
            <chessops-card>
              <div class="divide-y divide-border">
                <div class="flex justify-between items-center py-4">
                  <span class="font-medium text-foreground">Registration</span>
                  <span class="text-muted-foreground text-sm">{{
                    t.registrationOpen ? 'Open' : 'Closed'
                  }}</span>
                  <button
                    (click)="toggleRegistration()"
                    class="px-3 py-1.5 text-xs font-semibold bg-surface border border-border
                           rounded-md hover:bg-surface-elevated transition-colors"
                  >
                    {{ t.registrationOpen ? 'Close' : 'Open' }} Registration
                  </button>
                </div>
                <div class="flex justify-between items-center py-4">
                  <span class="font-medium text-foreground">Visibility</span>
                  <span class="text-muted-foreground text-sm">{{
                    t.isPublic ? 'Public' : 'Private'
                  }}</span>
                  <button
                    (click)="toggleVisibility()"
                    class="px-3 py-1.5 text-xs font-semibold bg-surface border border-border
                           rounded-md hover:bg-surface-elevated transition-colors"
                  >
                    Make {{ t.isPublic ? 'Private' : 'Public' }}
                  </button>
                </div>
              </div>
            </chessops-card>
          </section>

          <!-- Danger Zone -->
          <section>
            <h2 class="text-lg font-display font-bold text-error mb-4">
              Danger Zone
            </h2>
            <chessops-card>
              <p class="text-muted-foreground mb-4">
                Once you delete a tournament, there is no going back. Please be
                certain.
              </p>
              <button
                (click)="deleteTournament()"
                class="px-5 py-2.5 bg-error text-primary-foreground text-sm font-semibold
                       rounded-lg hover:bg-error/90 transition-colors"
              >
                Delete Tournament
              </button>
            </chessops-card>
          </section>
        </div>
      }
    </div>
  `,
})
export class TournamentManageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tournamentService = inject(TournamentService);

  tournament = signal<Tournament | null>(null);
  loading = signal(false);
  error = signal('');

  enrichedTournament = computed(() => {
    const t = this.tournament();
    if (!t) return null;
    return {
      ...t,
      badgeVariant: STATUS_BADGE_VARIANT[t.status] ?? 'info',
      statusLabel: STATUS_LABEL[t.status] ?? t.status,
    };
  });

  actions = [
    {
      icon: '👥',
      label: 'Manage Players',
      handler: () => this.navigateToPlayers(),
    },
    {
      icon: '📋',
      label: 'Create Round',
      handler: () => this.navigateToRounds(),
    },
    {
      icon: '⚔️',
      label: 'Generate Pairings',
      handler: () => this.navigateToPairings(),
    },
    {
      icon: '📊',
      label: 'Submit Results',
      handler: () => this.navigateToResults(),
    },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadTournament(id);
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

  private navigateToPlayers(): void {
    const id = this.tournament()?.id;
    if (id) this.router.navigate(['/tournaments', id, 'players']);
  }

  private navigateToRounds(): void {
    const id = this.tournament()?.id;
    if (id) this.router.navigate(['/tournaments', id, 'rounds']);
  }

  private navigateToPairings(): void {
    const id = this.tournament()?.id;
    if (id) this.router.navigate(['/tournaments', id, 'pairings']);
  }

  private navigateToResults(): void {
    const id = this.tournament()?.id;
    if (id) this.router.navigate(['/tournaments', id, 'results']);
  }

  async toggleRegistration(): Promise<void> {
    const t = this.tournament();
    if (!t) return;
    try {
      await this.tournamentService.updateTournament(t.id, {
        registrationOpen: !t.registrationOpen,
      });
      this.tournament.update((prev) =>
        prev ? { ...prev, registrationOpen: !prev.registrationOpen } : null,
      );
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
      this.tournament.update((prev) =>
        prev ? { ...prev, isPublic: !prev.isPublic } : null,
      );
    } catch (e) {
      console.error('Failed to toggle visibility', e);
    }
  }

  async deleteTournament(): Promise<void> {
    const t = this.tournament();
    if (!t) return;
    if (
      !confirm(
        'Are you sure you want to delete this tournament? This cannot be undone.',
      )
    )
      return;
    try {
      await this.tournamentService.deleteTournament(t.id);
      this.router.navigate(['/']);
    } catch (e) {
      console.error('Failed to delete tournament', e);
    }
  }
}
