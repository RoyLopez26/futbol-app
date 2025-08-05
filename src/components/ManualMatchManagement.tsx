import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { MatchResult } from '../types/tournament';

export const ManualMatchManagement: React.FC = () => {
  const { tournament, addMatchResult, loading } = useTournament();
  const [selectedTeam1, setSelectedTeam1] = useState<string>('');
  const [selectedTeam2, setSelectedTeam2] = useState<string>('');
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [showScoreInput, setShowScoreInput] = useState(false);

  if (!tournament) return null;

  const completedMatches = tournament.matches || [];
  const totalMatches = completedMatches.length;

  // Calcular estadísticas por equipo
  const getTeamStats = () => {
    const stats: { [team: string]: { played: number; wins: number; draws: number; losses: number } } = {};
    
    tournament.teams.forEach(team => {
      stats[team.name] = { played: 0, wins: 0, draws: 0, losses: 0 };
    });

    completedMatches.forEach(match => {
      if (match.completed && match.result) {
        stats[match.team1].played++;
        stats[match.team2].played++;
        
        if (match.result === 'team1') {
          stats[match.team1].wins++;
          stats[match.team2].losses++;
        } else if (match.result === 'team2') {
          stats[match.team2].wins++;
          stats[match.team1].losses++;
        } else if (match.result === 'draw') {
          stats[match.team1].draws++;
          stats[match.team2].draws++;
        }
      }
    });

    return stats;
  };

  const teamStats = getTeamStats();

  // Equipos que necesitan más partidos (los que han jugado menos)
  const minMatches = Math.min(...Object.values(teamStats).map(s => s.played));
  const teamsNeedingMatches = tournament.teams
    .filter(team => teamStats[team.name].played === minMatches)
    .sort((a, b) => a.name.localeCompare(b.name));


  const handleResultSubmit = async (result: MatchResult) => {
    if (!selectedTeam1 || !selectedTeam2) return;

    await addMatchResult(selectedTeam1, selectedTeam2, result, team1Score, team2Score);
    setSelectedTeam1('');
    setSelectedTeam2('');
    setShowScoreInput(false);
    setTeam1Score(0);
    setTeam2Score(0);
  };

  const getAvailableOpponents = (team: string) => {
    return tournament.teams.filter(t => t.name !== team);
  };

  const progressPercentage = tournament.teams.length > 0 ? 
    Math.round((totalMatches / (tournament.teams.length * (tournament.teams.length - 1) / 2)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Gestión de Partidos
          </h1>
          <p className="text-gray-600">
            {tournament.name} • {totalMatches} partidos jugados
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Progreso del Torneo</h2>
            <span className="text-sm text-gray-500">{progressPercentage}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Teams needing matches alert */}
        {teamsNeedingMatches.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">⚠️</div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Equipos que necesitan jugar más partidos
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamsNeedingMatches.map(team => (
                <div key={team.name} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {team.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{team.name}</span>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">
                    {teamStats[team.name].played}/{Math.max(3, tournament.teams.length - 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Match Registration */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⚽</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Registrar Nuevo Partido
              </h2>
              <p className="text-gray-600">
                Selecciona los equipos que jugaron
              </p>
            </div>

            {!showScoreInput ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipo 1
                  </label>
                  <select
                    value={selectedTeam1}
                    onChange={(e) => setSelectedTeam1(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un equipo</option>
                    {tournament.teams.map(team => (
                      <option key={team.name} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipo 2
                  </label>
                  <select
                    value={selectedTeam2}
                    onChange={(e) => setSelectedTeam2(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={!selectedTeam1}
                  >
                    <option value="">Selecciona un equipo</option>
                    {selectedTeam1 && getAvailableOpponents(selectedTeam1).map(team => (
                      <option key={team.name} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowScoreInput(true)}
                  disabled={!selectedTeam1 || !selectedTeam2}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Continuar
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="font-semibold text-gray-800">{selectedTeam1}</div>
                      </div>
                      <div className="text-2xl text-gray-400">vs</div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-800">{selectedTeam2}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goles {selectedTeam1}
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTeam1Score(Math.max(0, team1Score - 1))}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={team1Score}
                        onChange={(e) => setTeam1Score(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                      />
                      <button
                        onClick={() => setTeam1Score(team1Score + 1)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goles {selectedTeam2}
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTeam2Score(Math.max(0, team2Score - 1))}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={team2Score}
                        onChange={(e) => setTeam2Score(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                      />
                      <button
                        onClick={() => setTeam2Score(team2Score + 1)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleResultSubmit('team1')}
                    disabled={loading}
                    className="py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                  >
                    Ganó {selectedTeam1}
                  </button>
                  <button
                    onClick={() => handleResultSubmit('draw')}
                    disabled={loading}
                    className="py-3 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 font-medium transition-colors"
                  >
                    Empate
                  </button>
                  <button
                    onClick={() => handleResultSubmit('team2')}
                    disabled={loading}
                    className="py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                  >
                    Ganó {selectedTeam2}
                  </button>
                </div>

                <button
                  onClick={() => setShowScoreInput(false)}
                  className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cambiar Equipos
                </button>
              </div>
            )}
          </div>

          {/* Match History */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Partidos Completados ({completedMatches.length})
              </h2>
            </div>

            {completedMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚽</div>
                <p className="text-gray-500">Aún no hay partidos completados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedMatches.map((match, index) => (
                  <div key={match.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {match.team1} vs {match.team2}
                          </div>
                          <div className="text-sm text-gray-500">
                            {match.team1Score} - {match.team2Score}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          match.result === 'team1' ? 'text-green-600' :
                          match.result === 'team2' ? 'text-green-600' :
                          'text-yellow-600'
                        }`}>
                          {match.result === 'team1' ? `Ganó ${match.team1}` :
                           match.result === 'team2' ? `Ganó ${match.team2}` :
                           'Empate'}
                        </div>
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
  );
};