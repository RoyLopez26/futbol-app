import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';

export const BasicTournamentSetup: React.FC = () => {
  const { createBasicTournament, loading } = useTournament();
  const [tournamentName, setTournamentName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tournamentName.trim()) {
      alert('Por favor ingresa un nombre para el torneo');
      return;
    }

    await createBasicTournament(tournamentName.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🏆</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Crear Nuevo Torneo
          </h1>
          <p className="text-gray-600">
            Comienza creando tu torneo, luego podrás agregar fechas y equipos
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Torneo
              </label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Ej: Copa Amigos 2024"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                required
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">
                    Nuevo Sistema de Fechas
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Después de crear el torneo podrás:
                  </p>
                  <ul className="text-blue-700 text-sm mt-2 space-y-1">
                    <li>• Agregar fechas/jornadas al torneo</li>
                    <li>• Seleccionar equipos y tipo por cada fecha</li>
                    <li>• Gestionar partidos dinámicamente</li>
                    <li>• Cerrar fechas cuando estén completas</li>
                  </ul>
                </div>
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
                    Creando Torneo...
                  </div>
                ) : (
                  'Crear Torneo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};