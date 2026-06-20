import {
  Component,
  OnInit,
  inject,
  signal,
  effect,
  computed,
  ChangeDetectionStrategy,
  resource,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { HttpClient } from '@angular/common/http';
import {
  TournamentService,
  type Tournament,
} from '../../services/tournament.service';
import { PaginationComponent } from '@chessops/ui/pagination';
import { InputComponent } from '@chessops/ui/input';
import { SelectComponent, type SelectOption } from '@chessops/ui/select';
import { injectBackendUrl } from '@chessops/core/providers';
import { lastValueFrom } from 'rxjs';

interface Country {
  id: string;
  name: string;
  code: string;
  dialCode?: string;
  flagEmoji?: string;
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'registration', label: 'Registration Open' },
  { value: 'active', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Draft' },
];

const FORMAT_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Formats' },
  { value: 'swiss', label: 'Swiss' },
  { value: 'roundrobin', label: 'Round Robin' },
  { value: 'elimination', label: 'Elimination' },
];

const STATUS_CLASSES: Record<string, string> = {
  live: 'badge-live',
  active: 'badge-live',
  registration: 'badge-success',
  completed: 'badge-default',
  draft: 'badge-warning',
  cancelled: 'badge-default',
};

const STATUS_LABELS: Record<string, string> = {
  live: 'Live',
  active: 'Live',
  registration: 'Registration',
  completed: 'Completed',
  draft: 'Draft',
  cancelled: 'Cancelled',
};

interface FilterModel {
  search: string;
  country: string;
  status: string;
  format: string;
}

