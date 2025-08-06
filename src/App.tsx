import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Header } from './components/Header';
import { TournamentSetup } from './components/TournamentSetup';
import { BasicTournamentSetup } from './components/BasicTournamentSetup';
import { TournamentDateManager } from './components/TournamentDateManager';
import { TournamentHistory } from './components/TournamentHistory';
import { StandingsTablePro } from './components/StandingsTablePro';
import { MatchHistory } from './components/MatchHistory';

type ViewType = 'setup' | 'basic-setup' | 'dates' | 'matches' | 'standings' | 'history' | 'tournaments';

// Componente para manejar torneo específico
const TournamentRoute: React.FC<{ view: ViewType }> = ({ view }) => {
  const { tournamentId, dateId } = useParams<{ tournamentId: string; dateId?: string }>();
  const { tournament, loadTournament } = useTournament();

  useEffect(() => {
    if (tournamentId && (!tournament || tournament.id !== tournamentId)) {
      loadTournament(tournamentId);
    }
  }, [tournamentId, tournament, loadTournament]);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  switch (view) {
    case 'dates':
      return <TournamentDateManager tournamentId={tournament.id} dates={tournament.dates || []} />;
    case 'standings':
      return <StandingsTablePro selectedDateId={dateId} />;
    case 'history':
      return <MatchHistory />;
    default:
      return <TournamentDateManager tournamentId={tournament.id} dates={tournament.dates || []} />;
  }
};

const AppContent: React.FC = () => {
  const { tournament, loadTournamentHistory } = useTournament();
  const navigate = useNavigate();
  const location = window.location;
  
  // Determinar la vista actual basada en la URL
  const getCurrentView = (): ViewType => {
    const path = location.pathname;
    if (path.includes('/dates')) return 'dates';
    if (path.includes('/standings')) return 'standings';  
    if (path.includes('/history')) return 'history';
    if (path.includes('/setup')) return 'basic-setup';
    if (path.includes('/tournament/')) return 'dates';
    return 'tournaments';
  };
  
  const [currentView] = useState<ViewType>(getCurrentView());

  // Cargar historial de torneos al inicializar (solo una vez)
  useEffect(() => {
    loadTournamentHistory();
  }, []); // Sin dependencias para que solo se ejecute una vez

  // Cambiar vista automáticamente cuando se crea un torneo
  useEffect(() => {
    if (tournament && (currentView === 'basic-setup' || currentView === 'setup')) {
      // Navegar a la página de fechas del torneo
      navigate(`/tournament/${tournament.id}/dates`);
    }
  }, [tournament, currentView, navigate]);

  const handleViewChange = (view: ViewType) => {
    if (tournament && (view === 'dates' || view === 'standings' || view === 'history')) {
      navigate(`/tournament/${tournament.id}/${view}`);
    } else if (view === 'tournaments') {
      navigate('/');
    } else {
      navigate(`/${view}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header currentView={currentView} onViewChange={handleViewChange} />
      <main>
        <Routes>
          <Route path="/" element={<TournamentHistory />} />
          <Route path="/setup" element={<TournamentSetup />} />
          <Route path="/basic-setup" element={<BasicTournamentSetup />} />
          <Route path="/tournament/:tournamentId/dates" element={<TournamentRoute view="dates" />} />
          <Route path="/tournament/:tournamentId/standings" element={<TournamentRoute view="standings" />} />
          <Route path="/tournament/:tournamentId/standings/:dateId" element={<TournamentRoute view="standings" />} />
          <Route path="/tournament/:tournamentId/history" element={<TournamentRoute view="history" />} />
          <Route path="/tournament/:tournamentId" element={<TournamentRoute view="dates" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <TournamentProvider>
        <AppContent />
      </TournamentProvider>
    </Router>
  );
}

export default App;