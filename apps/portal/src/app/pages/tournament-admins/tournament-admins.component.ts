import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, map } from 'rxjs';
import { injectBackendUrl } from '@chessops/core/providers';
import { InputComponent } from '@chessops/ui/input';
import { CardComponent } from '@chessops/ui/card';
import { BadgeComponent } from '@chessops/ui/badge';
import { TournamentService, type TournamentAdmin, type TournamentPlayer } from '../../services/tournament.service';
import { NotificationService } from '../../services/notification.service';
import { form, FormField } from '@angular/forms/signals';

interface Tournament {
  id: string;
  name: string;
  ownerId: string;
  players?: TournamentPlayer[];
  maxPlayers?: number;
  registrationOpen: boolean;
}

@Component({
  selector: 'chessops-tournament-admins',
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
          <p class="text-muted-foreground">Loading admins...</p>
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
        <div class="max-w-4xl mx-auto space-y-8">
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
              <p class="text-muted-foreground">Tournament Administrators</p>
            </div>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Current Admins -->
            <chessops-card>
              <h2 class="text-lg font-display font-bold text-primary mb-6">
                Current Admins
              </h2>

              @if (admins().length === 0) {
                <div class="text-center py-12">
                  <div class="text-5xl mb-4">👑</div>
                  <h3 class="text-lg font-semibold font-display mb-2">
                    No admins yet
                  </h3>
                  <p class="text-muted-foreground">
                    Promote a player to admin to help manage the tournament
                  </p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (admin of admins(); track admin.id) {
                    <div
                      class="flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-accent transition-colors"
                    >
                      <div class="flex items-center gap-4">
                        <span class="text-2xl">🌍</span>
                        <div>
                          <h3
                            class="font-semibold font-display text-foreground"
                          >
                            {{ admin.player.firstName }}
                            {{ admin.player.lastName }}
                          </h3>
                          <div class="flex items-center gap-2 mt-1">
                            @if (admin.player.id === tournament()?.ownerId) {
                              <chessops-badge variant="info"
                                >Owner</chessops-badge
                              >
                            } @else {
                              <chessops-badge variant="success"
                                >Admin</chessops-badge
                              >
                            }
                          </div>
                        </div>
                      </div>
                      @if (admin.player.id !== tournament()?.ownerId) {
                        <button
                          (click)="revokeAdmin(admin.playerId)"
                          class="p-2 text-muted hover:text-error transition-colors"
                          title="Revoke admin"
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
                      }
                    </div>
                  }
                </div>
              }
            </chessops-card>

            <!-- Promote Player -->
            <chessops-card>
              <h2 class="text-lg font-display font-bold text-primary mb-6">
                Promote Player
              </h2>

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
                    No eligible players found
                  </p>
                } @else {
                  <div class="space-y-2 max-h-96 overflow-y-auto">
                    @for (player of availablePlayers(); track player.id) {
                      <div
                        class="flex items-center justify-between p-3 bg-surface border border-border rounded-lg hover:border-accent hover:bg-surface-elevated transition-colors"
                      >
                        <div class="flex items-center gap-3">
                          <span class="text-xl">🌍</span>
                          <div>
                            <p
                              class="font-semibold font-display text-foreground"
                            >
                              {{ player.player.firstName }}
                              {{ player.player.lastName }}
                            </p>
                            <p class="text-sm text-muted-foreground">
                              Seed: {{ player.seed }}
                              @if (player.rating) {
                                • Rating: {{ player.rating }}
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          (click)="assignAdmin(player.playerId)"
                          class="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
                        >
                          Promote
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </chessops-card>
          </div>
        </div>
      }
    </div>
  `,
})
export class TournamentAdminsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private tournamentService = inject(TournamentService);
  private backendUrl = injectBackendUrl();
  private notification = inject(NotificationService);

  private routeId = toSignal(this.route.paramMap.pipe(map((m) => m.get('id'))));

  tournamentId = signal<string | null>(null);
  tournament = signal<Tournament | null>(null);
  admins = signal<TournamentAdmin[]>([]);

  loading = signal(false);
  error = signal('');

  searchModel = signal({ search: '' });
  searchForm = form(this.searchModel);
  searching = signal(false);

  allPlayers = signal<TournamentPlayer[]>([]);

  availablePlayers = computed(() => {
    const search = this.searchModel().search.toLowerCase();
    const adminIds = new Set(this.admins().map((a) => a.playerId));
    return this.allPlayers().filter(
      (p) =>
        !adminIds.has(p.playerId) &&
        `${p.player.firstName} ${p.player.lastName}`
          .toLowerCase()
          .includes(search),
    );
  });

  tournamentResource = resource({
    loader: async () => {
      const id = this.tournamentId();
      if (!id) return null;
      return await lastValueFrom(
        this.http.get<Tournament>(`${this.backendUrl}/api/tournaments/${id}`),
      );
    },
  });

  adminsResource = resource({
    loader: async () => {
      const id = this.tournamentId();
      if (!id) return [];
      return await lastValueFrom(
        this.http.get<TournamentAdmin[]>(
          `${this.backendUrl}/api/tournaments/${id}/admins`,
        ),
      );
    },
  });

  playersResource = resource({
    loader: async () => {
      const id = this.tournamentId();
      if (!id) return [];
      return await lastValueFrom(
        this.http.get<{ players: TournamentPlayer[] }>(
          `${this.backendUrl}/api/tournaments/${id}`,
        ),
      ).then((res) => res.players ?? []);
    },
  });

  constructor() {
    effect(() => {
      const id = this.routeId();
      this.tournamentId.set(id ?? null);
    });

    effect(() => {
      const data = this.tournamentResource.value();
      if (data) {
        this.tournament.set(data);
      }
      this.loading.set(this.tournamentResource.isLoading());
    });

    effect(() => {
      const data = this.adminsResource.value();
      if (data) {
        this.admins.set(data);
      }
    });

    effect(() => {
      const err = this.tournamentResource.error();
      if (err) {
        this.error.set('Failed to load tournament');
        this.loading.set(false);
      }
    });

    effect(() => {
      const data = this.playersResource.value();
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

  ngOnInit(): void {
    this.loading.set(true);
  }

  async assignAdmin(playerId: string): Promise<void> {
    const id = this.tournamentId();
    if (!id) return;

    try {
      await lastValueFrom(
        this.http.post<void>(
          `${this.backendUrl}/api/tournaments/${id}/admins`,
          { playerId },
        ),
      );
      this.adminsResource.reload();
      this.playersResource.reload();
      this.notification.success('Admin assigned.');
    } catch (e: any) {
      const message = e.error?.message || 'Failed to assign admin';
      console.error('Failed to assign admin', e);
      this.error.set(message);
      this.notification.error(message);
    }
  }

  async revokeAdmin(playerId: string): Promise<void> {
    const id = this.tournamentId();
    if (!id) return;
    if (!confirm('Revoke admin privileges for this player?')) return;

    try {
      await lastValueFrom(
        this.http.delete<void>(
          `${this.backendUrl}/api/tournaments/${id}/admins/${playerId}`,
        ),
      );
      this.adminsResource.reload();
      this.playersResource.reload();
      this.notification.success('Admin privileges revoked.');
    } catch (e: any) {
      const message = e.error?.message || 'Failed to revoke admin';
      console.error('Failed to revoke admin', e);
      this.error.set(message);
      this.notification.error(message);
    }
  }
}
