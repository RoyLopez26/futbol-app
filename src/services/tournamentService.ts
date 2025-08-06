import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove,
  serverTimestamp
} from 'firebase/database';
import { db } from './firebase';
import type { 
  Tournament, 
  Team, 
  Match, 
  MatchResult, 
  TournamentDoc, 
  TournamentConfig,
  MatchPairing,
  TournamentValidation,
  TournamentSummary,
  TournamentStatus,
  TournamentDate
} from '../types/tournament';

export class TournamentService {
  
  // Generar todas las combinaciones posibles de partidos
  static generateAllMatches(teamNames: string[]): MatchPairing[] {
    const matches: MatchPairing[] = [];
    let round = 1;

    for (let i = 0; i < teamNames.length; i++) {
      for (let j = i + 1; j < teamNames.length; j++) {
        matches.push({
          team1: teamNames[i],
          team2: teamNames[j],
          round: round++
        });
      }
    }

    return matches;
  }

  // Validar configuración de torneo
  static validateTournament(teamNames: string[], matches: MatchPairing[]): TournamentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingMatches: { team: string; expectedMatches: number; currentMatches: number }[] = [];

    // Verificar que no haya equipos duplicados en partidos
    for (const match of matches) {
      if (match.team1 === match.team2) {
        errors.push(`Un equipo no puede jugar contra sí mismo: ${match.team1}`);
      }
      if (!teamNames.includes(match.team1)) {
        errors.push(`Equipo no válido en partido: ${match.team1}`);
      }
      if (!teamNames.includes(match.team2)) {
        errors.push(`Equipo no válido en partido: ${match.team2}`);
      }
    }

    // Contar partidos por equipo
    const matchCounts: { [team: string]: number } = {};
    teamNames.forEach(team => matchCounts[team] = 0);

    for (const match of matches) {
      if (matchCounts[match.team1] !== undefined) matchCounts[match.team1]++;
      if (matchCounts[match.team2] !== undefined) matchCounts[match.team2]++;
    }

    // Verificar equidad en número de partidos
    const expectedMatches = teamNames.length - 1; // En round-robin, cada equipo juega contra todos los demás
    for (const team of teamNames) {
      const currentMatches = matchCounts[team] || 0;
      missingMatches.push({
        team,
        expectedMatches,
        currentMatches
      });

      if (currentMatches < expectedMatches) {
        warnings.push(`${team} tiene menos partidos de lo esperado (${currentMatches}/${expectedMatches})`);
      }
    }

