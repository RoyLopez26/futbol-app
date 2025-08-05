import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { TournamentConfig, TournamentDate } from '../types/tournament';

interface TournamentDateManagerProps {
  tournamentId: string;
  dates: TournamentDate[];
}

export const TournamentDateManager: React.FC<TournamentDateManagerProps> = ({ 
  tournamentId, 
  dates 
}) => {
  const { addTournamentDate, closeTournamentDate, addMatchToDate, loading } = useTournament();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDateName, setNewDateName] = useState('');
  const [newDateTeams, setNewDateTeams] = useState<string[]>(['', '']);
  const [newDateType, setNewDateType] = useState<'points' | 'wins'>('points');

  const addTeam = () => {
    if (newDateTeams.length < 16) {
      setNewDateTeams([...newDateTeams, '']);
    }
  };

  const removeTeam = (index: number) => {
    if (newDateTeams.length > 2) {
      setNewDateTeams(newDateTeams.filter((_, i) => i !== index));
    }
  };

  const updateTeam = (index: number, value: string) => {
    const updated = [...newDateTeams];
    updated[index] = value;
    setNewDateTeams(updated);
  };

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDateName.trim()) {
      alert('Por favor ingresa un nombre para la fecha');
      return;
    }

    const validTeams = newDateTeams.filter(team => team.trim());
    if (validTeams.length < 2) {
      alert('Necesitas al menos 2 equipos para la fecha');
      return;
    }

    const uniqueTeams = [...new Set(validTeams)];
    if (uniqueTeams.length !== validTeams.length) {
      alert('Los nombres de los equipos deben ser únicos');
      return;
    }

    const config: TournamentConfig = {
      type: newDateType,
      allowTie: true,
      requireAllMatches: false
    };

    await addTournamentDate(tournamentId, newDateName.trim(), validTeams, config);
    
    // Reset form
    setNewDateName('');
    setNewDateTeams(['', '']);
    setNewDateType('points');
    setShowAddForm(false);
  };

  const handleCloseDate = async (dateId: string, dateName: string) => {
    if (window.confirm(`¿Cerrar la fecha "${dateName}"? No podrás hacer más cambios después.`)) {
      await closeTournamentDate(tournamentId, dateId);
    }
  };

  const handleGenerateMatches = async (date: TournamentDate) => {
    const teams = date.teams;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        await addMatchToDate(tournamentId, date.id, teams[i], teams[j]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">📅</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Gestión de Fechas
          </h1>
          <p className="text-gray-600">
            Administra las fechas y jornadas de tu torneo
          </p>
        </div>

        {/* Add Date Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
          >
            {showAddForm ? 'Cancelar' : '+ Agregar Fecha'}
          </button>
        </div>

        {/* Add Date Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Nueva Fecha</h3>
            <form onSubmit={handleAddDate} className="space-y-6">
              {/* Date Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Fecha
                </label>
                <input
                  type="text"
                  value={newDateName}
                  onChange={(e) => setNewDateName(e.target.value)}
                  placeholder="Ej: Fecha 1, Jornada Inicial, etc."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  required
                />
              </div>

              {/* Tournament Type for this date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tipo de Torneo para esta Fecha
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    newDateType === 'points' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="dateType"
                      value="points"
                      checked={newDateType === 'points'}
                      onChange={(e) => setNewDateType(e.target.value as 'points' | 'wins')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        newDateType === 'points' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {newDateType === 'points' && (
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">🏆 Por Puntos</div>
                        <div className="text-sm text-gray-500">Victoria: 3pts | Empate: 1pt</div>
                      </div>
                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    newDateType === 'wins' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="dateType"
                      value="wins"
                      checked={newDateType === 'wins'}
                      onChange={(e) => setNewDateType(e.target.value as 'points' | 'wins')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        newDateType === 'wins' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {newDateType === 'wins' && (
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

              {/* Teams for this date */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Equipos para esta Fecha ({newDateTeams.filter(t => t.trim()).length})
                  </label>
                  <button
                    type="button"
                    onClick={addTeam}
                    disabled={newDateTeams.length >= 16}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + Agregar Equipo
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {newDateTeams.map((team, index) => (
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
                      {newDateTeams.length > 2 && (
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
                      Agregando Fecha...
                    </div>
                  ) : (
                    'Agregar Fecha'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dates List */}
        <div className="space-y-6">
          {dates.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-8">📅</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                ¡Agrega tu primera fecha!
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Las fechas te permiten organizar tu torneo por jornadas, cada una con sus propios equipos y reglas
              </p>
            </div>
          ) : (
            dates.map((date) => (
              <div
                key={date.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Date Header */}
                <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">
                      {date.name}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        date.closed 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {date.closed ? '🔒 Cerrada' : '🔓 Abierta'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-800">
                        {date.config.type === 'points' ? '🏆 Puntos' : '⚡ Victorias'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{date.teams.length}</div>
                      <div className="text-xs text-gray-600">Equipos</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{date.totalMatches}</div>
                      <div className="text-xs text-gray-600">Partidos</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{date.completedMatches}</div>
                      <div className="text-xs text-gray-600">Completados</div>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Equipos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {date.teams.map((team, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {!date.closed && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleGenerateMatches(date)}
                        className="flex-1 bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Generar Partidos
                      </button>
                      <button
                        onClick={() => handleCloseDate(date.id, date.name)}
                        className="bg-orange-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Cerrar Fecha
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};