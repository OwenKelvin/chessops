import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  resource,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FieldTree,
  form,
  FormField,
  FormRoot,
  required,
  TreeValidationResult,
} from '@angular/forms/signals';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { injectBackendUrl } from '@chessops/core/providers';
import { InputComponent } from '@chessops/ui/input';
import { SelectComponent, type SelectOption } from '@chessops/ui/select';
import { CardComponent } from '@chessops/ui/card';
import { NotificationService } from '../../services/notification.service';
import { FormErrorComponent } from '../../components/form-error/form-error.component';

interface Country {
  id: string;
  name: string;
  code: string;
  dialCode?: string;
  flagEmoji?: string;
}

interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  email: string;
  fideId: string;
  rating: number;
  dateOfBirth: string;
  gender: string;
  country: string;
}

@Component({
  selector: 'chessops-player-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormField,
    FormRoot,
    InputComponent,
    SelectComponent,
    CardComponent,
    FormErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background text-foreground px-6 py-8">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-primary mb-1">
              Create Player
            </h1>
            <p class="text-sm sm:text-base text-muted-foreground">
              Add a new chess player profile
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

        <chessops-card>
          <form [formRoot]="playerForm" class="space-y-6 sm:space-y-8">
            <!-- Personal Information -->
            <section class="space-y-3 sm:space-y-4">
              <h2 class="text-sm sm:text-base font-display font-bold text-primary pb-2 border-b border-border">
                Personal Information
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <chessops-input
                  label="First Name"
                  placeholder="e.g., Magnus"
                  [formField]="playerForm.firstName"
                />
                <chessops-input
                  label="Last Name"
                  placeholder="e.g., Carlsen"
                  [formField]="playerForm.lastName"
                />
              </div>
              <chessops-input
                label="Email"
                type="email"
                placeholder="optional"
                [formField]="playerForm.email"
              />
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <chessops-input
                  label="Date of Birth"
                  type="date"
                  [formField]="playerForm.dateOfBirth"
                />
                <chessops-select
                  label="Gender"
                  [options]="genderOptions"
                  [formField]="playerForm.gender"
                />
              </div>
            </section>

            <!-- Chess Information -->
            <section class="space-y-3 sm:space-y-4">
              <h2 class="text-sm sm:text-base font-display font-bold text-primary pb-2 border-b border-border">
                Chess Information
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <chessops-input
                  label="FIDE ID"
                  placeholder="optional"
                  [formField]="playerForm.fideId"
                />
                <chessops-input
                  label="Rating"
                  type="number"
                  placeholder="e.g., 2800"
                  [formField]="playerForm.rating"
                />
              </div>
              <chessops-select
                label="Country"
                [options]="countryOptions()"
                [formField]="playerForm.country"
              />
            </section>

            <!-- Actions -->
            <div class="flex flex-col gap-3 pt-2">
              <chessops-form-error [message]="playerForm().errors()[0]?.message" />
              <button
                type="submit"
                [disabled]="
                  submitting() ||
                  playerForm.firstName().invalid() ||
                  playerForm.lastName().invalid()
                "
                class="w-full py-2.5 sm:py-3 px-4 bg-primary hover:bg-primary-hover text-primary-foreground
                       font-display font-bold rounded-lg transition-colors text-sm sm:text-base
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ submitting() ? 'Creating...' : 'Create Player' }}
              </button>
            </div>
          </form>
        </chessops-card>
      </div>
    </div>
  `,
})
export class PlayerCreateComponent {
  private router = inject(Router);
  private http = inject(HttpClient);
  private backendUrl = injectBackendUrl();
  private notification = inject(NotificationService);

  protected countriesResource = resource({
    loader: () =>
      lastValueFrom(this.http.get<Country[]>(`${this.backendUrl}/api/countries`)),
    defaultValue: [],
  });

  protected countryOptions = computed<SelectOption[]>(() => {
    const countries: Country[] = this.countriesResource.value() ?? [];
    return [
      { value: '', label: 'Select a country (optional)' },
      ...countries.map((c: Country) => ({
        value: c.code,
        label: `${c.flagEmoji ?? ''} ${c.name}`.trim(),
      })),
    ];
  });

  protected genderOptions: SelectOption[] = [
    { value: '', label: 'Select gender (optional)' },
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
  ];

  protected playerModel = signal<CreatePlayerDto>({
    firstName: '',
    lastName: '',
    email: '',
    fideId: '',
    rating: 5,
    dateOfBirth: '',
    gender: '',
    country: '',
  });

  protected submitCreatePlayer = async (
    fieldTree: FieldTree<CreatePlayerDto>,
  ): Promise<TreeValidationResult | undefined> => {
    const data = fieldTree().value();
    try {
      await lastValueFrom(
        this.http.post(`${this.backendUrl}/api/players`, data),
      );
      this.notification.success('Player created successfully.');
      this.router.navigate(['/']);
      return undefined;
    } catch (err: any) {
      const message =
        err.error?.message || 'Failed to create player. Please try again.';
      this.notification.error(message);
      return {
        kind: 'server',
        message,
      } as TreeValidationResult;
    }
  };

  protected playerForm = form(
    this.playerModel,
    (schema) => {
      required(schema.firstName, { message: 'First name is required' });
      required(schema.lastName, { message: 'Last name is required' });
    },
    {
      submission: {
        action: this.submitCreatePlayer,
      },
    },
  );

  protected submitting = computed(() => this.playerForm().submitting());
}