@Component({
  selector: 'chessops-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormField,
    PaginationComponent,
    InputComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home-page">
      <!-- Splash Hero -->
      <section class="hero">
        <div class="hero-content">
          <p class="hero-eyebrow">Chess Tournament Platform</p>
          <h1 class="hero-title">
            <span class="hero-title__gradient">Organize.</span>
            Pair.
            <span class="hero-title__gradient">Champion.</span>
          </h1>
          <p class="hero-subtitle">
            A modern arena for chess tournaments — from registration to final standings.
          </p>
          <div class="hero-actions">
            <a routerLink="/tournaments/create" class="btn btn-primary btn-lg">
              Create Tournament
            </a>
            <a routerLink="/docs/api" class="btn btn-ghost btn-lg">
              Explore API
            </a>
          </div>
        </div>

        <div class="hero-chess-pieces" aria-hidden="true">
          <span class="piece piece--king">♔</span>
          <span class="piece piece--queen">♕</span>
          <span class="piece piece--rook">♖</span>
          <span class="piece piece--knight">♘</span>
        </div>

        <div class="hero-scroll" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </section>

      <!-- Filters -->
      <section class="filter-bar">
        <div class="filter-bar__content">
          <div class="filter-field">
            <chessops-input
              type="search"
              placeholder="Search tournaments..."
              [formField]="filterForm.search"
            />
          </div>
          <div class="filter-field">
            <chessops-select [options]="countries()" [formField]="filterForm.country" />
          </div>
          <div class="filter-field">
            <chessops-select [options]="statusOptions" [formField]="filterForm.status" />
          </div>
          <div class="filter-field">
            <chessops-select [options]="formatOptions" [formField]="filterForm.format" />
          </div>
        </div>
      </section>

      <!-- Tournament Grid -->
      <section class="tournament-section">
        <div class="tournament-section__inner">
          @if (loading()) {
            <div class="loading-state">
              <div class="loading-state__spinner"></div>
              <p class="loading-state__text">Loading tournaments...</p>
            </div>
          } @else if (error()) {
            <div class="empty-state">
              <p class="empty-state__message empty-state__message--error">{{ error() }}</p>
            </div>
          } @else if (tournaments().length === 0) {
            <div class="empty-state">
              <h3 class="empty-state__title">No tournaments found</h3>
              <p class="empty-state__text">Try adjusting your filters or create a new tournament.</p>
            </div>
          } @else {
            <div class="tournament-grid">
              @for (tournament of enrichedTournaments(); track tournament.id) {
                <a
                  [routerLink]="['/tournaments', tournament.id]"
                  class="tournament-card"
                >
                  <div class="tournament-card__header">
                    <span [class]="'tournament-card__badge ' + tournament.statusClass">
                      {{ tournament.statusLabel }}
                    </span>
                    @if (tournament.format) {
                      <span class="tournament-card__format">{{ tournament.format }}</span>
                    }
                  </div>

                  <h3 class="tournament-card__title">{{ tournament.name }}</h3>

                  <p class="tournament-card__location">
                    @if (tournament.country) {
                      <span>{{ getCountryFlag(tournament.country) }}</span>
                    }
                    {{ tournament.countryName || tournament.location || 'Online' }}
                  </p>

                  <div class="tournament-card__meta">
                    <span>{{ tournament.startDate | date: 'mediumDate' }}</span>
                    <span>{{ tournament.maxPlayers ?? 'Unlimited' }} players</span>
                  </div>
                </a>
              }
            </div>

            @if (totalPages() > 1) {
              <div class="pagination-wrapper">
                <chessops-pagination
                  [currentPage]="currentPage()"
                  [totalPages]="totalPages()"
                  (pageChange)="currentPage.set($event)"
                />
              </div>
            }
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .home-page {
      position: relative;
      z-index: 1;
    }

    .hero {
      position: relative;
      min-height: 80vh;
      display: grid;
      place-items: center;
      padding: 6rem 1.5rem 8rem;
      text-align: center;
      overflow: hidden;
    }

    .hero-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-eyebrow {
      display: inline-block;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-accent);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      margin-bottom: 1.5rem;
      backdrop-filter: blur(8px);
    }

    .hero-title {
      font-size: clamp(2.5rem, 7vw, 5rem);
      line-height: 1.05;
      margin: 0 0 1.25rem;
      color: var(--color-foreground);
    }

    .hero-title__gradient {
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .hero-subtitle {
      font-size: clamp(1.1rem, 2vw, 1.35rem);
      color: var(--color-muted);
      max-width: 560px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
    }

    .btn-lg {
      padding: 0.875rem 1.75rem;
      font-size: 1rem;
    }

    .hero-chess-pieces {
      position: absolute;
      inset: 0;
      pointer-events: none;
      user-select: none;
      overflow: hidden;
    }

    .piece {
      position: absolute;
      font-size: clamp(4rem, 10vw, 9rem);
      line-height: 1;
      opacity: 0.08;
      color: var(--color-foreground);
      filter: blur(1px);
      animation: piece-float 20s ease-in-out infinite;
    }

    .piece--king {
      top: 15%;
      left: 8%;
      animation-delay: 0s;
    }

    .piece--queen {
      top: 20%;
      right: 10%;
      animation-delay: -5s;
    }

    .piece--rook {
      bottom: 20%;
      left: 12%;
      animation-delay: -10s;
    }

    .piece--knight {
      bottom: 18%;
      right: 8%;
      animation-delay: -15s;
    }

    @keyframes piece-float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-18px) rotate(3deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .piece {
        animation: none;
      }
    }

    .hero-scroll {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      color: var(--color-muted);
      animation: scroll-bounce 2s ease-in-out infinite;
    }

    @keyframes scroll-bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(8px); }
    }

    .filter-bar {
      position: sticky;
      top: 4.5rem;
      z-index: 50;
      padding: 1rem 1.5rem;
      background: color-mix(in srgb, var(--color-surface), transparent 25%);
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .filter-bar__content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .filter-field {
      min-width: 0;
    }

    .tournament-section {
      padding: 3rem 1.5rem 5rem;
    }

    .tournament-section__inner {
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-state,
    .empty-state {
      padding: 5rem 1rem;
      text-align: center;
    }

    .loading-state__spinner {
      width: 2.75rem;
      height: 2.75rem;
      border: 3px solid var(--color-border-light);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state__text,
    .empty-state__text {
      color: var(--color-muted);
    }

    .empty-state__title {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: var(--color-foreground);
    }

    .empty-state__message--error {
      color: var(--color-error);
    }

    .tournament-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .tournament-card {
      display: block;
      padding: 1.5rem;
      border-radius: 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .tournament-card:hover {
      transform: translateY(-4px);
      border-color: var(--color-primary);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--color-border-light);
    }

    .tournament-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .tournament-card__badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-live {
      background: var(--color-error-light);
      color: var(--color-error);
      animation: pulse 2s infinite;
    }

    .badge-success {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .badge-warning {
      background: var(--color-warning-light);
      color: var(--color-warning);
    }

    .badge-default {
      background: var(--color-info-light);
      color: var(--color-info);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.65; }
    }

    .tournament-card__format {
      font-size: 0.75rem;
      color: var(--color-muted);
      text-transform: capitalize;
    }

    .tournament-card__title {
      font-size: 1.25rem;
      margin: 0 0 0.5rem;
      color: var(--color-foreground);
      line-height: 1.3;
    }

    .tournament-card__location {
      font-size: 0.875rem;
      color: var(--color-muted);
      margin: 0 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .tournament-card__meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      border-top: 1px solid var(--color-border-light);
      padding-top: 0.875rem;
    }

    .pagination-wrapper {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--color-border-light);
      display: flex;
      justify-content: center;
    }
  `,
})
export class HomeComponent implements OnInit {
  private tournamentService = inject(TournamentService);
  private http = inject(HttpClient);
  private backendUrl = injectBackendUrl();

  protected countriesResource = resource({
    loader: async () => {
      return await lastValueFrom(this.http.get<Country[]>('api/countries'));
    },
    defaultValue: [],
  });

  countries = computed<SelectOption[]>(() => {
    const countries = this.countriesResource.value() ?? [];
    return [
      { value: '', label: 'All Countries' },
      ...countries.map((c) => ({
        value: c.code,
        label: `${c.flagEmoji ?? ''} ${c.name}`.trim(),
      })),
    ];
  });

  filterModel = signal<FilterModel>({
    search: '',
    country: '',
    status: '',
    format: '',
  });

  filterForm = form(this.filterModel);

  statusOptions = STATUS_OPTIONS;
  formatOptions = FORMAT_OPTIONS;

  currentPage = signal(1);
  pageSize = 12;

  totalPages = computed(() =>
    Math.ceil(this.tournamentService.total() / this.pageSize),
  );

  tournaments = this.tournamentService.tournaments;

  enrichedTournaments = computed(() =>
    this.tournamentService.tournaments().map((t) => ({
      ...t,
      statusClass: STATUS_CLASSES[t.status] ?? 'badge-warning',
      statusLabel: STATUS_LABELS[t.status] ?? t.status,
    })),
  );

  loading = computed(() =>
    this.tournamentService.tournamentsResource.isLoading(),
  );

  error = computed(() =>
    this.tournamentService.error() ? 'Failed to load tournaments.' : '',
  );

  constructor() {
    effect(() => {
      const filters = this.filterModel();
      this.tournamentService.setFilters({
        country: filters.country || undefined,
        status: filters.status || undefined,
        format: filters.format || undefined,
        search: filters.search || undefined,
        page: this.currentPage(),
        limit: this.pageSize,
      });
    });

    effect(() => {
      this.filterModel();
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {}

  getCountryFlag(countryCode?: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(char.charCodeAt(0) + 127397),
      );
  }
}
