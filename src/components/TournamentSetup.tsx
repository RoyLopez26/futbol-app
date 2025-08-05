import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { TournamentConfig } from '../types/tournament';

export const TournamentSetup: React.FC = () => {
  const { createManualTournament, loading } = useTournament();
  const [tournamentName, setTournamentName] = useState('');
  const [teams, setTeams] = useState<string[]>(['', '']);
  const [tournamentType, setTournamentType] = useState<'points' | 'wins'>('points');

  const addTeam = () => {
    if (teams.length < 16) {
      setTeams([...teams, '']);
    }
  };

  const removeTeam = (index: number) => {
    if (teams.length > 2) {
      setTeams(teams.filter((_, i) => i !== index));
    }
  };

  const updateTeam = (index: number, value: string) => {
    const newTeams = [...teams];
    newTeams[index] = value;
    setTeams(newTeams);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tournamentName.trim()) {
      alert('Por favor ingresa un nombre para el torneo');
      return;
    }

    const validTeams = teams.filter(team => team.trim());
    if (validTeams.length < 2) {
      alert('Necesitas al menos 2 equipos para crear un torneo');
      return;
    }

    // Verificar nombres únicos
    const uniqueTeams = [...new Set(validTeams)];
    if (uniqueTeams.length !== validTeams.length) {
      alert('Los nombres de los equipos deben ser únicos');
      return;
    }

    const config: TournamentConfig = {
      type: tournamentType,
      allowTie: true, // Por defecto permitir empates, se preguntará al final si es necesario
      requireAllMatches: false // No requerir que todos jueguen la misma cantidad
    };

    await createManualTournament(tournamentName.trim(), validTeams, config);
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
            Configura tu torneo de fútbol amateur
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
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Tournament Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tipo de Torneo
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  tournamentType === 'points' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="tournamentType"
                    value="points"
                    checked={tournamentType === 'points'}
                    onChange={(e) => setTournamentType(e.target.value as 'points' | 'wins')}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      tournamentType === 'points' ? 'border-green-500' : 'border-gray-300'
                    }`}>
                      {tournamentType === 'points' && (
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">🏆 Por Puntos</div>
                      <div className="text-sm text-gray-500">Victoria: 3pts | Empate: 1pt | Derrota: 0pts</div>
                    </div>
                  </div>
                </label>

                <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  tournamentType === 'wins' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="tournamentType"
                    value="wins"
                    checked={tournamentType === 'wins'}
                    onChange={(e) => setTournamentType(e.target.value as 'points' | 'wins')}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      tournamentType === 'wins' ? 'border-green-500' : 'border-gray-300'
                    }`}>
                      {tournamentType === 'wins' && (
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

            {/* Teams */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Equipos ({teams.filter(t => t.trim()).length})
                </label>
                <button
                  type="button"
                  onClick={addTeam}
                  disabled={teams.length >= 16}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + Agregar Equipo
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {teams.map((team, index) => (
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
                    {teams.length > 2 && (
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