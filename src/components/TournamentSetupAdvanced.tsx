import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import type { TournamentConfig, MatchPairing, TournamentType } from '../types/tournament';

export const TournamentSetupAdvanced: React.FC = () => {
  const { 
    createTournament, 
    createCustomTournament, 
    validateTournament, 
    generateAllMatches, 
    loading, 
    error
  } = useTournament();
  const navigate = useNavigate();

  const [tournamentName, setTournamentName] = useState('');
  const [teamCount, setTeamCount] = useState<3 | 4>(3);
  const [teamNames, setTeamNames] = useState<string[]>(['', '', '']);
  const [tournamentType, setTournamentType] = useState<TournamentType>('points');
  const [allowTie, setAllowTie] = useState(false);
  const [customMatches, setCustomMatches] = useState(false);
  const [matches, setMatches] = useState<MatchPairing[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const handleTeamCountChange = (count: 3 | 4) => {
    setTeamCount(count);
    if (count === 3) {
      setTeamNames(['', '', '']);
    } else {
      setTeamNames(['', '', '', '']);
    }
    setMatches([]);
  };

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
    
    // Si hay cambios en los nombres, regenerar partidos automáticos
    if (!customMatches && newTeamNames.every(n => n.trim())) {
      const newMatches = generateAllMatches(newTeamNames.map(n => n.trim()));
      setMatches(newMatches);
    }
  };

  const validateStep1 = (): boolean => {
    if (!tournamentName.trim()) return false;
    if (teamNames.some(name => !name.trim())) return false;
    
    const uniqueNames = new Set(teamNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== teamNames.length) return false;
    
    return true;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      const trimmedNames = teamNames.map(name => name.trim());
      if (!customMatches) {
        const allMatches = generateAllMatches(trimmedNames);
        setMatches(allMatches);
      }
      setCurrentStep(2);
    }
  };

  const addCustomMatch = () => {
    const availableTeams = teamNames.filter(name => name.trim());
    if (availableTeams.length >= 2) {
      setMatches([...matches, {
        team1: availableTeams[0],
        team2: availableTeams[1],
        round: matches.length + 1
      }]);
    }
  };

  const removeMatch = (index: number) => {
    const newMatches = matches.filter((_, i) => i !== index);
    // Reordenar rounds
    setMatches(newMatches.map((match, i) => ({ ...match, round: i + 1 })));
  };

  const updateMatch = (index: number, field: 'team1' | 'team2', value: string) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };
    setMatches(newMatches);
  };

  const generateAutoMatches = () => {
    const trimmedNames = teamNames.map(name => name.trim());
    const allMatches = generateAllMatches(trimmedNames);
    setMatches(allMatches);
  };

  const validateMatches = () => {
    const trimmedNames = teamNames.map(name => name.trim());
    return validateTournament(trimmedNames, matches);
  };

  const handleCreateTournament = async () => {
    const config: TournamentConfig = {
      type: tournamentType,
      allowTie,
      requireAllMatches: true
    };

    const trimmedNames = teamNames.map(name => name.trim());

    try {
      let tournamentId: string;
      
      if (customMatches) {
        tournamentId = await createCustomTournament(tournamentName.trim(), trimmedNames, matches, config);
      } else {
        tournamentId = await createTournament(tournamentName.trim(), trimmedNames, config);
      }
      
      // Redirigir a fechas después de crear el torneo
      navigate(`/tournament/${tournamentId}/dates`);
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const validation = matches.length > 0 ? validateMatches() : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ Crear Nuevo Torneo</h1>
          <p className="text-gray-600">Configuración avanzada del torneo</p>
          
          {/* Progress Bar */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Configuration */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Configuración Básica</h2>
            
            <div>
              <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Torneo
              </label>
              <input
                type="text"
                id="tournamentName"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="input-field"
                placeholder="Ej: Copa de Verano 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Número de Equipos
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleTeamCountChange(3)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    teamCount === 3
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  3 Equipos
                </button>
                <button
                  type="button"
                  onClick={() => handleTeamCountChange(4)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    teamCount === 4
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  4 Equipos
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Nombres de los Equipos
              </label>
              <div className="space-y-3">
                {teamNames.map((name, index) => (
                  <div key={index}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleTeamNameChange(index, e.target.value)}
                      className="input-field"
                      placeholder={`Equipo ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Torneo
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tournamentType"
                    value="points"
                    checked={tournamentType === 'points'}
                    onChange={(e) => setTournamentType(e.target.value as TournamentType)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Por Puntos (Tradicional)</div>
                    <div className="text-sm text-gray-600">Victoria: 3pts, Empate: 1pt, Derrota: 0pts</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tournamentType"
                    value="wins"
                    checked={tournamentType === 'wins'}
                    onChange={(e) => setTournamentType(e.target.value as TournamentType)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Por Victorias</div>
                    <div className="text-sm text-gray-600">Solo cuentan las victorias, los empates no suman</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={allowTie}
                  onChange={(e) => setAllowTie(e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Permitir empates en el campeonato</div>
                  <div className="text-sm text-gray-600">
                    Si está desactivado, se jugarán partidos de desempate en caso de empate
                  </div>
                </div>
              </label>
            </div>

            <div className="text-center">
              <button
                onClick={handleStep1Next}
                disabled={!validateStep1()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Match Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">⚽ Configuración de Partidos</h2>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ← Volver
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Modo de Configuración
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="matchMode"
                    checked={!customMatches}
                    onChange={() => {
                      setCustomMatches(false);
                      generateAutoMatches();
                    }}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Automático (Recomendado)</div>
                    <div className="text-sm text-gray-600">Todos juegan contra todos una vez</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="matchMode"
                    checked={customMatches}
                    onChange={() => {
                      setCustomMatches(true);
                      setMatches([]);
                    }}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Personalizado</div>
                    <div className="text-sm text-gray-600">Tú decides qué equipos se enfrentan y en qué orden</div>
                  </div>
                </label>
              </div>
            </div>

            {customMatches && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">Partidos Personalizados</h3>
                  <div className="space-x-2">
                    <button
                      onClick={generateAutoMatches}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Generar Todos
                    </button>
                    <button
                      onClick={addCustomMatch}
                      className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                    >
                      + Agregar Partido
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {matches.map((match, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 w-12">#{index + 1}</span>
                      <select
                        value={match.team1}
                        onChange={(e) => updateMatch(index, 'team1', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {teamNames.filter(name => name.trim()).map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                      <span className="text-gray-500 font-medium">vs</span>
                      <select
                        value={match.team2}
                        onChange={(e) => updateMatch(index, 'team2', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {teamNames.filter(name => name.trim()).map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeMatch(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                {matches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay partidos configurados. Haz clic en "Agregar Partido" para empezar.
                  </div>
                )}
              </div>
            )}

            {/* Validation Results */}
            {validation && (
              <div className="mt-6">
                {validation.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-red-800 mb-2">❌ Errores:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Advertencias:</h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.missingMatches.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">📊 Estadísticas de Partidos:</h4>
                    <div className="text-sm text-blue-700">
                      {validation.missingMatches.map((stat, index) => (
                        <div key={index}>
                          {stat.team}: {stat.currentMatches} de {stat.expectedMatches} partidos
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(3)}
                disabled={validation ? !validation.isValid : matches.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar y Crear →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Create */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">✅ Revisar Configuración</h2>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ← Volver
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">Resumen del Torneo</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Información General</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>Nombre:</strong> {tournamentName}</li>
                    <li><strong>Tipo:</strong> {tournamentType === 'points' ? 'Por Puntos' : 'Por Victorias'}</li>
                    <li><strong>Equipos:</strong> {teamCount}</li>
                    <li><strong>Partidos:</strong> {matches.length}</li>
                    <li><strong>Empates:</strong> {allowTie ? 'Permitidos' : 'Con desempate'}</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Equipos Participantes</h4>
                  <ul className="space-y-1 text-sm">
                    {teamNames.map((team, index) => (
                      <li key={index}>• {team}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Calendario de Partidos</h4>
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <div key={index} className="text-sm bg-white p-2 rounded border">
                      Partido #{index + 1}: {match.team1} vs {match.team2}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleCreateTournament}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando Torneo...' : '🏆 Crear Torneo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};