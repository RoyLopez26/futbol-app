import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { Match, MatchResult } from '../types/tournament';

export const MatchManager: React.FC = () => {
  const { tournament, updateMatchResult, loading } = useTournament();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);

  if (!tournament) return null;

  const nextMatch = tournament.matches.find(match => !match.completed);
  const currentMatch = selectedMatch || nextMatch;

  const handleMatchSelect = (match: Match) => {
    if (match.completed) return;
    setSelectedMatch(match);
    setTeam1Score(match.team1Score || 0);
    setTeam2Score(match.team2Score || 0);
  };

  const handleResultSubmit = async (result: MatchResult) => {
    if (!currentMatch) return;

    await updateMatchResult(currentMatch.id, result, team1Score, team2Score);
    setSelectedMatch(null);
    setTeam1Score(0);
    setTeam2Score(0);
  };

  const getMatchResult = (): MatchResult => {
    if (team1Score > team2Score) return 'team1';
    if (team2Score > team1Score) return 'team2';
    return 'draw';
  };

  const pendingMatches = tournament.matches.filter(match => !match.completed);
  const completedMatches = tournament.matches.filter(match => match.completed);

  if (tournament.isComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Torneo Completado!</h2>
          <p className="text-gray-600 mb-6">Todos los partidos han sido jugados</p>
          <div className="text-2xl font-bold text-green-500">
            Campeón: {tournament.teams[0].name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Current Match */}
      {currentMatch && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Partido Actual - Ronda {currentMatch.round}
          </h2>
          
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {currentMatch.team1}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTeam1Score(Math.max(0, team1Score - 1))}
                  className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600"
                >
                  -
                </button>
                <div className="text-4xl font-bold text-green-500 min-w-[3rem] text-center">
                  {team1Score}
                </div>
                <button
                  onClick={() => setTeam1Score(team1Score + 1)}
                  className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-6xl">⚽</div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {currentMatch.team2}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTeam2Score(Math.max(0, team2Score - 1))}
                  className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600"
                >
                  -
                </button>
                <div className="text-4xl font-bold text-green-500 min-w-[3rem] text-center">
                  {team2Score}
                </div>
                <button
                  onClick={() => setTeam2Score(team2Score + 1)}
                  className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="text-center space-x-4">
            <button
              onClick={() => handleResultSubmit(getMatchResult())}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Confirmar Resultado'}
            </button>
          </div>
        </div>
      )}

      {/* Match Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Matches */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Partidos Pendientes ({pendingMatches.length})
          </h3>
          <div className="space-y-2">
            {pendingMatches.map((match) => (
              <div
                key={match.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  currentMatch?.id === match.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMatchSelect(match)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {match.team1} vs {match.team2}
                  </span>
                  <span className="text-sm text-gray-500">
                    Ronda {match.round}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Matches */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Partidos Completados ({completedMatches.length})
          </h3>
          <div className="space-y-2">
            {completedMatches.map((match) => (
              <div
                key={match.id}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {match.team1} {match.team1Score} - {match.team2Score} {match.team2}
                  </span>
                  <span className="text-sm text-gray-500">
                    {match.result === 'team1' ? match.team1 : 
                     match.result === 'team2' ? match.team2 : 'Empate'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};