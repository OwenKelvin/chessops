import {
  Component,
  OnInit,
  inject,
  signal,
  effect,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import {
  TournamentService,
  type Tournament,
} from '../../services/tournament.service';
import { PaginationComponent } from '@chessops/ui/pagination';
import { InputComponent } from '@chessops/ui/input';
import { SelectComponent, type SelectOption } from '@chessops/ui/select';

const COUNTRIES: SelectOption[] = [
  { value: '', label: 'All Countries' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'KE', label: 'Kenya' },
  { value: 'OTHER', label: 'Other' },
];

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
    <div
      class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
    >
      <section
        class="text-center py-12 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
      >
        <h1 class="text-4xl font-bold mb-2 text-primary">
          Chess Tournament Results
        </h1>
        <p class="text-lg text-slate-500 dark:text-slate-400 mb-6">
          Browse and manage chess tournaments from around the world
        </p>
        <div class="flex justify-center">
          <a
            routerLink="/tournaments/create"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Create Tournament
          </a>
        </div>
      </section>

      <section
        class="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10"
      >
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
              [options]="countries"
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

      <section class="p-6 max-w-7xl mx-auto">
        @if (loading()) {
          <div class="py-20 text-center">
            <div
              class="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p class="text-slate-500">Loading tournaments...</p>
          </div>
        } @else if (error()) {
          <div class="py-20 text-center text-red-500">
            <p>{{ error() }}</p>
          </div>
        } @else if (tournaments().length === 0) {
          <div class="py-20 text-center">
            <h3 class="text-xl font-semibold mb-2">No tournaments found</h3>
            <p class="text-slate-500">
              Try adjusting your filters or create a new tournament
            </p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (tournament of tournaments(); track tournament.id) {
              <a
                [routerLink]="['/tournaments', tournament.id]"
                class="block p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div class="flex justify-between items-center mb-3">
                  <span
                    [class]="
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ' +
                      getStatusClass(tournament.status)
                    "
                  >
                    {{ getStatusLabel(tournament.status) }}
                  </span>
                  @if (tournament.format) {
                    <span class="text-xs text-slate-500 capitalize">{{
                      tournament.format
                    }}</span>
                  }
                </div>

                <h3 class="text-lg font-bold mb-2 group-hover:text-blue-600">
                  {{ tournament.name }}
                </h3>

                <p
                  class="text-sm text-slate-500 mb-4 flex items-center gap-1.5"
                >
                  @if (tournament.country) {
                    <span>{{ getCountryFlag(tournament.country) }}</span>
                  }
                  {{ tournament.countryName || tournament.location }}
                </p>

                <div class="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {{ tournament.startDate | date: 'MMM d, y' }}
                  </span>
                  @if (tournament._count?.players) {
                    <span class="flex items-center gap-1">
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      {{ tournament._count?.players }}
                    </span>
                  }
                </div>
              </a>
            }
          </div>

          @if (totalPages() > 1) {
            <div
              class="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-center"
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

  filterModel = signal<FilterModel>({
    search: '',
    country: '',
    status: '',
    format: '',
  });

  filterForm = form(this.filterModel);

  // Options
  countries = COUNTRIES;
  statusOptions = STATUS_OPTIONS;
  formatOptions = FORMAT_OPTIONS;

  currentPage = signal(1);
  pageSize = 12;

  // Computed
  totalPages = computed(() =>
    Math.ceil(this.tournamentService.total() / this.pageSize),
  );

  tournaments = this.tournamentService.tournaments;
  loading = computed(() =>
    this.tournamentService.tournamentsResource.isLoading(),
  );
  error = computed(() =>
    this.tournamentService.error() ? 'Failed to load tournaments.' : '',
  );

  constructor() {
    // Sync filters + page into service whenever they change
    effect(
      () => {
        const filters = this.filterModel();
        this.tournamentService.setFilters({
          country: filters.country || undefined,
          status: filters.status || undefined,
          format: filters.format || undefined,
          search: filters.search || undefined,
          page: this.currentPage(),
          limit: this.pageSize,
        });
      },
    );

    // Reset to page 1 when filters change (not page itself)
    effect(
      () => {
        this.filterModel();
        this.currentPage.set(1);
      },
    );
  }

  ngOnInit(): void {}

  getStatusClass(status: string): string {
    const maps: Record<string, string> = {
      live: 'bg-red-500 text-white animate-pulse',
      active: 'bg-red-500 text-white animate-pulse',
      registration:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed:
        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      draft:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
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
