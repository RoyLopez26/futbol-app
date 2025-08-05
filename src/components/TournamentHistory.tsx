import React, { useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { TournamentSummary } from '../types/tournament';

export const TournamentHistory: React.FC = () => {
  const { tournaments, loadTournament, deleteTournament, loadTournamentHistory, loading } = useTournament();

  useEffect(() => {
    if (tournaments.length === 0 && !loading) {
      loadTournamentHistory();
    }
  }, []);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🏆</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Historial de Torneos
          </h1>
          <p className="text-gray-600 text-lg">
            Gestiona y revisa todos tus torneos de fútbol
          </p>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-8">⚽</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              ¡Comienza tu primer torneo!
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Crea torneos profesionales con el nuevo sistema de fechas
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Tus Torneos
              </h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {tournaments.length} torneo{tournaments.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => {
                const status = getStatusBadge(tournament);
                return (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                          {status.icon} {status.text}
                        </span>
                        <div className="text-white text-xs font-medium">
                          {tournament.type === 'points' ? '🏆 Puntos' : '⚡ Victorias'}
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-xl mb-1 truncate">
                        {tournament.name}
                      </h3>
                      <p className="text-emerald-100 text-sm">
                        {formatDate(tournament.createdAt)}
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center bg-gray-50 rounded-xl p-4">
                          <div className="text-3xl font-bold text-gray-900 mb-1">{tournament.totalTeams}</div>
                          <div className="text-xs text-gray-600 font-medium">Equipos</div>
                        </div>
                        <div className="text-center bg-gray-50 rounded-xl p-4">
                          <div className="text-3xl font-bold text-gray-900 mb-1">{tournament.totalMatches}</div>
                          <div className="text-xs text-gray-600 font-medium">Partidos</div>
                        </div>
                      </div>

                      {tournament.winner && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-2xl">🏆</span>
                            <div className="text-center">
                              <div className="font-bold text-yellow-800 text-sm">Campeón</div>
                              <div className="text-yellow-700 font-bold">{tournament.winner}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleLoadTournament(tournament.id)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-4 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Ver Detalles
                        </button>
                        <button
                          onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105"
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