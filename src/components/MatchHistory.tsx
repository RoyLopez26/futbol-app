import React from 'react';
import { useTournament } from '../context/TournamentContext';
import type { Match } from '../types/tournament';

export const MatchHistory: React.FC = () => {
  const { tournament } = useTournament();

  if (!tournament) return null;

  const completedMatches = tournament.matches.filter(match => match.completed);
  const pendingMatches = tournament.matches.filter(match => !match.completed);

  const getResultIcon = (match: Match): string => {
    switch (match.result) {
      case 'team1': return '🟢';
      case 'team2': return '🔴';
      case 'draw': return '🟡';
      default: return '⚪';
    }
  };

  const getResultText = (match: Match): string => {
    switch (match.result) {
      case 'team1': return `Victoria ${match.team1}`;
      case 'team2': return `Victoria ${match.team2}`;
      case 'draw': return 'Empate';
      default: return 'Pendiente';
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📈 Historial de Partidos
          </h2>
          <div className="text-sm text-gray-600">
            {completedMatches.length} / {tournament.matches.length} completados
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso del Torneo</span>
            <span>{Math.round((completedMatches.length / tournament.matches.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedMatches.length / tournament.matches.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Completed Matches */}
          {completedMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                Partidos Completados ({completedMatches.length})
              </h3>
              <div className="space-y-3">
                {completedMatches.map((match) => (
                  <div
                    key={match.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getResultIcon(match)}</div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {match.team1} {match.team1Score} - {match.team2Score} {match.team2}
                          </div>
                          <div className="text-sm text-gray-600">
                            Ronda {match.round} • {getResultText(match)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {formatDate(match.completedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Matches */}
          {pendingMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-yellow-600 mr-2">⏳</span>
                Partidos Pendientes ({pendingMatches.length})
              </h3>
              <div className="space-y-3">
                {pendingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">⚽</div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {match.team1} vs {match.team2}
                          </div>
                          <div className="text-sm text-gray-600">
                            Ronda {match.round} • Por jugar
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Pendiente
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tournament Summary */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📊 Resumen del Torneo</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-800">Total Partidos</div>
              <div className="text-blue-600">{tournament.matches.length}</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Completados</div>
              <div className="text-blue-600">{completedMatches.length}</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Pendientes</div>
              <div className="text-blue-600">{pendingMatches.length}</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Equipos</div>
              <div className="text-blue-600">{tournament.teams.length}</div>
            </div>
          </div>
        </div>

        {tournament.isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-2xl mb-2">🎉</div>
            <div className="font-bold text-green-800">
              ¡Torneo Completado!
            </div>
            <div className="text-green-600 mt-1">
              Todos los partidos han sido jugados
            </div>
          </div>
        )}
      </div>
    </div>
  );
};