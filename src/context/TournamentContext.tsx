import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { 
  Tournament, 
  TournamentState, 
  TournamentContextType, 
  MatchResult,
  TournamentConfig,
  MatchPairing,
  TournamentValidation,
  TournamentSummary
} from '../types/tournament';
import { TournamentService } from '../services/tournamentService';

const initialState: TournamentState = {
  tournament: null,
  tournaments: [],
  loading: false,
  error: null
};

type TournamentAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TOURNAMENT'; payload: Tournament | null }
  | { type: 'SET_TOURNAMENTS'; payload: TournamentSummary[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_TOURNAMENT' };

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TOURNAMENT':
      return { ...state, tournament: action.payload, loading: false, error: null };
    case 'SET_TOURNAMENTS':
      return { ...state, tournaments: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'RESET_TOURNAMENT':
      return { ...state, tournament: null, error: null };
    default:
      return state;
  }
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  const createTournament = async (
    name: string, 
    teamNames: string[], 
    config: TournamentConfig
  ): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tournamentId = await TournamentService.createTournament(name, teamNames, config);

      const tournament = await TournamentService.getTournament(tournamentId);

      dispatch({ type: 'SET_TOURNAMENT', payload: tournament });
      
      return tournamentId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const createCustomTournament = async (
    name: string, 
    teamNames: string[], 
    matches: MatchPairing[], 
    config: TournamentConfig
  ): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tournamentId = await TournamentService.createCustomTournament(name, teamNames, matches, config);
      const tournament = await TournamentService.getTournament(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: tournament });
      
      return tournamentId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const updateMatchResult = async (
    matchId: string, 
    result: MatchResult,
    team1Score?: number,
    team2Score?: number
  ): Promise<void> => {
    if (!state.tournament) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Buscar el partido en las fechas para obtener el dateId
      let dateId: string | null = null;
      
      if (state.tournament.dates) {
        for (const date of state.tournament.dates) {
          const match = date.matches.find(m => m.id === matchId);
          if (match) {
            dateId = date.id;
            break;
          }
        }
      }

      if (dateId) {
        // Usar el nuevo método para fechas específicas
        await TournamentService.updateMatchResultInDate(
          state.tournament.id,
          dateId,
          matchId,
          result,
          team1Score || 0,
          team2Score || 0
        );
      } else {
        // Usar el método legacy para compatibilidad
        await TournamentService.updateMatchResult(
          state.tournament.id, 
          matchId, 
          result,
          team1Score,
          team2Score
        );
      }
      
      const updatedTournament = await TournamentService.getTournamentWithDates(state.tournament.id);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Legacy loadTournament method - mantener para compatibilidad si es necesario
  // const loadTournament = async (tournamentId: string): Promise<void> => {
  //   dispatch({ type: 'SET_LOADING', payload: true });
  //   try {
  //     const tournament = await TournamentService.getTournament(tournamentId);
  //     dispatch({ type: 'SET_TOURNAMENT', payload: tournament });
  //   } catch (error) {
  //     dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
  //   }
  // };

  const loadTournamentHistory = async (): Promise<void> => {
    // Si ya está cargando, no hacer nada
    if (state.loading) {
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tournaments = await TournamentService.getAllTournaments();
      dispatch({ type: 'SET_TOURNAMENTS', payload: tournaments });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const deleteTournament = async (tournamentId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.deleteTournament(tournamentId);
      // Reload tournament history
      const tournaments = await TournamentService.getAllTournaments();
      dispatch({ type: 'SET_TOURNAMENTS', payload: tournaments });
      
      // If the deleted tournament was the current one, reset it
      if (state.tournament?.id === tournamentId) {
        dispatch({ type: 'SET_TOURNAMENT', payload: null });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const validateTournament = (teamNames: string[], matches: MatchPairing[]): TournamentValidation => {
    return TournamentService.validateTournament(teamNames, matches);
  };

  const generateAllMatches = (teamNames: string[]): MatchPairing[] => {
    return TournamentService.generateAllMatches(teamNames);
  };

  const createManualTournament = async (
    name: string, 
    teamNames: string[], 
    config: TournamentConfig
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tournamentId = await TournamentService.createManualTournament(name, teamNames, config);

      const tournament = await TournamentService.getTournament(tournamentId);

      dispatch({ type: 'SET_TOURNAMENT', payload: tournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const addMatchResult = async (
    team1: string, 
    team2: string, 
    result: MatchResult, 
    team1Score?: number, 
    team2Score?: number
  ): Promise<void> => {
    if (!state.tournament) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.addMatchResult(state.tournament.id, team1, team2, result, team1Score, team2Score);
      const updatedTournament = await TournamentService.getTournament(state.tournament.id);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const createTiebreaker = async (teams: string[]): Promise<void> => {
    if (!state.tournament) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.createTiebreaker(state.tournament.id, teams);
      const updatedTournament = await TournamentService.getTournament(state.tournament.id);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const resetTournament = (): void => {
    dispatch({ type: 'RESET_TOURNAMENT' });
  };

  // ===================== NUEVOS MÉTODOS PARA SISTEMA DE FECHAS =====================

  const createBasicTournament = async (name: string): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tournamentId = await TournamentService.createBasicTournament(name);

      const tournament = await TournamentService.getTournamentWithDates(tournamentId);

      dispatch({ type: 'SET_TOURNAMENT', payload: tournament });
      
      return tournamentId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const addTournamentDate = async (
    tournamentId: string, 
    dateName: string, 
    teams: string[], 
    config: TournamentConfig
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.addTournamentDate(tournamentId, dateName, teams, config);
      const updatedTournament = await TournamentService.getTournamentWithDates(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const closeTournamentDate = async (tournamentId: string, dateId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.closeTournamentDate(tournamentId, dateId);
      const updatedTournament = await TournamentService.getTournamentWithDates(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const updateTournamentDate = async (
    tournamentId: string, 
    _dateId: string, 
    _teams?: string[], 
    _config?: TournamentConfig
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Por ahora simplemente recargamos el torneo, en el futuro podríamos implementar updateTournamentDate en el service
      const updatedTournament = await TournamentService.getTournamentWithDates(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const addMatchToDate = async (
    tournamentId: string, 
    dateId: string, 
    team1: string, 
    team2: string
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.addMatchToDate(tournamentId, dateId, team1, team2);
      const updatedTournament = await TournamentService.getTournamentWithDates(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const addMatchToDateWithBlock = async (
    tournamentId: string, 
    dateId: string, 
    team1: string, 
    team2: string,
    block: number
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.addMatchToDateWithBlock(tournamentId, dateId, team1, team2, block);
      const updatedTournament = await TournamentService.getTournamentWithDates(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const lockMatchesInDate = async (
    tournamentId: string,
    dateId: string,
    matchIds: string[]
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await TournamentService.lockMatchesInDate(tournamentId, dateId, matchIds);
      const updatedTournament = await TournamentService.getTournamentWithDates(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: updatedTournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Actualizar loadTournament para usar el nuevo método con fechas
  const loadTournamentWithDates = async (tournamentId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tournament = await TournamentService.getTournamentWithDates(tournamentId);
      dispatch({ type: 'SET_TOURNAMENT', payload: tournament });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const value: TournamentContextType = {
    tournament: state.tournament,
    tournaments: state.tournaments,
    loading: state.loading,
    error: state.error,
    
    // Tournament management
    createBasicTournament,
    loadTournament: loadTournamentWithDates, // Usar la versión con fechas por defecto
    loadTournamentHistory,
    deleteTournament,
    resetTournament,
    
    // Date management
    addTournamentDate,
    closeTournamentDate,
    updateTournamentDate,
    
    // Match management for dates
    addMatchToDate,
    addMatchToDateWithBlock,
    lockMatchesInDate,
    updateMatchResult,
    
    // Legacy methods for compatibility
    createTournament,
    createManualTournament,
    createCustomTournament,
    addMatchResult,
    validateTournament,
    generateAllMatches,
    createTiebreaker
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};