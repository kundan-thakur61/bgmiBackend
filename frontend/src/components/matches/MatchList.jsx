'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getMatches } from '@/lib/api';
import { formatCurrency, formatDateTime, getMatchStatusColor, getGameIcon } from '@/lib/utils';
import { generateStructuredData } from '@/lib/seo';
import { useAuth } from '@/context/AuthContext';

export default function MatchList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingMatch, setDeletingMatch] = useState(null);
  const [filters, setFilters] = useState({
    gameType: '',
    matchType: '',
    status: 'upcoming',
    isChallenge: searchParams.get('isChallenge') || 'false',
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
      if (filters.isChallenge) params.isChallenge = filters.isChallenge;

      const data = await getMatches(params);
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = user?.role && ['admin', 'super_admin', 'match_manager'].includes(user.role);

  // Check if current user is the creator of a match
  const isMatchCreator = (match) => {
    if (!user) return false;
    const creatorId = match.createdBy?._id || match.createdBy?.id || match.createdBy;
    const userId = user.id || user._id;
    return creatorId === userId || creatorId?.toString() === userId?.toString();
  };

  // Check if user can manage this match (creator or admin)
  const canManageMatch = (match) => {
    return isMatchCreator(match) || isAdmin;
  };

  // Get creator display info
  const getCreatorInfo = (match) => {
    const creator = match.createdBy;
    if (!creator) return { name: 'Unknown', isAdmin: false };

    const creatorRole = creator.role || 'user';
    const isCreatorAdmin = ['admin', 'super_admin', 'match_manager'].includes(creatorRole);

    return {
      name: creator.name || 'Unknown',
      isAdmin: isCreatorAdmin
    };
  };

  // Handle delete match
  const handleDeleteMatch = async (e, matchId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to cancel this match? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingMatch(matchId);
      await api.cancelUserMatch(matchId);
      fetchMatches(); // Refresh the list
    } catch (err) {
      alert(err.message || 'Failed to cancel match');
    } finally {
      setDeletingMatch(null);
    }
  };

  // Handle edit match
  const handleEditMatch = (e, matchId) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/matches/${matchId}/edit`);
  };

  const displayMatches = matches;
  const statusOptions = ['upcoming', 'live', 'completed'];

  return (
    <div>
      {matches.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: matches.slice(0, 10).map((match, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'SportsEvent',
                name: match.title,
                startDate: match.scheduledAt,
                offers: { '@type': 'Offer', price: match.entryFee, priceCurrency: 'INR' },
              },
            })),
          })
        }} />
      )}
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
            displayMatches.map((match) => {
              const creatorInfo = getCreatorInfo(match);
              const canManage = canManageMatch(match);

              return (
                <Link key={match._id} href={`/matches/${match._id}`}>
                  <div className="card-hover p-6 h-full relative">
                    {/* Challenge Badge */}
                    {match.isChallenge && (
                      <div className="absolute top-0 right-0 bg-linear-to-r from-gaming-purple to-gaming-orange text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        🎯 CHALLENGE
                      </div>
                    )}

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

                    {/* Creator Info Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${creatorInfo.isAdmin
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                        {creatorInfo.isAdmin ? '👑 Admin' : '👤 User'}: {creatorInfo.name}
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
                        <span>{match.filledSlots || match.joinedUsers?.length || 0}/{match.maxSlots}</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${((match.filledSlots || match.joinedUsers?.length || 0) / match.maxSlots) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Start Time */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-dark-400">Starts</span>
                      <span className="text-primary-400">{formatDateTime(match.scheduledAt)}</span>
                    </div>

                    {/* Management Buttons - Only for creator or admin */}
                    {canManage && ['upcoming', 'registration_open'].includes(match.status) && (
                      <div className="flex gap-2 pt-3 border-t border-dark-700">
                        <button
                          onClick={(e) => handleEditMatch(e, match._id)}
                          className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 transition-all flex items-center justify-center gap-1"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteMatch(e, match._id)}
                          disabled={deletingMatch === match._id}
                          className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {deletingMatch === match._id ? '⏳' : '🗑️'} Cancel
                        </button>
                      </div>
                    )}
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
