// Para Realtime Database usamos number o string para timestamps
export type FirebaseTimestamp = number | string | object;

export interface Team {
  id: string;
  name: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  matchesPlayed: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  dateId: string; // ID de la fecha/jornada
  team1: string;
  team2: string;
  result?: 'team1' | 'team2' | 'draw';
  completed: boolean;
  completedAt?: FirebaseTimestamp;
  round: number;
  team1Score?: number;
  team2Score?: number;
  isPlayoff?: boolean; // Para partidos de desempate
  playoffType?: 'final' | 'semifinal' | 'tiebreaker'; // Tipo de partido de desempate
}

export interface TournamentDate {
  id: string;
  tournamentId: string;
  name: string; // Ej: "Fecha 1", "Jornada 2", etc.
  teams: string[]; // Equipos que participan en esta fecha
  config: TournamentConfig; // Configuración específica para esta fecha
  createdAt: FirebaseTimestamp;
  closed: boolean; // Si la fecha está cerrada
  closedAt?: FirebaseTimestamp;
  matches: Match[];
  totalMatches: number;
  completedMatches: number;
}

export type TournamentType = 'points' | 'wins'; // Por puntos o por victorias
export type TournamentStatus = 'setup' | 'active' | 'completed' | 'tiebreaker';

export interface TournamentConfig {
  type: TournamentType;
  allowTie: boolean; // Permitir empate en el campeonato
  requireAllMatches: boolean; // Requerir que todos jueguen la misma cantidad
}

export interface TournamentSummary {
  id: string;
  name: string;
  createdAt: FirebaseTimestamp;
  completedAt?: FirebaseTimestamp;
  winner?: string;
  runners?: string[]; // En caso de empate
  totalTeams: number;
  totalMatches: number;
  type: TournamentType;
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: FirebaseTimestamp;
  completedAt?: FirebaseTimestamp;
  teams: Team[]; // Todos los equipos del torneo
  dates: TournamentDate[]; // Fechas/jornadas del torneo
  isComplete: boolean;
  status: TournamentStatus;
  winner?: string;
  runners?: string[]; // En caso de empate múltiple
  
  // Campos de compatibilidad con el sistema anterior
  matches: Match[]; // Todos los partidos del torneo
  currentMatch: number;
  totalRounds: number;
  totalTeams: number;
  config: TournamentConfig;
  customMatchOrder: boolean;
}

export interface TournamentDoc {
  id: string;
  name: string;
  createdAt: FirebaseTimestamp;
  completedAt?: FirebaseTimestamp;
  teams: Team[];
  matches: Match[];
  currentMatch: number;
  isComplete: boolean;
  totalRounds: number;
  totalTeams: number;
  status: TournamentStatus;
  config: TournamentConfig;
  winner?: string;
  runners?: string[];
  customMatchOrder: boolean;
}

export interface MatchDoc {
  id: string;
  tournamentId: string;
  team1: string;
  team2: string;
  result?: 'team1' | 'team2' | 'draw';
  completed: boolean;
  completedAt?: FirebaseTimestamp;
  round: number;
  team1Score?: number;
  team2Score?: number;
  isPlayoff?: boolean;
  playoffType?: 'final' | 'semifinal' | 'tiebreaker';
}

export interface TeamDoc {
  id: string;
  tournamentId: string;
  name: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  matchesPlayed: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  createdAt: FirebaseTimestamp;
}

export interface MatchPairing {
  team1: string;
  team2: string;
  round: number;
}

export interface TournamentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingMatches: { team: string; expectedMatches: number; currentMatches: number }[];
}

export type MatchResult = 'team1' | 'team2' | 'draw';

export interface TournamentState {
  tournament: Tournament | null;
  tournaments: TournamentSummary[]; // Historial de torneos
  loading: boolean;
  error: string | null;
}

export interface TournamentContextType {
  tournament: Tournament | null;
  tournaments: TournamentSummary[];
  loading: boolean;
  error: string | null;
  
  // Tournament management
  createBasicTournament: (name: string) => Promise<void>; // Solo crear con nombre
  loadTournament: (tournamentId: string) => Promise<void>;
  loadTournamentHistory: () => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  resetTournament: () => void;
  
  // Date management
  addTournamentDate: (tournamentId: string, dateName: string, teams: string[], config: TournamentConfig) => Promise<void>;
  closeTournamentDate: (tournamentId: string, dateId: string) => Promise<void>;
  updateTournamentDate: (tournamentId: string, dateId: string, teams?: string[], config?: TournamentConfig) => Promise<void>;
  
  // Match management for dates
  addMatchToDate: (tournamentId: string, dateId: string, team1: string, team2: string) => Promise<void>;
  updateMatchResult: (matchId: string, result: MatchResult, team1Score?: number, team2Score?: number) => Promise<void>;
  
  // Legacy methods for compatibility
  createTournament: (name: string, teamNames: string[], config: TournamentConfig) => Promise<void>;
  createManualTournament: (name: string, teamNames: string[], config: TournamentConfig) => Promise<void>;
  createCustomTournament: (name: string, teamNames: string[], matches: MatchPairing[], config: TournamentConfig) => Promise<void>;
  addMatchResult: (team1: string, team2: string, result: MatchResult, team1Score?: number, team2Score?: number) => Promise<void>;
  validateTournament: (teamNames: string[], matches: MatchPairing[]) => TournamentValidation;
  generateAllMatches: (teamNames: string[]) => MatchPairing[];
  createTiebreaker: (teams: string[]) => Promise<void>;
}