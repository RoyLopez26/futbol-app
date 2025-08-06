import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import type { TournamentConfig, TournamentType } from '../types/tournament';

export const TournamentCreator: React.FC = () => {
  const { createTournament, loading, error } = useTournament();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentType, setTournamentType] = useState<TournamentType>('points');
  const [allowTie, setAllowTie] = useState(false);
  const [teamCount, setTeamCount] = useState(4);
  const [teamNames, setTeamNames] = useState<string[]>(['', '', '', '']);

  const updateTeamCount = (count: number) => {
    setTeamCount(count);
    const newTeamNames = Array.from({ length: count }, (_, i) => 
      teamNames[i] || ''
    );
    setTeamNames(newTeamNames);
  };

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
  };

  const validateStep1 = (): boolean => {
    if (!tournamentName.trim()) return false;
    if (teamCount < 2) return false;
    if (teamNames.some(name => !name.trim())) return false;
    
    const uniqueNames = new Set(teamNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== teamNames.length) return false;
    
    return true;
  };

  const handleCreateTournament = async () => {
    if (!validateStep1()) return;

    const config: TournamentConfig = {
      type: tournamentType,
      allowTie,
      requireAllMatches: true
    };

    const trimmedNames = teamNames.map(name => name.trim());
    try {
      const tournamentId = await createTournament(tournamentName.trim(), trimmedNames, config);
      
      // Redirigir a fechas después de crear el torneo
      navigate(`/tournament/${tournamentId}/dates`);
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const getTournamentTypeIcon = (type: TournamentType) => {
    return type === 'points' ? '🏆' : '⚡';
  };

  const getTournamentTypeDescription = (type: TournamentType) => {
    return type === 'points' 
      ? 'Victoria: 3pts | Empate: 1pt | Derrota: 0pts'
      : 'Solo cuentan las victorias, empates no suman puntos';
  };

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-6 shadow-lg">
              <span className="text-3xl">⚽</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Crear Nuevo Torneo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Configura tu torneo profesional de fútbol con todas las opciones avanzadas
            </p>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3">📋</span>
                Configuración del Torneo
              </h2>
            </div>

            <div className="p-8 space-y-8">
              {/* Tournament Name */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-800">
                  Nombre del Torneo
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors"
                  placeholder="Ej: Copa Champions League 2024"
                />
              </div>

              {/* Team Count */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800">
                  Número de Equipos
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="2"
                    max="16"
                    value={teamCount}
                    onChange={(e) => updateTeamCount(parseInt(e.target.value) || 2)}
                    className="w-24 px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors text-center font-bold"
                  />
                  <span className="text-gray-600">equipos participantes</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[3, 4, 6, 8, 10, 12].map(count => (
                    <button
                      key={count}
                      onClick={() => updateTeamCount(count)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        teamCount === count
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Names */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800">
                  Nombres de los Equipos
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamNames.map((name, index) => (
                    <div key={index} className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleTeamNameChange(index, e.target.value)}
                        className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors"
                        placeholder={`Equipo ${index + 1}`}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <span className="text-lg">🏟️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tournament Type */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800">
                  Tipo de Torneo
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setTournamentType('points')}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      tournamentType === 'points'
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getTournamentTypeIcon('points')}</span>
                      <h3 className="text-lg font-bold text-gray-800">Por Puntos</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {getTournamentTypeDescription('points')}
                    </p>
                  </div>
                  
                  <div
                    onClick={() => setTournamentType('wins')}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      tournamentType === 'wins'
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getTournamentTypeIcon('wins')}</span>
                      <h3 className="text-lg font-bold text-gray-800">Por Victorias</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {getTournamentTypeDescription('wins')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Allow Tie */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowTie"
                    checked={allowTie}
                    onChange={(e) => setAllowTie(e.target.checked)}
                    className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                  />
                  <label htmlFor="allowTie" className="text-lg font-semibold text-gray-800">
                    Permitir empates en el campeonato
                  </label>
                </div>
                <p className="text-gray-600 text-sm ml-8">
                  Si está desactivado, se jugarán partidos de desempate automáticamente
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">❌</span>
                    <span className="text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!validateStep1()}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Continuar a Revisión →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Review
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-6 shadow-lg">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Revisar Configuración
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Confirma los detalles antes de crear tu torneo
          </p>
        </div>

        {/* Review Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-8 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">📊</span>
              Resumen del Torneo
            </h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tournament Info */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Información General</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-semibold">{tournamentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-semibold">
                        {tournamentType === 'points' ? 'Por Puntos' : 'Por Victorias'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Equipos:</span>
                      <span className="font-semibold">{teamCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Partidos:</span>
                      <span className="font-semibold">{(teamCount * (teamCount - 1)) / 2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Empates:</span>
                      <span className="font-semibold">{allowTie ? 'Permitidos' : 'Con desempate'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teams List */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Equipos Participantes</h3>
                  <div className="space-y-2">
                    {teamNames.map((team, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-lg">🏟️</span>
                        <span className="font-medium">{team}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">❌</span>
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
              >
                ← Volver a Editar
              </button>
              <button
                onClick={handleCreateTournament}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creando...</span>
                  </span>
                ) : (
                  '🏆 Crear Torneo'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};