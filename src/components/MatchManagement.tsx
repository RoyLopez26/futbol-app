import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { Match, MatchResult } from '../types/tournament';

export const MatchManagement: React.FC = () => {
  const { tournament, updateMatchResult, loading } = useTournament();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);

  if (!tournament) return null;

  const pendingMatches = tournament.matches.filter(match => !match.completed);
  const completedMatches = tournament.matches.filter(match => match.completed);

  // Calcular qué equipos necesitan más partidos
  const getTeamMatchCounts = () => {
    const counts: { [team: string]: { played: number; expected: number } } = {};
    const expectedMatches = tournament.teams.length - 1; // Round-robin

    tournament.teams.forEach(team => {
      counts[team.name] = { played: 0, expected: expectedMatches };
    });

    tournament.matches.forEach(match => {
      if (match.completed) {
        counts[match.team1].played++;
        counts[match.team2].played++;
      }
    });

    return counts;
  };

  const teamMatchCounts = getTeamMatchCounts();
  const teamsNeedingMatches = Object.entries(teamMatchCounts)
    .filter(([_, counts]) => counts.played < counts.expected)
    .sort(([_, a], [__, b]) => a.played - b.played);

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);
    setTeam1Score(match.team1Score || 0);
    setTeam2Score(match.team2Score || 0);
  };

  const handleResultSubmit = async (result: MatchResult) => {
    if (!selectedMatch) return;

    await updateMatchResult(selectedMatch.id, result, team1Score, team2Score);
    setSelectedMatch(null);
    setTeam1Score(0);
    setTeam2Score(0);
  };

  const getMatchResult = (): MatchResult => {
    if (team1Score > team2Score) return 'team1';
    if (team2Score > team1Score) return 'team2';
    return 'draw';
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (tournament.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h1 className="text-4xl font-bold text-white mb-4">¡Torneo Completado!</h1>
              <p className="text-xl text-yellow-100">Todos los partidos han terminado</p>
            </div>
            <div className="p-8 text-center">
              <div className="text-3xl font-bold text-green-600 mb-4">
                🥇 Campeón: {tournament.winner || tournament.teams[0].name}
              </div>
              {tournament.runners && tournament.runners.length > 0 && (
                <div className="text-xl text-gray-600">
                  🥈 Subcampeones: {tournament.runners.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Gestión de Partidos
          </h1>
          <p className="text-xl text-gray-600">
            {tournament.name} • {completedMatches.length} / {tournament.matches.length} partidos completados
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Progreso del Torneo</h3>
              <span className="text-sm text-gray-600">
                {Math.round((completedMatches.length / tournament.matches.length) * 100)}% completado
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedMatches.length / tournament.matches.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Teams Needing Matches Alert */}
        {teamsNeedingMatches.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-bold text-yellow-800">Equipos que necesitan jugar más partidos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamsNeedingMatches.map(([team, counts]) => (
                  <div key={team} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🏟️</span>
                      <span className="font-medium">{team}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-orange-600 font-bold">{counts.played}</span>
                      <span className="text-gray-500">/{counts.expected}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Match Registration */}
          <div className="space-y-6">
            {selectedMatch ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">
                    Registrar Resultado - Ronda {selectedMatch.round}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-center space-x-8 mb-8">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-800 mb-4">
                        {selectedMatch.team1}
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setTeam1Score(Math.max(0, team1Score - 1))}
                          className="w-10 h-10 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-colors"
                        >
                          -
                        </button>
                        <div className="text-4xl font-bold text-green-600 min-w-[4rem] text-center bg-gray-50 py-2 px-4 rounded-xl">
                          {team1Score}
                        </div>
                        <button
                          onClick={() => setTeam1Score(team1Score + 1)}
                          className="w-10 h-10 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-4xl">⚽</div>

                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-800 mb-4">
                        {selectedMatch.team2}
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setTeam2Score(Math.max(0, team2Score - 1))}
                          className="w-10 h-10 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-colors"
                        >
                          -
                        </button>
                        <div className="text-4xl font-bold text-green-600 min-w-[4rem] text-center bg-gray-50 py-2 px-4 rounded-xl">
                          {team2Score}
                        </div>
                        <button
                          onClick={() => setTeam2Score(team2Score + 1)}
                          className="w-10 h-10 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="text-lg font-semibold text-gray-700">
                      Resultado: {team1Score === team2Score ? 'Empate' : 
                                  team1Score > team2Score ? `Victoria ${selectedMatch.team1}` : 
                                  `Victoria ${selectedMatch.team2}`}
                    </div>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => handleResultSubmit(getMatchResult())}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Guardando...' : 'Confirmar Resultado'}
                      </button>
                      <button
                        onClick={() => setSelectedMatch(null)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">⚽</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Selecciona un partido para registrar
                </h3>
                <p className="text-gray-600">
                  Elige un partido pendiente de la lista para registrar el resultado
                </p>
              </div>
            )}

            {/* Pending Matches */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
                <h3 className="text-xl font-bold text-white">
                  Partidos Pendientes ({pendingMatches.length})
                </h3>
              </div>
              <div className="p-6">
                {pendingMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <p className="text-gray-600">¡Todos los partidos han sido completados!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingMatches.map((match) => (
                      <div
                        key={match.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedMatch?.id === match.id
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => handleMatchSelect(match)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">⚽</span>
                            <span className="font-medium">
                              {match.team1} vs {match.team2}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Ronda {match.round}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completed Matches */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                Partidos Completados ({completedMatches.length})
              </h3>
            </div>
            <div className="p-6">
              {completedMatches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏟️</div>
                  <p className="text-gray-600">Aún no hay partidos completados</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {completedMatches.map((match) => (
                    <div
                      key={match.id}
                      className="p-4 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">✅</span>
                          <div>
                            <div className="font-medium">
                              {match.team1} {match.team1Score} - {match.team2Score} {match.team2}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(match.completedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {match.result === 'team1' ? `Victoria ${match.team1}` : 
                           match.result === 'team2' ? `Victoria ${match.team2}` : 'Empate'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};