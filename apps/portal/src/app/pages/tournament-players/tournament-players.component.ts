import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
  resource,
  model,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { injectBackendUrl } from '@chessops/core/providers';
import { NotificationService } from '../../services/notification.service';
import { InputComponent } from '@chessops/ui/input';
import { ButtonComponent } from '@chessops/ui/button';
import { CardComponent } from '@chessops/ui/card';
import { BadgeComponent } from '@chessops/ui/badge';
import { form, FormField } from '@angular/forms/signals';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  fideId?: string;
  rating?: number;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  countryName?: string;
  flagEmoji?: string;
}

interface TournamentPlayer {
  id: string;
  playerId: string;
  seed: number;
  rating?: number;
  status: 'active' | 'withdrawn' | 'expelled';
  withdrawRound?: number;
  player: Player;
}

interface Tournament {
  id: string;
  name: string;
  players?: TournamentPlayer[];
  maxPlayers?: number;
  registrationOpen: boolean;
}

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  active: 'success',
  withdrawn: 'warning',
  expelled: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  withdrawn: 'Withdrawn',
  expelled: 'Expelled',
};

@Component({
  selector: 'chessops-tournament-players',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    InputComponent,
    CardComponent,
    BadgeComponent,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background text-foreground px-6 py-8">
      @if (loading()) {
        <div class="py-20 text-center">
          <div
            class="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-muted-foreground">Loading players...</p>
        </div>
      } @else if (error()) {
        <div class="py-20 text-center">
          <h2 class="text-xl font-display font-bold text-error mb-2">Error</h2>
          <p class="text-muted-foreground mb-4">{{ error() }}</p>
          <a
            routerLink="/"
            class="inline-block px-5 py-2.5 bg-surface border border-border rounded-lg text-sm font-semibold hover:bg-surface-elevated transition-colors"
          >
            Back to Home
          </a>
        </div>
      } @else if (tournament(); as t) {
        <div class="max-w-6xl mx-auto space-y-8">
          <!-- Header -->
          <header class="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <a
                  [routerLink]="['/tournaments', t.id, 'manage']"
                  class="text-muted hover:text-primary transition-colors"
                >
                  ← Back to Manage
                </a>
              </div>
              <h1 class="text-2xl font-display font-bold text-primary">
                {{ t.name }}
              </h1>
              <p class="text-muted-foreground">
                Players
                @if (t.maxPlayers) {
                  <span>({{ playersCount() }} / {{ t.maxPlayers }})</span>
                }
              </p>
            </div>
            @if (t.registrationOpen) {
              <span
                class="px-3 py-1.5 bg-success-light text-success text-sm font-semibold rounded-full"
              >
                Registration Open
              </span>
            }
          </header>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Players List -->
            <div class="lg:col-span-2">
              <chessops-card>
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-lg font-display font-bold text-primary">
                    Registered Players
                  </h2>
                  <button
                    (click)="showAddPlayer.set(true)"
                    [disabled]="
                      !t.registrationOpen ||
                      (t.maxPlayers && playersCount() >= t.maxPlayers)
                    "
                    class="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Player
                  </button>
                </div>

                @if (players().length === 0) {
                  <div class="text-center py-12">
                    <div class="text-5xl mb-4">♟️</div>
                    <h3 class="text-lg font-semibold font-display mb-2">
                      No players yet
                    </h3>
                    <p class="text-muted-foreground mb-4">
                      Start by adding players to your tournament
                    </p>
                    <button
                      (click)="showAddPlayer.set(true)"
                      class="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
                    >
                      Add First Player
                    </button>
                  </div>
                } @else {
                  <div class="space-y-2">
                    @for (tp of players(); track tp.id) {
                      <div
                        class="flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-accent transition-colors"
                      >
                        <div class="flex items-center gap-4">
                          <span class="text-2xl">{{
                            getPlayerFlag(tp.player)
                          }}</span>
                          <div>
                            <h3
                              class="font-semibold font-display text-foreground"
                            >
                              {{ tp.player.firstName }} {{ tp.player.lastName }}
                            </h3>
                            <div
                              class="flex items-center gap-3 text-sm text-muted-foreground"
                            >
                              @if (tp.player.rating) {
                                <span>Rating: {{ tp.player.rating }}</span>
                              }
                              @if (tp.player.fideId) {
                                <span>FIDE: {{ tp.player.fideId }}</span>
                              }
                              <span>•</span>
                              <span>Seed: {{ tp.seed }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <chessops-badge
                            [variant]="STATUS_BADGE[tp.status] || 'info'"
                          >
                            {{ STATUS_LABEL[tp.status] || tp.status }}
                          </chessops-badge>
                          <button
                            (click)="removePlayer(tp.playerId)"
                            class="p-2 text-muted hover:text-error transition-colors"
                            title="Remove player"
                          >
                            <svg
                              class="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </chessops-card>
            </div>

            <!-- Add Player Panel -->
            @if (showAddPlayer()) {
              <div class="lg:col-span-1">
                <chessops-card>
                  <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-display font-bold text-primary">
                      Add Player
                    </h2>
                    <button
                      (click)="showAddPlayer.set(false)"
                      class="p-1 text-muted hover:text-foreground transition-colors"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div class="space-y-4">
                    <chessops-input
                      type="search"
                      placeholder="Search players..."
                      [formField]="searchForm.search"
                    />

                    @if (searching()) {
                      <p class="text-sm text-muted-foreground text-center py-4">
                        Searching...
                      </p>
                    } @else if (availablePlayers().length === 0) {
                      <p class="text-sm text-muted-foreground text-center py-4">
                        No players found. Create a player first.
                      </p>
                    } @else {
                      <div class="space-y-2 max-h-64 overflow-y-auto">
                        @for (player of availablePlayers(); track player.id) {
                          <button
                            (click)="addPlayer(player.id)"
                            [disabled]="isPlayerAdded(player.id)"
                            class="w-full flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-accent hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                          >
                            <span class="text-xl">{{
                              getFlag(player.country)
                            }}</span>
                            <div class="flex-1 min-w-0">
                              <p
                                class="font-semibold font-display text-foreground truncate"
                              >
                                {{ player.firstName }} {{ player.lastName }}
                              </p>
                              @if (player.rating) {
                                <p class="text-sm text-muted-foreground">
                                  Rating: {{ player.rating }}
                                </p>
                              }
                            </div>
                            <svg
                              class="w-5 h-5 text-accent flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        }
                      </div>
                    }

                    <a
                      [routerLink]="['/players', 'create']"
                      class="block w-full py-2.5 text-center text-sm font-semibold text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Create New Player
                    </a>
                  </div>
                </chessops-card>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TournamentPlayersComponent {
  STATUS_BADGE = STATUS_BADGE;
  STATUS_LABEL = STATUS_LABEL;
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private backendUrl = injectBackendUrl();
  private notification = inject(NotificationService);

  tournamentId = input<string | null>(null);
  tournament = signal<Tournament | null>(null);
  players = computed<TournamentPlayer[]>(
    () => this.tournament()?.players ?? [],
  );
  playersCount = computed(() => this.players().length);

  error = signal('');
  showAddPlayer = signal(false);

  searchModel = signal({ search: '' });
  searchForm = form(this.searchModel);
  searching = signal(false);

  allPlayers = signal<Player[]>([]);

  availablePlayers = computed(() => {
    const search = this.searchModel().search.toLowerCase();
    const addedIds = new Set(this.players().map((p) => p.playerId));
    return this.allPlayers().filter(
      (p) =>
        !addedIds.has(p.id) &&
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search),
    );
  });

  playersResource = resource({
    loader: async () => {
      const id = this.tournamentId();
      if (!id) return null;
      return await lastValueFrom(
        this.http.get<Tournament>(`${this.backendUrl}/api/tournaments/${id}`),
      );
    },
  });

  playersListResource = resource({
    loader: async () => {
      const id = this.tournamentId();
      if (!id) return [];
      return await lastValueFrom(
        this.http.get<Player[]>(`${this.backendUrl}/api/players`),
      );
    },
  });

  loading = computed(
    () =>
      this.playersResource.isLoading() || this.playersListResource.isLoading(),
  );

  constructor() {

    effect(() => {
      const data = this.playersResource.value();
      if (data) {
        this.tournament.set(data);
      }
    });

    effect(() => {
      const data = this.playersListResource.value();
      if (data) {
        this.allPlayers.set(data);
      }
    });

    effect(() => {
      this.searchModel();
      this.searching.set(true);
      const timer = setTimeout(() => this.searching.set(false), 300);
      return () => clearTimeout(timer);
    });
  }

  ngOnInit(): void {}

  getPlayerFlag(player: Player): string {
    if (!player.country || player.country.length !== 2) return '🏁';
    return player.country
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(char.charCodeAt(0) + 127397),
      );
  }

  getFlag(country?: string): string {
    if (!country || country.length !== 2) return '🌍';
    return country
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(char.charCodeAt(0) + 127397),
      );
  }

  isPlayerAdded(playerId: string): boolean {
    return this.players().some((p) => p.playerId === playerId);
  }

  async addPlayer(playerId: string): Promise<void> {
    const id = this.tournamentId();
    if (!id) return;

    const player = this.allPlayers().find((p) => p.id === playerId);
    try {
      await lastValueFrom(
        this.http.post<TournamentPlayer>(
          `${this.backendUrl}/api/tournaments/${id}/players`,
          { playerId, seed: this.playersCount() + 1, rating: player?.rating },
        ),
      );
      // Refresh tournament data
      this.playersResource.reload();
      this.notification.success('Player added to tournament.');
    } catch (e: any) {
      this.notification.error(e.error?.message || 'Failed to add player.');
      console.error('Failed to add player', e);
    }
  }

  async removePlayer(playerId: string): Promise<void> {
    const id = this.tournamentId();
    if (!id) return;
    if (!confirm('Remove this player from the tournament?')) return;

    try {
      await lastValueFrom(
        this.http.delete<void>(
          `${this.backendUrl}/api/tournaments/${id}/players/${playerId}`,
        ),
      );
      this.playersResource.reload();
      this.notification.success('Player removed from tournament.');
    } catch (e: any) {
      this.notification.error(e.error?.message || 'Failed to remove player.');
      console.error('Failed to remove player', e);
    }
  }
}
