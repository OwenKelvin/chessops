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
  live: 'bg-error text-primary-foreground animate-pulse',
  active: 'bg-error text-primary-foreground animate-pulse',
  registration: 'bg-success-light text-success',
  completed: 'bg-surface-elevated text-muted border border-border-light',
  draft: 'bg-warning-light text-warning',
  cancelled: 'bg-surface-elevated text-muted border border-border-light',
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
    <div class="min-h-screen bg-background text-foreground font-body">
      <!-- Hero -->
      <section class="text-center py-12 px-6 bg-surface border-b border-border">
        <h1 class="text-4xl font-bold mb-2 text-primary font-display">
          Chess Tournament Results
        </h1>
        <p class="text-lg text-muted mb-6">
          Browse and manage chess tournaments from around the world
        </p>
        <div class="flex justify-center">
          <a
            routerLink="/tournaments/create"
            class="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-lg transition-colors font-display"
          >
            Create Tournament
          </a>
        </div>
      </section>

      <!-- Filters -->
      <section class="p-6 bg-surface border-b border-border sticky top-0 z-10">
        <div class="max-w-7xl mx-auto flex flex-wrap gap-4">
          <div class="flex-1 min-w-[240px]">
            <chessops-input
              type="search"
              placeholder="Search tournaments..."
              [formField]="filterForm.search"
            />
          </div>
          <div class="flex-1 min-w-[180px]">
            <chessops-select
              [options]="countries()"
              [formField]="filterForm.country"
            />
          </div>
          <div class="flex-1 min-w-[180px]">
            <chessops-select
              [options]="statusOptions"
              [formField]="filterForm.status"
            />
          </div>
          <div class="flex-1 min-w-[180px]">
            <chessops-select
              [options]="formatOptions"
              [formField]="filterForm.format"
            />
          </div>
        </div>
      </section>

      <!-- Tournament Grid -->
      <section class="p-6 max-w-7xl mx-auto">
        @if (loading()) {
          <div class="py-20 text-center">
            <div
              class="w-10 h-10 border-4 border-border-light border-t-accent rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p class="text-muted-foreground">Loading tournaments...</p>
          </div>
        } @else if (error()) {
          <div class="py-20 text-center text-error">
            <p>{{ error() }}</p>
          </div>
        } @else if (tournaments().length === 0) {
          <div class="py-20 text-center">
            <h3 class="text-xl font-semibold mb-2 font-display">
              No tournaments found
            </h3>
            <p class="text-muted-foreground">
              Try adjusting your filters or create a new tournament
            </p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (tournament of enrichedTournaments(); track tournament.id) {
              <a
                [routerLink]="['/tournaments', tournament.id]"
                class="block p-5 bg-surface border border-border-light rounded-xl
                hover:border-accent hover:-translate-y-1 transition-all duration-200"
              >
                <div class="flex justify-between items-center mb-3">
                  <span
                    [class]="
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ' +
                      tournament.statusClass
                    "
                  >
                    {{ tournament.statusLabel }}
                  </span>
                  @if (tournament.format) {
                    <span class="text-xs text-muted-foreground capitalize">{{
                      tournament.format
                    }}</span>
                  }
                </div>

                <h3 class="text-lg font-bold mb-2 font-display text-primary">
                  {{ tournament.name }}
                </h3>

                <p class="text-sm text-muted mb-4 flex items-center gap-1.5">
                  @if (tournament.country) {
                    <span>{{ getCountryFlag(tournament.country) }}</span>
                  }
                  {{ tournament.countryName || tournament.location }}
                </p>

                <div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <!-- date + players icons unchanged -->
                </div>
              </a>
            }
          </div>

          @if (totalPages() > 1) {
            <div
              class="mt-8 pt-8 border-t border-border-light flex justify-center"
            >
              <chessops-pagination
                [currentPage]="currentPage()"
                [totalPages]="totalPages()"
                (pageChange)="currentPage.set($event)"
              />
            </div>
          }
        }
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private tournamentService = inject(TournamentService);
  private http = inject(HttpClient);
  private backendUrl = injectBackendUrl();

  protected countriesResource = resource({
    loader: async () =>{
      return await lastValueFrom(
        this.http.get<Country[]>('api/countries'),
      );
    },
    defaultValue: [],
  });

  countries = computed<SelectOption[]>(() => {
    const countries = this.countriesResource.value() ?? [];
    console.log({ countries });
    console.log(countries);
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

  // Options
  statusOptions = STATUS_OPTIONS;
  formatOptions = FORMAT_OPTIONS;

  currentPage = signal(1);
  pageSize = 12;

  // Computed
  totalPages = computed(() =>
    Math.ceil(this.tournamentService.total() / this.pageSize),
  );

  tournaments = this.tournamentService.tournaments;

  enrichedTournaments = computed(() =>
    this.tournamentService.tournaments().map((t) => ({
      ...t,
      statusClass: STATUS_CLASSES[t.status] ?? 'bg-warning-light text-warning',
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
    // Sync filters + page into service whenever they change
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

    // Reset to page 1 when filters change (not page itself)
    effect(() => {
      this.filterModel();
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {}

  getStatusClass(status: string): string {
    const maps: Record<string, string> = {
      live: 'bg-error text-primary-foreground animate-pulse',
      active: 'bg-error text-primary-foreground animate-pulse',
      registration: 'bg-success-light text-success',
      completed: 'bg-surface-elevated text-muted border border-border-light',
      draft: 'bg-warning-light text-warning',
    };
    return maps[status] || maps['draft'];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      live: 'Live',
      active: 'Live',
      registration: 'Registration',
      completed: 'Completed',
      draft: 'Draft',
    };
    return map[status] || status;
  }

  getCountryFlag(countryCode?: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(char.charCodeAt(0) + 127397),
      );
  }
}
