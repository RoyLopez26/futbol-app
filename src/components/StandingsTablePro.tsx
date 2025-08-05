import React from 'react';
import { useTournament } from '../context/TournamentContext';
import type { Team } from '../types/tournament';

export const StandingsTablePro: React.FC = () => {
  const { tournament } = useTournament();

  if (!tournament || !tournament.teams) return null;

  const getPositionIcon = (position: number): string => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return position.toString();
    }
  };

  const getPositionStyle = (position: number): string => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRowStyle = (position: number): string => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3: return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default: return 'bg-white border-gray-200';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-6 shadow-lg">
            <span className="text-3xl">🏆</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Tabla de Posiciones
          </h1>
          <p className="text-xl text-gray-600">
            {tournament.name} • {tournament.config.type === 'points' ? 'Por Puntos' : 'Por Victorias'}
          </p>
        </div>

        {/* Tournament Status */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">📊</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Estado del Torneo</h3>
                  <p className="text-gray-600">
                    {tournament.matches.filter(m => m.completed).length} de {tournament.matches.length} partidos completados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Progreso</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((tournament.matches.filter(m => m.completed).length / tournament.matches.length) * 100)}%
                </div>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(tournament.matches.filter(m => m.completed).length / tournament.matches.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Standings Table */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">🏆</span>
              Clasificación General
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Pos</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Equipo</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">PJ</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">G</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">E</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">P</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">GF</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">GC</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">DG</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    {tournament.config.type === 'points' ? 'Pts' : 'V'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tournament.teams.map((team: Team, index: number) => (
                  <tr
                    key={team.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${getRowStyle(index + 1)}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getPositionStyle(index + 1)}`}>
                          {index + 1 <= 3 ? getPositionIcon(index + 1) : index + 1}
                        </div>
                        {index + 1 <= 3 && (
                          <div className="text-xs text-gray-500">
                            {index + 1 === 1 ? 'Campeón' : index + 1 === 2 ? 'Subcampeón' : 'Tercer lugar'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">🏟️</div>
                        <div>
                          <div className="font-bold text-gray-900">{team.name}</div>
                          <div className="text-sm text-gray-500">
                            {team.matchesPlayed} partidos jugados
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg font-semibold text-gray-900">{team.matchesPlayed}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg font-semibold text-green-600">{team.wins}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg font-semibold text-yellow-600">{team.draws}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg font-semibold text-red-600">{team.losses}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg font-semibold text-gray-900">{team.goalsFor || 0}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg font-semibold text-gray-900">{team.goalsAgainst || 0}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`text-lg font-semibold ${
                        (team.goalDifference || 0) > 0 ? 'text-green-600' : 
                        (team.goalDifference || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(team.goalDifference || 0) > 0 ? '+' : ''}{team.goalDifference || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {tournament.config.type === 'points' ? team.points : team.wins}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-xs text-gray-600">
              <div><strong>PJ:</strong> Partidos Jugados</div>
              <div><strong>G:</strong> Ganados</div>
              <div><strong>E:</strong> Empatados</div>
              <div><strong>P:</strong> Perdidos</div>
              <div><strong>GF:</strong> Goles a Favor</div>
              <div><strong>GC:</strong> Goles en Contra</div>
              <div><strong>DG:</strong> Diferencia de Goles</div>
              <div><strong>{tournament.config.type === 'points' ? 'Pts' : 'V'}:</strong> {tournament.config.type === 'points' ? 'Puntos' : 'Victorias'}</div>
            </div>
          </div>
        </div>

        {/* Tournament Status */}
        {tournament.isComplete && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-4">¡Torneo Completado!</h2>
            <div className="text-xl text-green-100 mb-4">
              🏆 Campeón: {tournament.winner || tournament.teams[0].name}
            </div>
            {tournament.runners && tournament.runners.length > 0 && (
              <div className="text-lg text-green-200">
                🥈 Subcampeones: {tournament.runners.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Máximo Goleador</p>
                <p className="text-lg font-bold text-green-600">
                  {tournament.teams.reduce((prev, current) => 
                    (prev.goalsFor || 0) > (current.goalsFor || 0) ? prev : current
                  ).name}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.max(...tournament.teams.map(t => t.goalsFor || 0))} goles
                </p>
              </div>
              <div className="text-3xl">⚽</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mejor Defensa</p>
                <p className="text-lg font-bold text-blue-600">
                  {tournament.teams.reduce((prev, current) => 
                    (prev.goalsAgainst || 0) < (current.goalsAgainst || 0) ? prev : current
                  ).name}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.min(...tournament.teams.map(t => t.goalsAgainst || 0))} goles en contra
                </p>
              </div>
              <div className="text-3xl">🛡️</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Más Partidos</p>
                <p className="text-lg font-bold text-purple-600">
                  {tournament.teams.reduce((prev, current) => 
                    prev.matchesPlayed > current.matchesPlayed ? prev : current
                  ).name}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.max(...tournament.teams.map(t => t.matchesPlayed))} partidos
                </p>
              </div>
              <div className="text-3xl">🏟️</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};