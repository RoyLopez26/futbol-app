import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import type { TournamentConfig, TournamentDate, Match } from '../types/tournament';

interface TournamentDateManagerProps {
  tournamentId: string;
  dates: TournamentDate[];
}

export const TournamentDateManager: React.FC<TournamentDateManagerProps> = ({ 
  tournamentId, 
  dates 
}) => {
  const { addTournamentDate, closeTournamentDate, addMatchToDateWithBlock, lockMatchesInDate, updateMatchResult, loading } = useTournament();
  
  // Ordenar fechas para mostrar la más reciente primero
  const sortedDates = [...dates].sort((a, b) => {
    // Primero ordenar por fecha de creación (más reciente primero)
    if (a.createdAt && b.createdAt) {
      const timeA = typeof a.createdAt === 'object' && 'seconds' in a.createdAt 
        ? (a.createdAt.seconds as number) * 1000 
        : new Date(a.createdAt as string).getTime();
      const timeB = typeof b.createdAt === 'object' && 'seconds' in b.createdAt 
        ? (b.createdAt.seconds as number) * 1000 
        : new Date(b.createdAt as string).getTime();
      return timeB - timeA;
    }
    // Si no hay fecha de creación, usar el ID como fallback (mayor ID = más reciente)
    return b.id.localeCompare(a.id);
  });
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDateName, setNewDateName] = useState('');
  const [newDateTeams, setNewDateTeams] = useState<string[]>(['', '']);
  const [newDateType, setNewDateType] = useState<'points' | 'wins'>('points');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [savingScore, setSavingScore] = useState<boolean>(false);

  const addTeam = () => {
    if (newDateTeams.length < 16) {
      setNewDateTeams([...newDateTeams, '']);
    }
  };

  const removeTeam = (index: number) => {
    if (newDateTeams.length > 2) {
      setNewDateTeams(newDateTeams.filter((_, i) => i !== index));
    }
  };

  const updateTeam = (index: number, value: string) => {
    const updated = [...newDateTeams];
    updated[index] = value;
    setNewDateTeams(updated);
  };

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDateName.trim()) {
      alert('Por favor ingresa un nombre para la fecha');
      return;
    }

    const validTeams = newDateTeams.filter(team => team.trim());
    if (validTeams.length < 2) {
      alert('Necesitas al menos 2 equipos para la fecha');
      return;
    }

    const uniqueTeams = [...new Set(validTeams)];
    if (uniqueTeams.length !== validTeams.length) {
      alert('Los nombres de los equipos deben ser únicos');
      return;
    }

    const config: TournamentConfig = {
      type: newDateType,
      allowTie: true,
      requireAllMatches: false
    };

    await addTournamentDate(tournamentId, newDateName.trim(), validTeams, config);
    
    // Reset form
    setNewDateName('');
    setNewDateTeams(['', '']);
    setNewDateType('points');
    setShowAddForm(false);
  };

  const handleCloseDate = async (dateId: string, dateName: string) => {
    if (window.confirm(`¿Cerrar la fecha "${dateName}"? No podrás hacer más cambios después.`)) {
      await closeTournamentDate(tournamentId, dateId);
    }
  };

  const handleViewDateStandings = (dateId: string) => {
    navigate(`/tournament/${tournamentId}/standings/${dateId}`);
  };

  // Genera fixture round-robin balanceado evitando partidos consecutivos
  const generateRoundRobinMatches = (teams: string[], blockNumber: number = 1) => {
    const matches: { team1: string; team2: string; block: number; round: number }[] = [];
    const numTeams = teams.length;
    
    if (numTeams < 2) return matches;
    
    // Caso especial para 5 equipos con orden específico
    if (numTeams === 5) {
      const [A, B, C, D, E] = teams;
      const predefinedMatches = [
        { team1: A, team2: B, round: 1 },
        { team1: C, team2: D, round: 1 },
        { team1: E, team2: A, round: 2 },
        { team1: B, team2: C, round: 2 },
        { team1: D, team2: E, round: 3 },
        { team1: A, team2: C, round: 3 },
        { team1: B, team2: D, round: 4 },
        { team1: C, team2: E, round: 4 },
        { team1: A, team2: D, round: 5 },
        { team1: B, team2: E, round: 5 }
      ];
      
      predefinedMatches.forEach(match => {
        matches.push({
          team1: match.team1,
          team2: match.team2,
          block: blockNumber,
          round: match.round
        });
      });
      
      return matches;
    }
    
    // Generar todas las combinaciones únicas posibles
    const allPairs: {team1: string, team2: string}[] = [];
    for (let i = 0; i < numTeams; i++) {
      for (let j = i + 1; j < numTeams; j++) {
        allPairs.push({ team1: teams[i], team2: teams[j] });
      }
    }
    
    // Comenzar con A vs B, C vs D si hay al menos 4 equipos
    const priorityPairs: {team1: string, team2: string}[] = [];
    if (numTeams >= 4) {
      priorityPairs.push({ team1: teams[0], team2: teams[1] }); // A vs B
      priorityPairs.push({ team1: teams[2], team2: teams[3] }); // C vs D
    } else if (numTeams >= 2) {
      priorityPairs.push({ team1: teams[0], team2: teams[1] }); // A vs B
    }
    
    // Reorganizar: poner las parejas prioritarias primero
    const remainingPairs = allPairs.filter(pair => 
      !priorityPairs.some(pp => 
        (pp.team1 === pair.team1 && pp.team2 === pair.team2) ||
        (pp.team1 === pair.team2 && pp.team2 === pair.team1)
      )
    );
    
    const orderedPairs = [...priorityPairs, ...remainingPairs];
    
    // Distribuir en rondas evitando que un equipo juegue más de 1 vez por ronda
    const rounds: {team1: string, team2: string}[][] = [];
    const usedPairs = new Set<string>();
    
    let currentRound = 0;
    while (orderedPairs.some(pair => !usedPairs.has(`${pair.team1}-${pair.team2}`))) {
      if (!rounds[currentRound]) rounds[currentRound] = [];
      const usedTeamsInRound = new Set<string>();
      
      // Intentar agregar parejas en orden, evitando que un equipo juegue más de una vez por ronda
      for (const pair of orderedPairs) {
        const pairKey = `${pair.team1}-${pair.team2}`;
        if (!usedPairs.has(pairKey) && 
            !usedTeamsInRound.has(pair.team1) && 
            !usedTeamsInRound.has(pair.team2)) {
          rounds[currentRound].push(pair);
          usedPairs.add(pairKey);
          usedTeamsInRound.add(pair.team1);
          usedTeamsInRound.add(pair.team2);
        }
      }
      currentRound++;
      
      // Prevenir bucles infinitos
      if (currentRound > numTeams * 2) break;
    }
    
    // Convertir a formato de matches
    rounds.forEach((roundPairs, roundIndex) => {
      roundPairs.forEach(pair => {
        matches.push({
          team1: pair.team1,
          team2: pair.team2,
          block: blockNumber,
          round: roundIndex + 1
        });
      });
    });
    
    return matches;
  };

  const handleGenerateMatches = async (date: TournamentDate) => {
    const teams = date.teams;
    const existingMatches = date.matches || [];
    const isVolverAJugar = existingMatches.length > 0 && existingMatches.every(m => m.completed);
    
    if (isVolverAJugar) {
      // Si es "Volver a jugar", bloquear todos los partidos existentes
      await lockExistingMatches(date.id, existingMatches);
    }
    
    // Determinar el próximo número de bloque
    const maxBlock = existingMatches.length > 0 
      ? Math.max(...existingMatches.map(m => m.block || 1))
      : 0;
    const nextBlock = maxBlock + 1;
    
    const allMatches = [];
    
    if (isVolverAJugar) {
      // Replicar exactamente los mismos enfrentamientos del bloque anterior
      const previousBlockMatches = existingMatches.filter(m => (m.block || 1) === maxBlock);
      
      // Calcular la última ronda utilizada en todos los bloques
      const maxRound = existingMatches.length > 0 
        ? Math.max(...existingMatches.map(m => m.round))
        : 0;
      
      // Ordenar los partidos del bloque anterior por ronda para mantener el orden
      const sortedPreviousMatches = previousBlockMatches.sort((a, b) => a.round - b.round);
      
      // Crear un mapeo de las rondas originales del bloque anterior
      const uniqueRounds = [...new Set(sortedPreviousMatches.map(m => m.round))].sort((a, b) => a - b);
      const roundMapping: Record<number, number> = {};
      
      // Mapear cada ronda original a una nueva ronda consecutiva
      uniqueRounds.forEach((originalRound, index) => {
        roundMapping[originalRound] = maxRound + 1 + index;
      });
      
      // Asignar las nuevas rondas basadas en el mapeo
      sortedPreviousMatches.forEach((previousMatch) => {
        allMatches.push({
          team1: previousMatch.team1,
          team2: previousMatch.team2,
          block: nextBlock,
          round: roundMapping[previousMatch.round]
        });
      });
      
    } else {
      // Primera vez: generar fixture nuevo
      const blockMatches = generateRoundRobinMatches(teams, nextBlock);
      allMatches.push(...blockMatches);
    }
    
    // Verificar que no haya duplicados en el nuevo bloque
    const pairSet = new Set<string>();
    const duplicates: string[] = [];
    
    allMatches.forEach(match => {
      const pairKey1 = `${match.team1}-${match.team2}`;
      const pairKey2 = `${match.team2}-${match.team1}`;
      
      if (pairSet.has(pairKey1) || pairSet.has(pairKey2)) {
        duplicates.push(`${match.team1} vs ${match.team2}`);
      } else {
        pairSet.add(pairKey1);
      }
    });
    
    if (duplicates.length > 0) {
      console.error('🚫 DUPLICADOS ENCONTRADOS:', duplicates);
    }
    
    
    // Crear todos los partidos nuevos en el orden balanceado
    for (const match of allMatches) {
      await addMatchToDateWithBlock(tournamentId, date.id, match.team1, match.team2, match.block || nextBlock);
    }
  };

  // Nueva función para bloquear partidos existentes
  const lockExistingMatches = async (dateId: string, existingMatches: Match[]) => {
    const matchIds = existingMatches.map(match => match.id);
    await lockMatchesInDate(tournamentId, dateId, matchIds);
  };

  const handleScoreSubmit = async (match: Match) => {
    if (team1Score < 0 || team2Score < 0) {
      alert('Los goles no pueden ser negativos');
      return;
    }

    setSavingScore(true);
    
    try {
      let result: 'team1' | 'team2' | 'draw';
      
      if (team1Score > team2Score) {
        result = 'team1';
      } else if (team2Score > team1Score) {
        result = 'team2';
      } else {
        result = 'draw';
      }

      await updateMatchResult(match.id, result, team1Score, team2Score);
      setEditingMatch(null);
      setTeam1Score(0);
      setTeam2Score(0);
    } catch (error) {
      console.error('Error guardando resultado:', error);
      alert('Error al guardar el resultado. Inténtalo de nuevo.');
    } finally {
      setSavingScore(false);
    }
  };

  const startEditingMatch = (match: Match) => {
    setEditingMatch(match.id);
    setTeam1Score(match.team1Score || 0);
    setTeam2Score(match.team2Score || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">📅</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Gestión de Fechas
          </h1>
          <p className="text-gray-600">
            Administra las fechas y jornadas de tu torneo
          </p>
        </div>

        {/* Add Date Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
          >
            {showAddForm ? 'Cancelar' : '+ Agregar Fecha'}
          </button>
        </div>

        {/* Add Date Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Nueva Fecha</h3>
            <form onSubmit={handleAddDate} className="space-y-6">
              {/* Date Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Fecha
                </label>
                <input
                  type="text"
                  value={newDateName}
                  onChange={(e) => setNewDateName(e.target.value)}
                  placeholder="Ej: Fecha 1, Jornada Inicial, etc."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  required
                />
              </div>

              {/* Tournament Type for this date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tipo de Torneo para esta Fecha
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    newDateType === 'points' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="dateType"
                      value="points"
                      checked={newDateType === 'points'}
                      onChange={(e) => setNewDateType(e.target.value as 'points' | 'wins')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        newDateType === 'points' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {newDateType === 'points' && (
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">🏆 Por Puntos</div>
                        <div className="text-sm text-gray-500">Victoria: 3pts | Empate: 1pt</div>
                      </div>
                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    newDateType === 'wins' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="dateType"
                      value="wins"
                      checked={newDateType === 'wins'}
                      onChange={(e) => setNewDateType(e.target.value as 'points' | 'wins')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        newDateType === 'wins' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {newDateType === 'wins' && (
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">⚡ Por Victorias</div>
                        <div className="text-sm text-gray-500">Solo cuentan las victorias</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>


              {/* Teams for this date */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Equipos para esta Fecha ({newDateTeams.filter(t => t.trim()).length})
                  </label>
                  <button
                    type="button"
                    onClick={addTeam}
                    disabled={newDateTeams.length >= 16}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + Agregar Equipo
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {newDateTeams.map((team, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={team}
                          onChange={(e) => updateTeam(index, e.target.value)}
                          placeholder={`Equipo ${index + 1}`}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                        />
                      </div>
                      {newDateTeams.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeTeam(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Agregando Fecha...
                    </div>
                  ) : (
                    'Agregar Fecha'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dates List */}
        <div className="space-y-6">
          {dates.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-8">📅</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                ¡Agrega tu primera fecha!
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Las fechas te permiten organizar tu torneo por jornadas, cada una con sus propios equipos y reglas
              </p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div
                key={date.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Date Header */}
                <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">
                      {date.name}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        date.closed 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {date.closed ? '🔒 Cerrada' : '🔓 Abierta'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-800">
                        {date.config.type === 'points' ? '🏆 Puntos' : '⚡ Victorias'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{date.teams.length}</div>
                      <div className="text-xs text-gray-600">Equipos</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{date.totalMatches}</div>
                      <div className="text-xs text-gray-600">Partidos</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{date.completedMatches}</div>
                      <div className="text-xs text-gray-600">Completados</div>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Equipos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {date.teams.map((team, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Matches */}
                  {date.matches && date.matches.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                        ⚽ Partidos ({date.completedMatches}/{date.totalMatches} completados)
                      </h4>
                      <div className="space-y-6 max-h-80 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                        {/* Agrupar partidos por bloque */}
                        {Array.from(new Set(date.matches.map(m => m.block || 1))).sort((a, b) => a - b).map(block => {
                          const blockMatches = date.matches.filter(m => (m.block || 1) === block);
                          const isBlockLocked = blockMatches.some(m => m.locked);
                          return (
                            <div key={block} className="space-y-3">
                              <div className={`text-sm font-bold px-4 py-2 rounded-full inline-flex items-center space-x-2 ${
                                isBlockLocked 
                                  ? 'text-red-700 bg-red-100 border border-red-200' 
                                  : 'text-blue-600 bg-blue-100'
                              }`}>
                                <span>{isBlockLocked ? '🔒' : '🎮'}</span>
                                <span>Bloque {block} {isBlockLocked ? '(Bloqueado)' : '(Activo)'}</span>
                              </div>
                              
                              {/* Agrupar por ronda dentro del bloque */}
                              <div className="space-y-2 pl-4">
                                {Array.from(new Set(blockMatches.map(m => m.round))).sort((a, b) => a - b).map(round => (
                                  <div key={`${block}-${round}`} className="space-y-2">
                                    <div className="text-xs font-medium text-gray-500 px-2">
                                      Ronda {round}
                                    </div>
                                    <div className="space-y-2 pl-2">
                                      {blockMatches.filter(m => m.round === round).map((match) => (
                                        <div
                                          key={match.id}
                                          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                            match.locked 
                                              ? 'bg-red-50 border-red-200 opacity-75'
                                              : match.completed 
                                                ? 'bg-green-50 border-green-200' 
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                          }`}
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                              <div className={`text-sm font-bold flex items-center space-x-2 ${
                                                match.locked ? 'text-red-700' : 'text-gray-800'
                                              }`}>
                                                {match.locked && <span className="text-xs">🔒</span>}
                                                <span>{match.team1} 🆚 {match.team2}</span>
                                              </div>
                                              {match.completed && (
                                                <div className={`text-lg font-bold px-3 py-1 rounded-full ${
                                                  match.locked 
                                                    ? 'text-red-600 bg-red-100' 
                                                    : 'text-green-600 bg-green-100'
                                                }`}>
                                                  {match.team1Score} - {match.team2Score}
                                                </div>
                                              )}
                                            </div>
                                            {match.completed && (
                                              <div className={`text-xs mt-1 ${
                                                match.locked ? 'text-red-500' : 'text-gray-500'
                                              }`}>
                                                Ganador: {
                                                  match.result === 'team1' ? match.team1 : 
                                                  match.result === 'team2' ? match.team2 : 'Empate'
                                                }
                                              </div>
                                            )}
                                          </div>
                            
                            {!date.closed && !match.locked && (
                              <div className="flex items-center space-x-2">
                                {editingMatch === match.id ? (
                                  <div className="flex flex-col space-y-2 bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                                    <div className="text-xs font-medium text-blue-800 text-center mb-1">
                                      Anotar Goles
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">{match.team1}</div>
                                        <input
                                          type="number"
                                          min="0"
                                          max="20"
                                          value={team1Score}
                                          onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                                          className="w-16 px-2 py-2 text-center text-lg font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div className="text-2xl font-bold text-gray-400">-</div>
                                      <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">{match.team2}</div>
                                        <input
                                          type="number"
                                          min="0"
                                          max="20"
                                          value={team2Score}
                                          onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                                          className="w-16 px-2 py-2 text-center text-lg font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleScoreSubmit(match)}
                                        disabled={savingScore}
                                        className="flex-1 px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {savingScore ? (
                                          <div className="flex items-center justify-center space-x-1">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Guardando...</span>
                                          </div>
                                        ) : (
                                          '✅ Guardar'
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingMatch(null);
                                          setTeam1Score(0);
                                          setTeam2Score(0);
                                        }}
                                        disabled={savingScore}
                                        className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        ❌ Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditingMatch(match)}
                                    className={`px-4 py-2 font-medium rounded-lg transition-colors shadow-sm ${
                                      match.completed
                                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                  >
                                    {match.completed ? '✏️ Editar' : '⚽ Anotar'}
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Mensaje para partidos bloqueados */}
                            {match.locked && (
                              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                🔒 Partido bloqueado - No editable
                              </div>
                            )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!date.closed && (
                    <div className="flex flex-col space-y-3">
                      <div className="flex space-x-3">
                        {(!date.matches || date.matches.length === 0) ? (
                          <button
                            onClick={() => handleGenerateMatches(date)}
                            className="flex-1 bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            🎯 Generar Partidos
                          </button>
                        ) : (
                          <div className="flex-1 text-center py-2 px-4 bg-green-100 text-green-800 rounded-lg font-medium">
                            ✅ {date.totalMatches} Partidos Listos
                          </div>
                        )}
                        
                        {/* Botón Ver Tabla - solo si hay partidos */}
                        {date.matches && date.matches.length > 0 && (
                          <button
                            onClick={() => handleViewDateStandings(date.id)}
                            className="bg-green-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            📊 Ver Tabla
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleCloseDate(date.id, date.name)}
                          className="bg-orange-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          🔒 Cerrar Fecha
                        </button>
                      </div>
                      
                      {/* Botón Volver a Jugar cuando todos los partidos estén completados */}
                      {date.matches && date.matches.length > 0 && date.completedMatches === date.totalMatches && (
                        <button
                          onClick={() => handleGenerateMatches(date)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
                        >
                          🔄 Volver a Jugar (Mismo Fixture)
                        </button>
                      )}
                    </div>
                  )}
                  
                  {date.closed && (
                    <div className="flex flex-col space-y-3">
                      <div className="text-center py-2 px-4 bg-gray-100 text-gray-600 rounded-lg font-medium">
                        🔒 Fecha Cerrada - No se pueden hacer cambios
                      </div>
                      
                      {/* Botón Ver Tabla para fechas cerradas */}
                      {date.matches && date.matches.length > 0 && (
                        <button
                          onClick={() => handleViewDateStandings(date.id)}
                          className="bg-green-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          📊 Ver Tabla de esta Fecha
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};