    // Verificar duplicados
    const matchSet = new Set<string>();
    for (const match of matches) {
      const matchKey = [match.team1, match.team2].sort().join('-');
      if (matchSet.has(matchKey)) {
        errors.push(`Partido duplicado: ${match.team1} vs ${match.team2}`);
      }
      matchSet.add(matchKey);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingMatches
    };
  }

  // Crear torneo estándar
  static async createTournament(
    name: string, 
    teamNames: string[], 
    config: TournamentConfig
  ): Promise<string> {
    const matches = this.generateAllMatches(teamNames);
    return this.createCustomTournament(name, teamNames, matches, config);
  }

  // Crear torneo manual (sin partidos predefinidos)
  static async createManualTournament(
    name: string, 
    teamNames: string[], 
    config: TournamentConfig
  ): Promise<string> {
    try {
      console.log('🔄 Realtime DB: Creando torneo manual...');
      console.log('📋 Datos del torneo:', { name, teamNames, config });
      
      console.log('🔥 Verificando conexión a Firebase Realtime Database...');
      console.log('Database:', db);
      
      const teams: Team[] = teamNames.map((teamName, index) => ({
        id: `team-${index + 1}`,
        name: teamName,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        matchesPlayed: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      }));

      // Crear torneo sin partidos predefinidos
      const matches: Match[] = [];

      console.log('📊 Datos preparados para Realtime Database');
      console.log('💾 Intentando guardar en Firebase...');

      // Crear referencia para un nuevo torneo
      const tournamentsRef = ref(db, 'tournaments');
      const newTournamentRef = push(tournamentsRef);
      const tournamentId = newTournamentRef.key!;

      const tournamentData: Omit<TournamentDoc, 'id'> = {
        name,
        createdAt: serverTimestamp(),
        teams,
        matches,
        currentMatch: 0,
        isComplete: false,
        totalRounds: 0, // Se irá actualizando conforme se agreguen partidos
        totalTeams: teams.length,
        status: 'active' as TournamentStatus,
        config,
        customMatchOrder: true
      };

      console.log('🚀 Guardando torneo manual en Realtime Database con ID:', tournamentId);
      
      // Guardar el torneo
      await set(newTournamentRef, tournamentData);

      console.log('✅ Torneo manual creado exitosamente en Realtime Database!');
      return tournamentId;
    } catch (error) {
      console.error('❌ Error creating manual tournament:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Crear torneo personalizado
  static async createCustomTournament(
    name: string, 
    teamNames: string[], 
    matchPairings: MatchPairing[],
    config: TournamentConfig
  ): Promise<string> {
    try {
      console.log('🔄 Realtime DB: Iniciando creación de torneo...');
      console.log('📋 Datos del torneo:', { name, teamNames, matchPairings, config });
      
      console.log('🔥 Verificando conexión a Firebase Realtime Database...');
      console.log('Database:', db);
      
      const teams: Team[] = teamNames.map((teamName, index) => ({
        id: `team-${index + 1}`,
        name: teamName,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        matchesPlayed: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      }));

      const matches: Match[] = matchPairings.map((pairing, index) => ({
        id: `match-${index + 1}`,
        tournamentId: '',
        dateId: '',
        team1: pairing.team1,
        team2: pairing.team2,
        completed: false,
        round: pairing.round,
        team1Score: 0,
        team2Score: 0,
        isPlayoff: false
      }));

      console.log('📊 Datos preparados para Realtime Database');
      console.log('💾 Intentando guardar en Firebase...');

      // Crear referencia para un nuevo torneo
      const tournamentsRef = ref(db, 'tournaments');
      const newTournamentRef = push(tournamentsRef);
      const tournamentId = newTournamentRef.key!;

      // Actualizar los partidos con el ID del torneo
      const updatedMatches = matches.map(match => ({ ...match, tournamentId }));

      const tournamentData: Omit<TournamentDoc, 'id'> = {
        name,
        createdAt: serverTimestamp(),
        teams,
        matches: updatedMatches,
        currentMatch: 0,
        isComplete: false,
        totalRounds: matches.length,
        totalTeams: teams.length,
        status: 'active' as TournamentStatus,
        config,
        customMatchOrder: true
      };

      console.log('🚀 Guardando en Realtime Database con ID:', tournamentId);
      
      // Guardar el torneo
      await set(newTournamentRef, tournamentData);

      console.log('✅ Torneo creado exitosamente en Realtime Database!');
      return tournamentId;
    } catch (error) {
      console.error('❌ Error creating tournament:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Obtener torneo por ID
  static async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      console.log('🔍 Buscando torneo con ID:', tournamentId);
      const tournamentRef = ref(db, `tournaments/${tournamentId}`);
      const snapshot = await get(tournamentRef);

      if (snapshot.exists()) {
        const data = snapshot.val() as TournamentDoc;
        console.log('✅ Torneo encontrado:', data);
        return {
          ...data,
          id: tournamentId,
          dates: []
        };
      } else {
        console.log('❌ Torneo no encontrado');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting tournament:', error);
      throw error;
    }
  }

  // Actualizar resultado de partido
  static async updateMatchResult(
    tournamentId: string, 
    matchId: string, 
    result: MatchResult,
    team1Score: number = 0,
    team2Score: number = 0
  ): Promise<void> {
    try {
      console.log('🔄 Actualizando resultado del partido:', { tournamentId, matchId, result, team1Score, team2Score });
      
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      const matchIndex = tournament.matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) throw new Error('Match not found');

      const match = tournament.matches[matchIndex];
      const wasAlreadyCompleted = match.completed || false;
      const updatedMatch = {
        ...match,
        result,
        completed: true,
        completedAt: serverTimestamp(),
        team1Score,
        team2Score
      };

      tournament.matches[matchIndex] = updatedMatch;

      const updatedTeams = this.updateTeamStats(tournament.teams || [], updatedMatch, tournament.config, wasAlreadyCompleted);
      
      const completedMatches = tournament.matches.filter(m => m.completed).length;
      const isComplete = completedMatches === tournament.totalRounds;

      let status: TournamentStatus = tournament.status;
      let winner: string | undefined;
      let runners: string[] | undefined;
      let completedAt: object | undefined = undefined;

      if (isComplete) {
        const finalResult = this.determineFinalResult(updatedTeams, tournament.config);
        status = finalResult.needsTiebreaker ? 'tiebreaker' : 'completed';
        winner = finalResult.winner;
        runners = finalResult.runners;
        if (status === 'completed') {
          completedAt = serverTimestamp();
        }
      }

      const tournamentRef = ref(db, `tournaments/${tournamentId}`);
      
      // Preparar datos para actualizar (solo incluir valores que no sean undefined)
      const updateData: Record<string, unknown> = {
        matches: tournament.matches,
        teams: updatedTeams,
        currentMatch: Math.min(tournament.currentMatch + 1, tournament.totalRounds),
        isComplete,
        status
      };

      // Solo agregar winner si tiene valor
      if (winner !== undefined) {
        updateData.winner = winner;
      }

      // Solo agregar runners si tiene valor
      if (runners !== undefined) {
        updateData.runners = runners;
      }

      // Solo agregar completedAt si tiene valor
      if (completedAt !== undefined) {
        updateData.completedAt = completedAt;
      }

      await update(tournamentRef, updateData);

      console.log('✅ Resultado del partido actualizado');
    } catch (error) {
      console.error('❌ Error updating match result:', error);
      throw error;
    }
  }

  // Determinar resultado final del torneo
  private static determineFinalResult(teams: Team[], config: TournamentConfig) {
    const sortedTeams = this.sortTeams(teams, config);
    const topScore = config.type === 'points' ? sortedTeams[0].points : sortedTeams[0].wins;
    const winners = sortedTeams.filter(team => 
      config.type === 'points' ? team.points === topScore : team.wins === topScore
    );

    if (winners.length === 1) {
      return {
        winner: winners[0].name,
        runners: [],
        needsTiebreaker: false
      };
    } else if (config.allowTie) {
      return {
        winner: winners[0].name,
        runners: winners.slice(1).map(t => t.name),
        needsTiebreaker: false
      };
    } else {
      return {
        winner: undefined,
        runners: winners.map(t => t.name),
        needsTiebreaker: true
      };
    }
  }

  // Ordenar equipos según configuración
  private static sortTeams(teams: Team[], config: TournamentConfig): Team[] {
    return [...teams].sort((a, b) => {
      if (config.type === 'points') {
        if (b.points !== a.points) return b.points - a.points;
        if ((b.goalDifference ?? 0) !== (a.goalDifference ?? 0)) {
          return (b.goalDifference ?? 0) - (a.goalDifference ?? 0);
        }
        return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
      } else {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if ((b.goalDifference ?? 0) !== (a.goalDifference ?? 0)) {
          return (b.goalDifference ?? 0) - (a.goalDifference ?? 0);
        }
        return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
      }
    });
  }

  // Recalcular todas las estadísticas de equipos desde cero basándose en todos los matches
  private static recalculateTeamStats(teams: Team[], allMatches: Match[], config: TournamentConfig): Team[] {
    const updatedTeams = teams.map(team => ({
      ...team,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchesPlayed: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    }));

    // Procesar cada partido completado
    for (const match of allMatches) {
      if (!match.completed) continue;

      const team1Index = updatedTeams.findIndex(t => t.name === match.team1);
      const team2Index = updatedTeams.findIndex(t => t.name === match.team2);

      if (team1Index === -1 || team2Index === -1) continue;

      const team1 = updatedTeams[team1Index];
      const team2 = updatedTeams[team2Index];

      // Incrementar partidos jugados
      team1.matchesPlayed++;
      team2.matchesPlayed++;

      // Actualizar goles
      if (match.team1Score !== undefined && match.team2Score !== undefined) {
        team1.goalsFor += match.team1Score;
        team1.goalsAgainst += match.team2Score;
        team2.goalsFor += match.team2Score;
        team2.goalsAgainst += match.team1Score;

        team1.goalDifference = team1.goalsFor - team1.goalsAgainst;
        team2.goalDifference = team2.goalsFor - team2.goalsAgainst;
      }

      // Actualizar victorias, empates, derrotas y puntos
      switch (match.result) {
        case 'team1':
          team1.wins++;
          team2.losses++;
          if (config.type === 'points') {
            team1.points += 3;
          }
          break;
        case 'team2':
          team2.wins++;
          team1.losses++;
          if (config.type === 'points') {
            team2.points += 3;
          }
          break;
        case 'draw':
          team1.draws++;
          team2.draws++;
          if (config.type === 'points') {
            team1.points += 1;
            team2.points += 1;
          }
          break;
      }
    }

    return this.sortTeams(updatedTeams, config);
  }

  // Actualizar estadísticas de equipos (método legacy mantenido para compatibilidad)
  private static updateTeamStats(teams: Team[], match: Match, config: TournamentConfig, wasAlreadyCompleted: boolean = false): Team[] {
    const updatedTeams = [...teams];
    
    const team1Index = updatedTeams.findIndex(t => t.name === match.team1);
    const team2Index = updatedTeams.findIndex(t => t.name === match.team2);

    if (team1Index === -1 || team2Index === -1) return updatedTeams;

    const team1 = { ...updatedTeams[team1Index] };
    const team2 = { ...updatedTeams[team2Index] };

    // Solo incrementar matchesPlayed si el partido no estaba previamente completado
    if (!wasAlreadyCompleted) {
      team1.matchesPlayed++;
      team2.matchesPlayed++;
    }

    if (match.team1Score !== undefined && match.team2Score !== undefined) {
      team1.goalsFor = (team1.goalsFor || 0) + match.team1Score;
      team1.goalsAgainst = (team1.goalsAgainst || 0) + match.team2Score;
      team2.goalsFor = (team2.goalsFor || 0) + match.team2Score;
      team2.goalsAgainst = (team2.goalsAgainst || 0) + match.team1Score;

      team1.goalDifference = (team1.goalsFor || 0) - (team1.goalsAgainst || 0);
      team2.goalDifference = (team2.goalsFor || 0) - (team2.goalsAgainst || 0);
    }

    // Cálculo de puntos según el tipo de torneo
    switch (match.result) {
      case 'team1':
        team1.wins++;
        team2.losses++;
        if (config.type === 'points') {
          team1.points += 3; // 3 puntos por victoria
        }
        // En sistema por victorias no se suman puntos, solo se cuenta la victoria
        break;
      case 'team2':
        team2.wins++;
        team1.losses++;
        if (config.type === 'points') {
          team2.points += 3; // 3 puntos por victoria
        }
        // En sistema por victorias no se suman puntos, solo se cuenta la victoria
        break;
      case 'draw':
        team1.draws++;
        team2.draws++;
        if (config.type === 'points') {
          team1.points += 1; // 1 punto por empate
          team2.points += 1; // 1 punto por empate
        }
        // En sistema por victorias, empates = 0 victorias (no se suma nada)
        break;
    }

    updatedTeams[team1Index] = team1;
    updatedTeams[team2Index] = team2;

    return this.sortTeams(updatedTeams, config);
  }

  // Obtener historial de torneos
  static async getAllTournaments(): Promise<TournamentSummary[]> {
    try {
      console.log('🔍 Realtime DB: Iniciando búsqueda de torneos...');
      console.log('🔥 Verificando conexión a Firebase Realtime Database...');
      console.log('Database:', db);
      
      const tournamentsRef = ref(db, 'tournaments');
      // Simplificamos la consulta - sin orderBy para evitar problemas de indexación
      
      console.log('📋 Query preparada para Realtime Database');
      console.log('⏳ Ejecutando consulta...');
      
      const snapshot = await get(tournamentsRef);
      
      console.log('📊 Snapshot obtenido, existe:', snapshot.exists());
      
      if (!snapshot.exists()) {
        console.log('📋 No hay torneos en la base de datos');
        return [];
      }

      const data = snapshot.val();
      console.log('📊 Datos obtenidos:', data);
      
      const tournaments: TournamentSummary[] = [];
      
      // Convertir objeto a array y ordenar por fecha de creación (más reciente primero)
      Object.keys(data).forEach(key => {
        const tournament = data[key] as TournamentDoc;
        console.log('📝 Procesando torneo:', key, tournament);
        
        tournaments.push({
          id: key,
          name: tournament.name,
          createdAt: tournament.createdAt,
          completedAt: tournament.completedAt,
          winner: tournament.winner,
          runners: tournament.runners,
          totalTeams: tournament.totalTeams,
          totalMatches: tournament.totalRounds,
          type: tournament.config.type
        });
      });

      // Ordenar por fecha de creación (más reciente primero)
      tournaments.sort((a, b) => {
        // Si createdAt es un timestamp de servidor, manejarlo apropiadamente
        const aTime = typeof a.createdAt === 'number' ? a.createdAt : 
                      typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : 
                      Date.now();
        const bTime = typeof b.createdAt === 'number' ? b.createdAt : 
                      typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : 
                      Date.now();
        return bTime - aTime;
      });
      
      console.log('✅ Torneos procesados:', tournaments);
      return tournaments;
    } catch (error) {
      console.error('❌ Error getting tournaments:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Eliminar torneo
  static async deleteTournament(tournamentId: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando torneo:', tournamentId);
      const tournamentRef = ref(db, `tournaments/${tournamentId}`);
      await remove(tournamentRef);
      console.log('✅ Torneo eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error deleting tournament:', error);
      throw error;
    }
  }

  // Agregar resultado de partido manualmente
  static async addMatchResult(
    tournamentId: string,
    team1: string,
    team2: string,
    result: MatchResult,
    team1Score: number = 0,
    team2Score: number = 0
  ): Promise<void> {
    try {
      console.log('🔄 Agregando resultado manual:', { tournamentId, team1, team2, result, team1Score, team2Score });
      
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      // Inicializar matches si no existe
      if (!tournament.matches) {
        tournament.matches = [];
      }

      // Crear nuevo partido con resultado
      const newMatch: Match = {
        id: `match-${Date.now()}`,
        tournamentId,
        dateId: '',
        team1,
        team2,
        result,
        completed: true,
        completedAt: serverTimestamp(),
        round: tournament.matches.length + 1,
        team1Score,
        team2Score,
        isPlayoff: false
      };

      // Agregar el partido a la lista
      tournament.matches.push(newMatch);
      tournament.totalRounds = tournament.matches.length;
      tournament.currentMatch = tournament.matches.length;

      // Actualizar estadísticas de los equipos
      const updatedTeams = this.updateTeamStats(tournament.teams || [], newMatch, tournament.config, false);
      
      // Verificar si el torneo está completo (esto se puede personalizar según las reglas)
      const isComplete = false; // Por ahora dejamos que el usuario decida cuándo terminar

      let status: TournamentStatus = tournament.status;
      let winner: string | undefined;
      let runners: string[] | undefined;
      let completedAt: object | undefined = undefined;

      // Solo determinar ganador si se marca como completo manualmente
      if (isComplete) {
        const finalResult = this.determineFinalResult(updatedTeams, tournament.config);
        status = finalResult.needsTiebreaker ? 'tiebreaker' : 'completed';
        winner = finalResult.winner;
        runners = finalResult.runners;
        if (status === 'completed') {
          completedAt = serverTimestamp();
        }
      }

      const tournamentRef = ref(db, `tournaments/${tournamentId}`);
      
      // Preparar datos para actualizar (solo incluir valores que no sean undefined)
      const updateData: Record<string, unknown> = {
        matches: tournament.matches,
        teams: updatedTeams,
        currentMatch: tournament.currentMatch,
        totalRounds: tournament.totalRounds,
        isComplete,
        status
      };

      // Solo agregar winner si tiene valor
      if (winner !== undefined) {
        updateData.winner = winner;
      }

      // Solo agregar runners si tiene valor
      if (runners !== undefined) {
        updateData.runners = runners;
      }

      // Solo agregar completedAt si tiene valor
      if (completedAt !== undefined) {
        updateData.completedAt = completedAt;
      }

      await update(tournamentRef, updateData);

      console.log('✅ Resultado agregado exitosamente');
    } catch (error) {
      console.error('❌ Error adding match result:', error);
      throw error;
    }
  }

  // Crear partido de desempate
  static async createTiebreaker(tournamentId: string, teams: string[]): Promise<void> {
    try {
      console.log('🥊 Creando partido de desempate:', { tournamentId, teams });
      
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      // Crear partido de desempate
      const tiebreakerMatch: Match = {
        id: `tiebreaker-${Date.now()}`,
        tournamentId,
        dateId: '',
        team1: teams[0],
        team2: teams[1],
        completed: false,
        round: tournament.totalRounds + 1,
        team1Score: 0,
        team2Score: 0,
        isPlayoff: true,
        playoffType: 'tiebreaker'
      };

      tournament.matches.push(tiebreakerMatch);
      tournament.totalRounds++;
      tournament.status = 'tiebreaker';

      const tournamentRef = ref(db, `tournaments/${tournamentId}`);
      await update(tournamentRef, {
        matches: tournament.matches,
        totalRounds: tournament.totalRounds,
        status: tournament.status
      });

      console.log('✅ Partido de desempate creado exitosamente');
    } catch (error) {
      console.error('❌ Error creating tiebreaker:', error);
      throw error;
    }
  }

  // ===================== NUEVOS MÉTODOS PARA SISTEMA DE FECHAS =====================

  // Crear torneo básico (solo con nombre)
  static async createBasicTournament(name: string): Promise<string> {
    try {
      console.log('🔄 Realtime DB: Creando torneo básico...');
      console.log('📋 Nombre del torneo:', name);
      
      // Crear referencia para un nuevo torneo
      const tournamentsRef = ref(db, 'tournaments');
      const newTournamentRef = push(tournamentsRef);
      const tournamentId = newTournamentRef.key!;

      const tournamentData: Omit<TournamentDoc, 'id'> = {
        name,
        createdAt: serverTimestamp(),
        teams: [],
        matches: [],
        currentMatch: 0,
        isComplete: false,
        totalRounds: 0,
        totalTeams: 0,
        status: 'setup' as TournamentStatus,
        config: {
          type: 'points',
          allowTie: true,
          requireAllMatches: false
        },
        customMatchOrder: true
      };

      console.log('🚀 Guardando torneo básico en Realtime Database con ID:', tournamentId);
      
      // Guardar el torneo
      await set(newTournamentRef, tournamentData);

      console.log('✅ Torneo básico creado exitosamente en Realtime Database!');
      return tournamentId;
    } catch (error) {
      console.error('❌ Error creating basic tournament:', error);
      throw error;
    }
  }

  // Agregar fecha al torneo
  static async addTournamentDate(
    tournamentId: string, 
    dateName: string, 
    teams: string[], 
    config: TournamentConfig
  ): Promise<string> {
    try {
      console.log('🔄 Agregando fecha al torneo:', { tournamentId, dateName, teams, config });
      
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      // Crear referencia para una nueva fecha
      const datesRef = ref(db, `tournament-dates/${tournamentId}`);
      const newDateRef = push(datesRef);
      const dateId = newDateRef.key!;

      const dateData: Omit<TournamentDate, 'id'> = {
        tournamentId,
        name: dateName,
        teams,
        config,
        createdAt: serverTimestamp(),
        closed: false,
        matches: [],
        totalMatches: 0,
        completedMatches: 0
      };

      // Guardar la fecha
      await set(newDateRef, dateData);

      // Actualizar equipos únicos del torneo
      const existingTeamNames = tournament.teams ? tournament.teams.map(t => t.name) : [];
      const allTeams = new Set([...existingTeamNames, ...teams]);
      const updatedTeams: Team[] = Array.from(allTeams).map((teamName, index) => {
        const existingTeam = tournament.teams ? tournament.teams.find(t => t.name === teamName) : undefined;
        return existingTeam || {
          id: `team-${index + 1}`,
          name: teamName,
          points: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          matchesPlayed: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        };
      });

      // Actualizar el torneo
      const tournamentRef = ref(db, `tournaments/${tournamentId}`);
      await update(tournamentRef, {
        teams: updatedTeams,
        totalTeams: updatedTeams.length,
        status: 'active' as TournamentStatus
      });

      console.log('✅ Fecha agregada exitosamente');
      return dateId;
    } catch (error) {
      console.error('❌ Error adding tournament date:', error);
      throw error;
    }
  }

  // Obtener fechas de un torneo
  static async getTournamentDates(tournamentId: string): Promise<TournamentDate[]> {
    try {
      console.log('🔍 Obteniendo fechas del torneo:', tournamentId);
      const datesRef = ref(db, `tournament-dates/${tournamentId}`);
      const snapshot = await get(datesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val();
      const dates: TournamentDate[] = [];
      
      Object.keys(data).forEach(key => {
        const dateData = data[key];
        dates.push({
          ...dateData,
          id: key,
          matches: dateData.matches || [], // Asegurar que matches siempre sea un array
          totalMatches: dateData.totalMatches || 0,
          completedMatches: dateData.completedMatches || 0
        });
      });

      // Ordenar por fecha de creación
      dates.sort((a, b) => {
        const aTime = typeof a.createdAt === 'number' ? a.createdAt : Date.now();
        const bTime = typeof b.createdAt === 'number' ? b.createdAt : Date.now();
        return aTime - bTime;
      });

      console.log('✅ Fechas obtenidas:', dates);
      return dates;
    } catch (error) {
      console.error('❌ Error getting tournament dates:', error);
      throw error;
    }
  }

  // Agregar partido a una fecha
  static async addMatchToDate(
    tournamentId: string, 
    dateId: string, 
    team1: string, 
    team2: string
  ): Promise<void> {
    try {
      console.log('🔄 Agregando partido a fecha:', { tournamentId, dateId, team1, team2 });
      
      // Obtener la fecha
      const dateRef = ref(db, `tournament-dates/${tournamentId}/${dateId}`);
      const dateSnapshot = await get(dateRef);
      
      if (!dateSnapshot.exists()) {
        throw new Error('Tournament date not found');
      }

      const dateData = dateSnapshot.val() as TournamentDate;
      
      // Verificar que los equipos estén en la fecha
      if (!dateData.teams.includes(team1) || !dateData.teams.includes(team2)) {
        throw new Error('Teams must be part of this tournament date');
      }

      // Crear nuevo partido
      const currentMatches = dateData.matches || [];
      const newMatch: Match = {
        id: `match-${Date.now()}`,
        tournamentId,
        dateId,
        team1,
        team2,
        completed: false,
        round: currentMatches.length + 1,
        block: 1, // Por defecto bloque 1
        locked: false, // Por defecto no bloqueado
        team1Score: 0,
        team2Score: 0,
        isPlayoff: false
      };

      // Agregar partido a la fecha
      const updatedMatches = [...currentMatches, newMatch];
      
      await update(dateRef, {
        matches: updatedMatches,
        totalMatches: updatedMatches.length
      });

      console.log('✅ Partido agregado a la fecha exitosamente');
    } catch (error) {
      console.error('❌ Error adding match to date:', error);
      throw error;
    }
  }

  // Agregar partido a una fecha con número de bloque específico
  static async addMatchToDateWithBlock(
    tournamentId: string, 
    dateId: string, 
    team1: string, 
    team2: string,
    block: number
  ): Promise<void> {
    try {
      console.log('🔄 Agregando partido con bloque a fecha:', { tournamentId, dateId, team1, team2, block });
      
      // Obtener la fecha
      const dateRef = ref(db, `tournament-dates/${tournamentId}/${dateId}`);
      const dateSnapshot = await get(dateRef);
      
      if (!dateSnapshot.exists()) {
        throw new Error('Tournament date not found');
      }

      const dateData = dateSnapshot.val() as TournamentDate;
      
      // Verificar que los equipos estén en la fecha
      if (!dateData.teams.includes(team1) || !dateData.teams.includes(team2)) {
        throw new Error('Teams must be part of this tournament date');
      }

      // Crear nuevo partido con bloque
      const currentMatches = dateData.matches || [];
      const newMatch: Match = {
        id: `match-${Date.now()}`,
        tournamentId,
        dateId,
        team1,
        team2,
        completed: false,
        round: currentMatches.length + 1,
        block,
        locked: false,
        team1Score: 0,
        team2Score: 0,
        isPlayoff: false
      };

      // Agregar partido a la fecha
      const updatedMatches = [...currentMatches, newMatch];
      
      await update(dateRef, {
        matches: updatedMatches,
        totalMatches: updatedMatches.length
      });

      console.log('✅ Partido con bloque agregado a la fecha exitosamente');
    } catch (error) {
      console.error('❌ Error adding match with block to date:', error);
      throw error;
    }
  }

  // Bloquear partidos específicos en una fecha
  static async lockMatchesInDate(
    tournamentId: string,
    dateId: string,
    matchIds: string[]
  ): Promise<void> {
    try {
      console.log('🔒 Bloqueando partidos en fecha:', { tournamentId, dateId, matchIds });
      
      // Obtener la fecha
      const dateRef = ref(db, `tournament-dates/${tournamentId}/${dateId}`);
      const dateSnapshot = await get(dateRef);
      
      if (!dateSnapshot.exists()) {
        throw new Error('Tournament date not found');
      }

      const dateData = dateSnapshot.val() as TournamentDate;
      const matches = dateData.matches || [];
      
      // Bloquear los partidos especificados
      const updatedMatches = matches.map(match => 
        matchIds.includes(match.id) 
          ? { ...match, locked: true }
          : match
      );
      
      await update(dateRef, {
        matches: updatedMatches
      });

      console.log('✅ Partidos bloqueados exitosamente');
    } catch (error) {
      console.error('❌ Error locking matches in date:', error);
      throw error;
    }
  }

  // Cerrar fecha (no permitir más cambios)
  static async closeTournamentDate(tournamentId: string, dateId: string): Promise<void> {
    try {
      console.log('🔒 Cerrando fecha del torneo:', { tournamentId, dateId });
      
      const dateRef = ref(db, `tournament-dates/${tournamentId}/${dateId}`);
      const dateSnapshot = await get(dateRef);
      
      if (!dateSnapshot.exists()) {
        throw new Error('Tournament date not found');
      }

      const dateData = dateSnapshot.val() as TournamentDate;
      
      // Verificar que todos los partidos estén completados
      const matches = dateData.matches || [];
      const incompleteMatches = matches.filter(m => !m.completed);
      if (incompleteMatches.length > 0) {
        throw new Error(`Cannot close date: ${incompleteMatches.length} matches are still incomplete`);
      }

      await update(dateRef, {
        closed: true,
        closedAt: serverTimestamp()
      });

      console.log('✅ Fecha cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error closing tournament date:', error);
      throw error;
    }
  }

  // Actualizar resultado de partido en una fecha específica
  static async updateMatchResultInDate(
    tournamentId: string,
    dateId: string,
    matchId: string,
    result: MatchResult,
    team1Score: number = 0,
    team2Score: number = 0
  ): Promise<void> {
    try {
      console.log('🔄 Actualizando resultado del partido en fecha:', { 
        tournamentId, dateId, matchId, result, team1Score, team2Score 
      });
      
      // Obtener la fecha
      const dateRef = ref(db, `tournament-dates/${tournamentId}/${dateId}`);
      const dateSnapshot = await get(dateRef);
      
      if (!dateSnapshot.exists()) {
        throw new Error('Tournament date not found');
      }

      const dateData = dateSnapshot.val() as TournamentDate;
      
      // Verificar que la fecha tenga partidos
      if (!dateData.matches || !Array.isArray(dateData.matches)) {
        throw new Error('No matches found in date');
      }
      
      // Encontrar el partido en la fecha
      const matchIndex = dateData.matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) {
        throw new Error('Match not found in date');
      }

      const match = dateData.matches[matchIndex];
      const updatedMatch = {
        ...match,
        result,
        completed: true,
        completedAt: serverTimestamp(),
        team1Score,
        team2Score
      };

      // Actualizar el partido en la fecha
      const updatedMatches = [...dateData.matches];
      updatedMatches[matchIndex] = updatedMatch;
      
      const completedMatches = updatedMatches.filter(m => m.completed).length;

      // Actualizar la fecha
      await update(dateRef, {
        matches: updatedMatches,
        completedMatches
      });

      // Obtener el torneo completo con todas las fechas para recalcular estadísticas
      const tournamentWithDates = await this.getTournamentWithDates(tournamentId);
      if (!tournamentWithDates) throw new Error('Tournament not found');

      // Recalcular todas las estadísticas desde cero usando todos los matches de todas las fechas
      const allMatches: Match[] = [];
      if (tournamentWithDates.dates) {
        tournamentWithDates.dates.forEach(date => {
          if (date.matches && Array.isArray(date.matches)) {
            allMatches.push(...date.matches);
          }
        });
      }

      const updatedTeams = this.recalculateTeamStats(tournamentWithDates.teams || [], allMatches, dateData.config);
      
      // Actualizar el torneo con las nuevas estadísticas
      const tournamentRef = ref(db, `tournaments/${tournamentId}`);
      await update(tournamentRef, {
        teams: updatedTeams
      });

      console.log('✅ Resultado del partido actualizado en fecha específica');
    } catch (error) {
      console.error('❌ Error updating match result in date:', error);
      throw error;
    }
  }

  // Actualizar el torneo con fechas
  static async getTournamentWithDates(tournamentId: string): Promise<Tournament | null> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) return null;

      const dates = await this.getTournamentDates(tournamentId);
      
      // Combinar todos los partidos de todas las fechas
      const allMatches: Match[] = [];
      dates.forEach(date => {
        if (date.matches && Array.isArray(date.matches)) {
          allMatches.push(...date.matches);
        }
      });

      return {
        ...tournament,
        dates,
        matches: allMatches,
        totalRounds: allMatches.length
      };
    } catch (error) {
      console.error('❌ Error getting tournament with dates:', error);
      throw error;
    }
  }
}