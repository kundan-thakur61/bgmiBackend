'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getGameIcon } from '@/lib/utils';

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await api.getTournaments();
      setTournaments(data.tournaments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Display real tournaments only
  const displayTournaments = tournaments;

  const getStatusBadge = (status) => {
    const statusMap = {
      registration_open: { label: 'Registration Open', class: 'badge-success' },
      registration_closed: { label: 'Registration Closed', class: 'badge-warning' },
      ongoing: { label: 'Ongoing', class: 'badge-info' },
      completed: { label: 'Completed', class: 'badge-primary' },
    };
    return statusMap[status] || { label: status, class: 'badge-primary' };
  };

  return (
    <div>
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-dark-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-dark-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-dark-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchTournaments} className="btn-primary">
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTournaments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">No tournaments available</h3>
              <p className="text-dark-400">Check back later for upcoming tournaments!</p>
            </div>
          ) : (
            displayTournaments.map((tournament) => {
              const statusBadge = getStatusBadge(tournament.status);
              
              return (
                <Link key={tournament._id} href={`/tournaments/${tournament._id}`}>
                  <div className="card-hover p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getGameIcon(tournament.gameType)}</span>
                        <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2">{tournament.title}</h3>
                    <p className="text-dark-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>

                    {/* Details */}
                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Game</span>
                        <span className="font-medium capitalize">{tournament.gameType?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Mode</span>
                        <span className="font-medium capitalize">{tournament.mode}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Entry Fee</span>
                        <span className="font-medium text-gaming-orange">{formatCurrency(tournament.entryFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Prize Pool</span>
                        <span className="font-bold text-green-400 text-lg">{formatCurrency(tournament.prizePool)}</span>
                      </div>
                    </div>

                    {/* Teams Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-dark-400">Teams Registered</span>
                        <span>{tournament.registeredTeams || 0}/{tournament.maxTeams}</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gaming-purple rounded-full transition-all"
                          style={{ width: `${((tournament.registeredTeams || 0) / tournament.maxTeams) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="pt-4 border-t border-dark-700 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-400">Starts</span>
                        <span className="text-primary-400">{formatDate(tournament.startAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
