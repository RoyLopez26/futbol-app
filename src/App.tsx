import React, { useState, useEffect } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Header } from './components/Header';
import { TournamentSetup } from './components/TournamentSetup';
import { BasicTournamentSetup } from './components/BasicTournamentSetup';
import { TournamentDateManager } from './components/TournamentDateManager';
import { TournamentHistory } from './components/TournamentHistory';
import { ManualMatchManagement } from './components/ManualMatchManagement';
import { StandingsTablePro } from './components/StandingsTablePro';
import { MatchHistory } from './components/MatchHistory';

type ViewType = 'setup' | 'basic-setup' | 'dates' | 'matches' | 'standings' | 'history' | 'tournaments';

const AppContent: React.FC = () => {
  const { tournament, loadTournamentHistory } = useTournament();
  const [currentView, setCurrentView] = useState<ViewType>('tournaments');

  // Cargar historial de torneos al inicializar (solo una vez)
  useEffect(() => {
    loadTournamentHistory();
  }, []); // Sin dependencias para que solo se ejecute una vez

  // Cambiar vista automáticamente cuando se crea un torneo
  useEffect(() => {
    if (tournament && (currentView === 'basic-setup' || currentView === 'setup')) {
      // Si el torneo no tiene fechas, mostrar gestor de fechas
      if (!tournament.dates || tournament.dates.length === 0) {
        setCurrentView('dates');
      } else {
        // Si ya tiene fechas, mostrar partidos
        setCurrentView('matches');
      }
    }
  }, [tournament, currentView]);

  const renderCurrentView = () => {
    // Si no hay torneo activo, mostrar historial o setup
    if (!tournament) {
      switch (currentView) {
        case 'setup':
          return <TournamentSetup />; // Método legacy
        case 'basic-setup':
          return <BasicTournamentSetup />; // Nuevo método
        case 'tournaments':
          return <TournamentHistory />;
        default:
          return <TournamentHistory />;
      }
    }

    // Si hay torneo activo, mostrar vistas del torneo
    switch (currentView) {
      case 'dates':
        return <TournamentDateManager 
          tournamentId={tournament.id} 
          dates={tournament.dates || []} 
        />;
      case 'matches':
        return <ManualMatchManagement />;
      case 'standings':
        return <StandingsTablePro />;
      case 'history':
        return <MatchHistory />;
      case 'tournaments':
        return <TournamentHistory />;
      case 'setup':
        return <TournamentSetup />; // Legacy
      case 'basic-setup':
        return <BasicTournamentSetup />;
      default:
        // Si el torneo no tiene fechas, mostrar gestor de fechas por defecto
        if (!tournament.dates || tournament.dates.length === 0) {
          return <TournamentDateManager 
            tournamentId={tournament.id} 
            dates={tournament.dates || []} 
          />;
        }
        return <ManualMatchManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <TournamentProvider>
      <AppContent />
    </TournamentProvider>
  );
}

export default App;