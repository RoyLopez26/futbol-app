import React from 'react';
import { useTournament } from '../context/TournamentContext';
import type { Team } from '../types/tournament';

export const StandingsTable: React.FC = () => {
  const { tournament } = useTournament();

  if (!tournament || !tournament.teams) return null;

  const getPositionIcon = (position: number): string => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const getPositionColor = (position: number): string => {
    switch (position) {
      case 1: return 'bg-yellow-100 border-yellow-300';
      case 2: return 'bg-gray-100 border-gray-300';
      case 3: return 'bg-orange-100 border-orange-300';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📊 Tabla de Posiciones
          </h2>
          <div className="text-sm text-gray-600">
            {tournament.name}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Pos</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Equipo</th>
                <th className="border border-gray-300 px-4 py-2 text-center">PJ</th>
                <th className="border border-gray-300 px-4 py-2 text-center">G</th>
                <th className="border border-gray-300 px-4 py-2 text-center">E</th>
                <th className="border border-gray-300 px-4 py-2 text-center">P</th>
                <th className="border border-gray-300 px-4 py-2 text-center">GF</th>
                <th className="border border-gray-300 px-4 py-2 text-center">GC</th>
                <th className="border border-gray-300 px-4 py-2 text-center">DG</th>
                <th className="border border-gray-300 px-4 py-2 text-center font-bold">
                  {tournament.config.type === 'points' ? 'Pts' : 'Victorias'}
                </th>
              </tr>
            </thead>
            <tbody>
              {tournament.teams.map((team: Team, index: number) => (
                <tr
                  key={team.id}
                  className={`${getPositionColor(index + 1)} hover:bg-gray-50`}
                >
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">{getPositionIcon(index + 1)}</span>
                      <span className="font-bold">{index + 1}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-medium">
                    {team.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {team.matchesPlayed}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-green-600 font-medium">
                    {team.wins}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-yellow-600 font-medium">
                    {team.draws}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-red-600 font-medium">
                    {team.losses}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {team.goalsFor || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {team.goalsAgainst || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className={`font-medium ${
                      (team.goalDifference || 0) > 0 ? 'text-green-600' : 
                      ((team.goalDifference ?? 0) < 0) ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {(team.goalDifference ?? 0) > 0 ? '+' : ''}{team.goalDifference ?? 0}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className="font-bold text-green-500 text-lg">
                      {tournament.config.type === 'points' ? team.points : team.wins}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><strong>PJ:</strong> Partidos Jugados</div>
            <div><strong>G:</strong> Ganados</div>
            <div><strong>E:</strong> Empatados</div>
            <div><strong>P:</strong> Perdidos</div>
            <div><strong>GF:</strong> Goles a Favor</div>
            <div><strong>GC:</strong> Goles en Contra</div>
            <div><strong>DG:</strong> Diferencia de Goles</div>
            <div><strong>{tournament.config.type === 'points' ? 'Pts:' : 'Victorias:'}</strong> {tournament.config.type === 'points' ? 'Puntos (3 por victoria, 1 por empate)' : 'Solo cuentan las victorias'}</div>
          </div>
        </div>

        {tournament.isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">🎉</span>
              <div className="text-lg font-bold text-green-800">
                ¡Campeón: {tournament.teams[0].name}!
              </div>
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};