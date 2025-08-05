import React, { useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { TournamentSummary } from '../types/tournament';

export const TournamentDashboard: React.FC = () => {
  const { tournaments, loadTournament, deleteTournament, loadTournamentHistory, loading } = useTournament();

  useEffect(() => {
    // Solo cargar si no hay torneos cargados aún
    if (tournaments.length === 0 && !loading) {
      loadTournamentHistory();
    }
  }, []); // Sin dependencias para evitar bucle infinito

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDuration = (start: any, end?: any): string => {
    if (!start || !end) return '';
    const startDate = start.toDate ? start.toDate() : new Date(start);
    const endDate = end.toDate ? end.toDate() : new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return '<1h';
    }
  };

  const getStatusBadge = (tournament: TournamentSummary) => {
    if (tournament.completedAt) {
      return {
        icon: '✅',
        text: 'Completado',
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    return {
      icon: '🔄',
      text: 'En Progreso',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  };

  const handleLoadTournament = async (tournamentId: string) => {
    await loadTournament(tournamentId);
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (window.confirm(`¿Eliminar "${tournamentName}"? Esta acción no se puede deshacer.`)) {
      await deleteTournament(tournamentId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Cargando torneos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-xl">📊</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Dashboard de Torneos
          </h1>
          <p className="text-sm md:text-base text-gray-600 px-4">
            Gestiona y revisa todos tus torneos de fútbol
          </p>
        </div>

        {/* Statistics Cards */}
        {tournaments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="text-center">
                <div className="text-2xl mb-1">🏆</div>
                <p className="text-xs text-gray-600 mb-1">Total Torneos</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{tournaments.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-xs text-gray-600 mb-1">Completados</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {tournaments.filter(t => t.completedAt).length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="text-center">
                <div className="text-2xl mb-1">🏟️</div>
                <p className="text-xs text-gray-600 mb-1">Total Equipos</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">
                  {tournaments.reduce((acc, t) => acc + t.totalTeams, 0)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="text-center">
                <div className="text-2xl mb-1">⚽</div>
                <p className="text-xs text-gray-600 mb-1">Total Partidos</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">
                  {tournaments.reduce((acc, t) => acc + t.totalMatches, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tournament List */}
        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-8">⚽</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              ¡Comienza tu primer torneo!
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Crea torneos profesionales, gestiona equipos y sigue las estadísticas en tiempo real
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Torneos Personalizables</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📊</span>
                <span>Estadísticas Detalladas</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Resultados en Tiempo Real</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📱</span>
                <span>Responsive Design</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Historial de Torneos
              </h2>
              <div className="text-sm text-gray-500">
                {tournaments.length} torneo{tournaments.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => {
                const status = getStatusBadge(tournament);
                return (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Tournament Header */}
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg truncate">
                          {tournament.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          {status.icon} {status.text}
                        </span>
                      </div>
                    </div>

                    {/* Tournament Info */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center bg-gray-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-gray-900">{tournament.totalTeams}</div>
                          <div className="text-xs text-gray-600">Equipos</div>
                        </div>
                        <div className="text-center bg-gray-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-gray-900">{tournament.totalMatches}</div>
                          <div className="text-xs text-gray-600">Partidos</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Tipo:</span>
                          <span className="font-medium">
                            {tournament.type === 'points' ? 'Por Puntos' : 'Por Victorias'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Creado:</span>
                          <span className="font-medium">{formatDate(tournament.createdAt)}</span>
                        </div>
                        {tournament.completedAt && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Completado:</span>
                              <span className="font-medium">{formatDate(tournament.completedAt)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Duración:</span>
                              <span className="font-medium">{getDuration(tournament.createdAt, tournament.completedAt)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Winner */}
                      {tournament.winner && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-lg">🏆</span>
                            <div className="text-center">
                              <div className="font-semibold text-yellow-800">Campeón</div>
                              <div className="text-yellow-700 font-medium">{tournament.winner}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLoadTournament(tournament.id)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200"
                        >
                          Ver Detalles
                        </button>
                        <button
                          onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition-colors"
                          title="Eliminar torneo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};