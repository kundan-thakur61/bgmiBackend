'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime, getMatchStatusColor, getGameIcon } from '@/lib/utils';

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    gameType: '',
    matchType: '',
    status: 'upcoming',
  });

  useEffect(() => {
    fetchMatches();
  }, [filters]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.gameType) params.gameType = filters.gameType;
      if (filters.matchType) params.matchType = filters.matchType;
      if (filters.status) params.status = filters.status;
      
      const data = await api.getMatches(params);
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Display real matches only
  const displayMatches = matches;

  const statusOptions = ['upcoming', 'live', 'completed'];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={filters.gameType}
          onChange={(e) => setFilters({ ...filters, gameType: e.target.value })}
          className="input w-auto min-w-[150px]"
        >
          <option value="">All Games</option>
          <option value="pubg_mobile">PUBG Mobile</option>
          <option value="free_fire">Free Fire</option>
        </select>

        <select
          value={filters.matchType}
          onChange={(e) => setFilters({ ...filters, matchType: e.target.value })}
          className="input w-auto min-w-[150px]"
        >
          <option value="">All Types</option>
          <option value="solo">Solo</option>
          <option value="duo">Duo</option>
          <option value="squad">Squad</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="input w-auto min-w-[150px]"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Match Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <button onClick={fetchMatches} className="btn-primary">
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayMatches.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold mb-2">No matches available</h3>
              <p className="text-dark-400">Check back later for upcoming matches!</p>
            </div>
          ) : (
            displayMatches.map((match) => (
              <Link key={match._id} href={`/matches/${match._id}`}>
                <div className="card-hover p-6 h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getGameIcon(match.gameType)}</span>
                      <span className="font-semibold capitalize">{match.gameType?.replace('_', ' ')}</span>
                    </div>
                    <span className={`badge ${getMatchStatusColor(match.status)}`}>
                      {match.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Title</span>
                      <span className="font-medium">{match.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Type</span>
                      <span className="font-medium capitalize">{match.matchType} • {match.mode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Map</span>
                      <span className="font-medium">{match.map || 'TBD'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Entry Fee</span>
                      <span className="font-medium text-gaming-orange">{formatCurrency(match.entryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Prize Pool</span>
                      <span className="font-medium text-green-400">{formatCurrency(match.prizePool)}</span>
                    </div>
                  </div>

                  {/* Slots Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-400">Slots</span>
                      <span>{match.participants?.length || 0}/{match.maxSlots}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${((match.participants?.length || 0) / match.maxSlots) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Starts</span>
                    <span className="text-primary-400">{formatDateTime(match.scheduledAt)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
