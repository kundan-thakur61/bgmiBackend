'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchChat from '@/components/matches/MatchChat';
import { MatchSchema, BreadcrumbSchema } from '@/components/seo';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [joinForm, setJoinForm] = useState({ inGameId: '', inGameName: '' });
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [myStatus, setMyStatus] = useState(null);
  const [roomCredentials, setRoomCredentials] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchMatch();
  }, [params.id]);

  useEffect(() => {
    if (isAuthenticated && match) {
      fetchMyStatus();
    }
  }, [isAuthenticated, match]);

  const fetchMatch = async () => {
    try {
      const data = await api.getMatch(params.id);
      setMatch(data.match);
    } catch (err) {
      setError('Match not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStatus = async () => {
    try {
      const data = await api.getMyMatchStatus(params.id);
      setMyStatus(data);
      // Fetch room credentials if joined
      if (data?.joined || data?.isJoined) {
        if (data?.roomId) {
          setRoomCredentials({
            roomId: data.roomId,
            roomPassword: data.roomPassword,
            scheduledAt: data.scheduledAt
          });
        } else {
          fetchRoomCredentials();
        }
      }
    } catch (err) {
      // Not joined
    }
  };

  const fetchRoomCredentials = async () => {
    try {
      const data = await api.getRoomCredentials(params.id);
      setRoomCredentials(data);
    } catch (err) {
      // Credentials not available yet
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setJoining(true);
    setError('');
    try {
      await api.joinMatch(params.id, joinForm.inGameId, joinForm.inGameName);
      setShowJoinModal(false);
      fetchMatch();
      fetchMyStatus();
    } catch (err) {
      // Extract error message from axios response
      const errorMessage = err.response?.data?.message || err.message || 'Failed to join match';
      setError(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this match?')) return;

    try {
      await api.leaveMatch(params.id);
      fetchMatch();
      setMyStatus(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelChallenge = async () => {
    if (!confirm('Are you sure you want to cancel this challenge? Your creation fee and prize pool will be refunded to your wallet.')) return;

    try {
      const result = await api.cancelUserMatch(params.id);
      alert(`Challenge cancelled! ₹${result.refund.total} has been refunded to your wallet.`);
      router.push('/matches');
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400',
      live: 'bg-green-500/20 text-green-400 animate-pulse',
      completed: 'bg-dark-600 text-dark-300',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return badges[status] || badges.upcoming;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (error && !match) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">{error}</h1>
            <Link href="/matches" className="btn-primary">Back to Matches</Link>
          </div>
        </div>
      </>
    );
  }

  const isJoined = myStatus?.joined || myStatus?.isJoined;
  const slotsLeft = match.maxSlots - (match.filledSlots || match.joinedUsers?.length || 0);
  const isFull = slotsLeft <= 0;
  const isCreator = user && (match.createdBy?._id === user.id || match.createdBy?._id === user._id || match.createdBy === user.id || match.createdBy === user._id);
  const canCancel = isCreator && match.isChallenge && ['upcoming', 'registration_open'].includes(match.status) && (match.filledSlots || match.joinedUsers?.length || 0) <= 1;

  return (
    <>
      {match && (
        <>
          <MatchSchema match={match} />
          <BreadcrumbSchema items={[
            { name: 'Home', url: 'https://battlezone.com' },
            { name: 'Matches', url: 'https://battlezone.com/matches' },
            { name: match.title, url: `https://battlezone.com/matches/${params.id}` },
          ]} />
        </>
      )}
      <Navbar />
      <main className="min-h-screen bg-dark-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link href="/matches" className="inline-flex items-center text-dark-400 hover:text-white mb-6">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Matches
          </Link>

          {/* Match Header */}
          <div className="card p-6 mb-6 relative">
            {/* Challenge Badge */}
            {match.isChallenge && (
              <div className="absolute top-0 right-0 bg-linear-to-r from-gaming-purple to-gaming-orange text-white text-sm font-bold px-4 py-2 rounded-bl-lg rounded-tr-lg">
                🎯 CHALLENGE MATCH
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusBadge(match.status)}`}>
                  {match.status.toUpperCase()}
                </span>
                <h1 className="text-2xl md:text-3xl font-bold">{match.title}</h1>
                {match.isChallenge && (
                  <p className="text-gaming-orange text-sm mt-1">
                    Created by a player • Winner takes the prize pool!
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gaming-green">₹{match.prizePool}</div>
                <div className="text-dark-400 text-sm">Prize Pool</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Entry Fee</div>
                <div className="text-xl font-bold">{match.entryFee === 0 ? 'FREE' : `₹${match.entryFee}`}</div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Mode</div>
                <div className="text-xl font-bold capitalize">{match.mode}</div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Slots</div>
                <div className="text-xl font-bold">{match.filledSlots || match.joinedUsers?.length || 0}/{match.maxSlots}</div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Map</div>
                <div className="text-xl font-bold capitalize">{match.map || 'Erangel'}</div>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Match Details</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-dark-400">Game</dt>
                  <dd className="font-medium capitalize">{match.gameType?.replace('_', ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Match Type</dt>
                  <dd className="font-medium capitalize">{match.matchType?.replace('_', ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Scheduled</dt>
                  <dd className="font-medium">{new Date(match.scheduledAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Per Kill</dt>
                  <dd className="font-medium">₹{match.perKillPrize || 0}</dd>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Prize Distribution</h2>
              <div className="space-y-2">
                {match.prizeDistribution?.length > 0 ? (
                  match.prizeDistribution.map((prize, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-dark-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}{' '}
                        {prize.label || `Rank ${prize.position || idx + 1}`}
                      </span>
                      <span className="font-bold text-gaming-green">₹{prize.prize ?? prize.amount ?? 0}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-dark-400">Winner takes all!</p>
                )}
              </div>
            </div>
          </div>

          {/* Room Credentials (if joined and credentials available) */}
          {isJoined && roomCredentials?.roomId && (
            <div className="card p-6 mb-6 border-2 border-gaming-green/50 bg-gradient-to-r from-gaming-green/10 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gaming-green flex items-center gap-2">
                  <span className="text-2xl">🎮</span> Room Credentials
                </h2>
                <span className="text-xs bg-gaming-green/20 text-gaming-green px-2 py-1 rounded">READY</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="text-dark-400 text-sm mb-1">Room ID</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-mono font-bold tracking-wider">{roomCredentials.roomId}</div>
                    <button
                      onClick={() => copyToClipboard(roomCredentials.roomId, 'roomId')}
                      className="ml-2 p-2 hover:bg-dark-700 rounded transition-colors"
                    >
                      {copied === 'roomId' ? (
                        <span className="text-gaming-green text-sm">✓ Copied</span>
                      ) : (
                        <svg className="w-5 h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="text-dark-400 text-sm mb-1">Password</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-mono font-bold tracking-wider">{roomCredentials.roomPassword}</div>
                    <button
                      onClick={() => copyToClipboard(roomCredentials.roomPassword, 'roomPassword')}
                      className="ml-2 p-2 hover:bg-dark-700 rounded transition-colors"
                    >
                      {copied === 'roomPassword' ? (
                        <span className="text-gaming-green text-sm">✓ Copied</span>
                      ) : (
                        <svg className="w-5 h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-dark-400 text-sm">
                Join the room and start the match. Good luck! 🏆
              </div>
            </div>
          )}

          {/* Waiting for opponent (Challenge matches) */}
          {isJoined && !roomCredentials?.roomId && match.matchType === 'tdm' && !isFull && (
            <div className="card p-6 mb-6 border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xl">⏳</span>
                </div>
                <div>
                  <h3 className="font-bold text-yellow-400">Waiting for Opponent</h3>
                  <p className="text-dark-400 text-sm">Room credentials will be revealed once an opponent accepts the challenge</p>
                </div>
              </div>
            </div>
          )}

          {/* Waiting for credentials (regular matches) */}
          {isJoined && !roomCredentials?.roomId && match.matchType !== 'tdm' && match.status === 'upcoming' && (
            <div className="card p-6 mb-6 border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
                <div>
                  <h3 className="font-bold">Waiting for Room Credentials</h3>
                  <p className="text-dark-400 text-sm">Room ID and Password will be shared before the match starts</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="card p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {(match.status === 'upcoming' || match.status === 'registration_open') && (
              <>
                {isCreator ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gaming-purple/10 border border-gaming-purple/30 rounded-lg">
                      <div>
                        <div className="font-bold text-gaming-purple">👑 You created this challenge</div>
                        <p className="text-dark-400 text-sm">Waiting for an opponent to accept...</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-dark-400">Invested</div>
                        <div className="font-bold text-gaming-orange">₹{(match.creationFee || 0) + (match.prizePool || 0)}</div>
                      </div>
                    </div>

                    {canCancel && (
                      <button
                        onClick={handleCancelChallenge}
                        className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-medium"
                      >
                        🚫 Cancel Challenge & Get Refund
                      </button>
                    )}

                    {!canCancel && match.isChallenge && (match.filledSlots > 1 || match.joinedUsers?.length > 1) && (
                      <div className="text-center text-yellow-400 text-sm p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        ⚠️ An opponent has joined. The match cannot be cancelled now.
                      </div>
                    )}
                  </div>
                ) : isJoined ? (
                  <div className="flex items-center justify-between">
                    <div className="text-gaming-green font-medium">✓ You have joined this match</div>
                    <button onClick={handleLeave} className="btn-secondary text-red-400 hover:text-red-300">
                      Leave Match
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    disabled={isFull}
                    className="btn-primary w-full py-3 text-lg"
                  >
                    {isFull ? 'Match Full' : `Join Match - ₹${match.entryFee || 'FREE'}`}
                  </button>
                )}
              </>
            )}

            {match.status === 'live' && (
              <div className="text-center py-4">
                <div className="text-gaming-green text-xl font-bold animate-pulse">Match is LIVE!</div>
              </div>
            )}

            {match.status === 'completed' && (
              <div className="text-center py-4 text-dark-400">
                This match has ended
              </div>
            )}
          </div>

          {/* Match Chat */}
          {isJoined && (
            <div className="mb-6">
              <MatchChat matchId={params.id} isJoined={isJoined} />
            </div>
          )}
        </div>
      </main>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Join Match</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="label">In-Game ID</label>
                <input
                  type="text"
                  value={joinForm.inGameId}
                  onChange={(e) => setJoinForm({ ...joinForm, inGameId: e.target.value })}
                  className="input"
                  placeholder="Your BGMI ID"
                  required
                />
              </div>
              <div>
                <label className="label">In-Game Name</label>
                <input
                  type="text"
                  value={joinForm.inGameName}
                  onChange={(e) => setJoinForm({ ...joinForm, inGameName: e.target.value })}
                  className="input"
                  placeholder="Your BGMI username"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={joining} className="btn-primary flex-1">
                  {joining ? 'Joining...' : 'Confirm Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
