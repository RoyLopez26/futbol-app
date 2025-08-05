import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';

interface HeaderProps {
  currentView: 'setup' | 'basic-setup' | 'dates' | 'matches' | 'standings' | 'history' | 'tournaments';
  onViewChange: (view: 'setup' | 'basic-setup' | 'dates' | 'matches' | 'standings' | 'history' | 'tournaments') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { tournament, resetTournament } = useTournament();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNewTournament = () => {
    if (tournament && window.confirm('¿Estás seguro de que quieres crear un nuevo torneo? Se perderá el progreso actual.')) {
      resetTournament();
      onViewChange('basic-setup'); // Usar el nuevo método por defecto
    } else if (!tournament) {
      onViewChange('basic-setup'); // Usar el nuevo método por defecto
    }
    setMobileMenuOpen(false);
  };

  const handleViewTournaments = () => {
    onViewChange('tournaments');
    setMobileMenuOpen(false);
  };

  const handleViewChange = (view: 'setup' | 'basic-setup' | 'dates' | 'matches' | 'standings' | 'history' | 'tournaments') => {
    onViewChange(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-2xl relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-white rounded-full translate-x-10 translate-y-10"></div>
        <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-white rounded-full"></div>
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-white rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-20">
          {/* Logo y Título */}
          <div className="flex items-center cursor-pointer group" onClick={handleViewTournaments}>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <span className="text-2xl">⚽</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-4 hidden sm:block">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                FutbolManager
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent ml-1">
                  Pro
                </span>
              </h1>
              <div className="text-sm text-emerald-100 font-medium">
                Sistema de Gestión de Torneos
              </div>
            </div>
          </div>

          {/* Tournament Info - Desktop */}
          {tournament && (
            <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mr-4">
                <span className="text-lg">🏆</span>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {tournament.name}
                </div>
                <div className="text-sm text-emerald-100">
                  {tournament.config.type === 'points' ? '🎯 Por Puntos' : '⚡ Por Victorias'} • 
                  <span className="ml-1">{tournament.teams?.length || 0} equipos</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-2">
            {!tournament && (
              <button
                onClick={handleViewTournaments}
                className={`group relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  currentView === 'tournaments'
                    ? 'bg-white text-emerald-700 shadow-lg scale-105'
                    : 'text-white hover:bg-white/20 hover:scale-105'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Historial</span>
                </span>
                {currentView === 'tournaments' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                )}
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 ml-6">
              <button
                onClick={handleNewTournament}
                className="group relative bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 hover:from-violet-600 hover:via-purple-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-white/20"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden lg:inline">{tournament ? 'Nuevo' : 'Crear'} Torneo</span>
                  <span className="lg:hidden">Nuevo</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-blue-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </button>
              
              {tournament && (
                <button
                  onClick={handleViewTournaments}
                  className="group relative bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-white/30"
                  title="Ver historial de torneos"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div className="absolute inset-0 bg-white rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 border-t border-white/20 backdrop-blur-xl shadow-2xl z-50">
          <div className="px-4 py-6 space-y-3">
            {/* Tournament Info - Mobile */}
            {tournament && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm">🏆</span>
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {tournament.name}
                    </div>
                    <div className="text-xs text-emerald-100">
                      {tournament.config.type === 'points' ? '🎯 Por Puntos' : '⚡ Por Victorias'} • 
                      <span className="ml-1">{tournament.teams?.length || 0} equipos</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation - Solo mostrar si NO hay torneo activo */}
            {!tournament && (
              <button
                onClick={handleViewTournaments}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  currentView === 'tournaments'
                    ? 'bg-white text-emerald-700'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Historial de Torneos</span>
              </button>
            )}

            {/* Mobile Action Buttons */}
            <div className="pt-4 border-t border-white/20 space-y-3">
              <button
                onClick={handleNewTournament}
                className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg border border-white/20"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{tournament ? 'Crear Nuevo Torneo' : 'Crear Torneo'}</span>
                </span>
              </button>
              
              {tournament && (
                <button
                  onClick={handleViewTournaments}
                  className="w-full bg-white/20 text-white py-3 px-4 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Ver Historial de Torneos</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};