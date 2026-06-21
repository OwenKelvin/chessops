import { inject, resource, signal, computed, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Tournament {
  id: string;
  slug?: string;
  ownerId: string;
  name: string;
  description?: string;
  location?: string;
  country?: string;
  countryName?: string;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  format: 'swiss' | 'roundrobin' | 'elimination';
  maxRounds: number;
  timeControl?: string;
  maxPlayers?: number;
  isPublic: boolean;
  registrationOpen: boolean;
  createdAt: string;
  updatedAt: string;
  players?: TournamentPlayer[];
  rounds?: Round[];
  _count?: { rounds: number; players: number };
}

export interface TournamentPlayer {
  id: string;
  playerId: string;
  seed: number;
  rating?: number;
  status: string;
  isAdmin?: boolean;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    rating?: number;
  };
}

export interface TournamentAdmin {
  id: string;
  playerId: string;
  isAdmin: boolean;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface Round {
  id: string;
  roundNumber: number;
  name?: string;
  status: string;
  pairings: Pairing[];
}

export interface Pairing {
  id: string;
  whiteId: string;
  blackId: string;
  boardNumber?: number;
  result?: string;
  white: { firstName: string; lastName: string };
  black: { firstName: string; lastName: string };
}

export interface StandingsEntry {
  rank: number;
  playerId: string;
  name: string;
  seed: number;
  rating: number;
  points: number;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  tiebreaks: {
    buchholz: number;
    buchholzMedian: number;
    sonnebornBerger: number;
    directEncounter?: { points: number; games: number };
    progressScore: number;
    averageOpponentRating: number;
  };
  status: string;
}

export interface CreateTournamentDto {
  name: string;
  description: string;
  location: string;
  country: string;
  countryName: string;
  startDate: string;
  endDate: string;
  format: 'swiss' | 'roundrobin' | 'elimination';
  maxRounds: number;
  timeControl: string;
  maxPlayers: number | null;
  isPublic: boolean;
  registrationOpen: boolean;
}

export interface TournamentFilters {
  country?: string;
  status?: string;
  format?: string;
  isPublic?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

@Service()
export class TournamentService {
  private http = inject(HttpClient);
  readonly filters = signal<TournamentFilters>({});

  readonly tournamentsResource = resource({
    params: () => this.filters(), // reactive dependency
    loader: ({ params: filters }) => {
      let params = new HttpParams();
      if (filters.country) params = params.set('country', filters.country);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.format) params = params.set('format', filters.format);
      if (filters.isPublic !== undefined)
        params = params.set('isPublic', String(filters.isPublic));
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page) params = params.set('page', String(filters.page));
      if (filters.limit) params = params.set('limit', String(filters.limit));

      console.log('filters', filters);

      return firstValueFrom(
        this.http.get<{ tournaments: Tournament[]; total: number }>(
          `api/tournaments`,
          { params },
        ),
      );
    },
  });

  readonly tournaments = computed(
    () => this.tournamentsResource.value()?.tournaments ?? [],
  );
  readonly total = computed(() => this.tournamentsResource.value()?.total ?? 0);
  readonly isLoading = computed(() => this.tournamentsResource.isLoading());
  readonly error = computed(() => this.tournamentsResource.error());

  setFilters(filters: TournamentFilters): void {
    this.filters.set(filters);
  }

  async getTournament(id: string): Promise<Tournament> {
    return firstValueFrom(this.http.get<Tournament>(`api/tournaments/${id}`));
  }

  async createTournament(data: CreateTournamentDto): Promise<Tournament> {
    return firstValueFrom(this.http.post<Tournament>(`api/tournaments`, data));
  }

  async updateTournament(
    id: string,
    data: Partial<CreateTournamentDto>,
  ): Promise<Tournament> {
    return firstValueFrom(
      this.http.patch<Tournament>(`api/tournaments/${id}`, data),
    );
  }

  async deleteTournament(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`api/tournaments/${id}`));
  }

  async getStandings(
    tournamentId: string,
  ): Promise<{ standings: StandingsEntry[] }> {
    return firstValueFrom(
      this.http.get<{ standings: StandingsEntry[] }>(
        `api/tournaments/${tournamentId}/standings`,
      ),
    );
  }

  async addPlayer(
    tournamentId: string,
    playerId: string,
    seed?: number,
  ): Promise<TournamentPlayer> {
    return firstValueFrom(
      this.http.post<TournamentPlayer>(
        `api/tournaments/${tournamentId}/players`,
        { playerId, seed },
      ),
    );
  }

  async removePlayer(tournamentId: string, playerId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `api/tournaments/${tournamentId}/players/${playerId}`,
      ),
    );
  }

  async submitResult(
    tournamentId: string,
    pairingId: string,
    result: string,
  ): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`api/tournaments/${tournamentId}/results`, {
        pairingId,
        result,
      }),
    );
  }

  // Admin management
  async getAdmins(tournamentId: string): Promise<TournamentAdmin[]> {
    return firstValueFrom(
      this.http.get<TournamentAdmin[]>(`api/tournaments/${tournamentId}/admins`),
    );
  }

  async assignAdmin(tournamentId: string, playerId: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`api/tournaments/${tournamentId}/admins`, {
        playerId,
      }),
    );
  }

  async revokeAdmin(tournamentId: string, playerId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `api/tournaments/${tournamentId}/admins/${playerId}`,
      ),
    );
  }
}
