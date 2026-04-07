import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import {
  TournamentService,
  type CreateTournamentDto,
} from '../../services/tournament.service';
import { InputComponent } from '@chessops/ui/input';
import { SelectComponent, type SelectOption } from '@chessops/ui/select';
import { CardComponent } from '@chessops/ui/card';

const COUNTRY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select a country' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'RU', label: 'Russia' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'HU', label: 'Hungary' },
  { value: 'RO', label: 'Romania' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'GR', label: 'Greece' },
  { value: 'TR', label: 'Turkey' },
  { value: 'IL', label: 'Israel' },
  { value: 'EG', label: 'Egypt' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'KE', label: 'Kenya' },
  { value: 'MX', label: 'Mexico' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'OTHER', label: 'Other' },
];

const FORMAT_OPTIONS: SelectOption[] = [
  { value: 'swiss', label: 'Swiss System' },
  { value: 'roundrobin', label: 'Round Robin' },
  { value: 'elimination', label: 'Single Elimination' },
];

@Component({
  selector: 'chessops-tournament-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormField,
    InputComponent,
    SelectComponent,
    CardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen bg-background text-foreground px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
    >
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <header
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div>
            <h1
              class="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-primary mb-1"
            >
              Create Tournament
            </h1>
            <p class="text-sm sm:text-base text-muted-foreground">
              Set up a new chess tournament
            </p>
          </div>
          <a
            routerLink="/"
            class="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-foreground rounded-lg
                    hover:bg-surface transition-colors text-center"
          >
            Cancel
          </a>
        </header>

        <chessops-card class="block">
          <form
            (submit)="$event.preventDefault(); onSubmit()"
            class="space-y-6 sm:space-y-8"
          >
            <!-- Basic Information -->
            <section class="space-y-3 sm:space-y-4">
              <h2
                class="text-sm sm:text-base font-display font-bold text-primary pb-2 border-b border-border"
              >
                Basic Information
              </h2>
              <chessops-input
                label="Tournament Name"
                placeholder="e.g., Spring Championship 2024"
                [formField]="tournamentForm.name"
              />
              <chessops-input
                label="Description"
                placeholder="Brief description"
                [formField]="tournamentForm.description"
              />
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <chessops-select
                  label="Country"
                  [options]="countryOptions"
                  [formField]="tournamentForm.country"
                />
                <chessops-input
                  label="Location"
                  [formField]="tournamentForm.location"
                />
              </div>
            </section>

            <!-- Dates -->
            <section class="space-y-3 sm:space-y-4">
              <h2
                class="text-sm sm:text-base font-display font-bold text-primary pb-2 border-b border-border"
              >
                Dates
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <chessops-input
                  label="Start Date"
                  type="date"
                  [formField]="tournamentForm.startDate"
                />
                <chessops-input
                  label="End Date"
                  type="date"
                  [formField]="tournamentForm.endDate"
                />
              </div>
            </section>

            <!-- Format -->
            <section class="space-y-3 sm:space-y-4">
              <h2
                class="text-sm sm:text-base font-display font-bold text-primary pb-2 border-b border-border"
              >
                Format
              </h2>
              <chessops-select
                label="Tournament Format"
                [options]="formatOptions"
                [formField]="tournamentForm.format"
              />
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <chessops-input
                  label="Max Rounds"
                  type="number"
                  [formField]="tournamentForm.maxRounds"
                />
                <chessops-input
                  label="Time Control"
                  [formField]="tournamentForm.timeControl"
                />
              </div>
            </section>

            <!-- Settings -->
            <section class="space-y-3 sm:space-y-4">
              <h2
                class="text-sm sm:text-base font-display font-bold text-primary pb-2 border-b border-border"
              >
                Settings
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <chessops-input
                  label="Max Players"
                  type="number"
                  [formField]="tournamentForm.maxPlayers"
                />
              </div>
              <div class="flex flex-col gap-2 sm:gap-3 pt-1">
                <label class="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    [formField]="tournamentForm.isPublic"
                    class="w-4 h-4 rounded border-border accent-accent cursor-pointer"
                  />
                  <span class="text-sm font-body text-foreground"
                    >Public tournament</span
                  >
                </label>
                <label class="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    [formField]="tournamentForm.registrationOpen"
                    class="w-4 h-4 rounded border-border accent-accent cursor-pointer"
                  />
                  <span class="text-sm font-body text-foreground"
                    >Registration open</span
                  >
                </label>
              </div>
            </section>

            <!-- Actions -->
            <div class="flex flex-col gap-2 sm:gap-3 pt-2">
              @if (error()) {
                <p class="text-xs sm:text-sm text-error">{{ error() }}</p>
              }
              <button
                type="submit"
                [disabled]="
                  submitting() ||
                  tournamentForm.name().invalid() ||
                  tournamentForm.startDate().invalid()
                "
                class="w-full py-2.5 sm:py-3 px-4 bg-primary hover:bg-primary-hover text-primary-foreground
                       font-display font-bold rounded-lg transition-colors text-sm sm:text-base
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ submitting() ? 'Creating...' : 'Create Tournament' }}
              </button>
            </div>
          </form>
        </chessops-card>
      </div>
    </div>
  `,
  styles: [
    `
      /* Additional responsive styles */
      @media (max-width: 640px) {
        :host {
          display: block;
        }

        input,
        select,
        button {
          font-size: 16px; /* Prevents zoom on mobile devices */
        }
      }

      /* Smooth transitions for responsive changes */
      chessops-card {
        transition: all 0.2s ease-in-out;
      }

      /* Improve touch targets on mobile */
      @media (max-width: 640px) {
        label,
        button,
        a,
        input[type='checkbox'] {
          min-height: 44px;
        }

        input[type='checkbox'] {
          min-height: auto;
        }
      }
    `,
  ],
})
export class TournamentCreateComponent {
  private tournamentService = inject(TournamentService);
  private router = inject(Router);

  protected tournamentModel = signal<CreateTournamentDto>({
    name: '',
    description: '',
    country: '',
    location: '',
    startDate: '',
    endDate: '',
    format: 'swiss',
    maxRounds: 9,
    timeControl: '',
    maxPlayers: null,
    isPublic: true,
    registrationOpen: true,
    countryName: '',
  });

  protected tournamentForm = form(this.tournamentModel, (schema) => {
    required(schema.name);
    required(schema.startDate);
  });

  protected countryOptions = COUNTRY_OPTIONS;
  protected formatOptions = FORMAT_OPTIONS;
  protected submitting = signal(false);
  protected error = signal('');

  async onSubmit(): Promise<void> {
    if (
      this.tournamentForm.name().invalid() ||
      this.tournamentForm.startDate().invalid()
    ) {
      this.error.set('Please fill in required fields');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      const currentData = this.tournamentModel();
      const countryOption = COUNTRY_OPTIONS.find(
        (o) => o.value === currentData.country,
      );
      const data: CreateTournamentDto = {
        ...currentData,
        countryName: countryOption?.label || '',
      };
      const tournament = await this.tournamentService.createTournament(data);
      this.router.navigate(['/tournaments', tournament.id]);
    } catch (e) {
      this.error.set('Failed to create tournament.');
    } finally {
      this.submitting.set(false);
    }
  }
}
