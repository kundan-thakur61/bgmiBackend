'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Chat from '@/components/chat/Chat';
import { TournamentSchema, BreadcrumbSchema } from '@/components/seo';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [userRegistered, setUserRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [teamForm, setTeamForm] = useState({ teamName: '', members: [] });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [matchCredentials, setMatchCredentials] = useState({});
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchTournament();
  }, [params.id]);

  const fetchTournament = async () => {
    try {
      const data = await api.getTournament(params.id);
      setTournament(data.tournament);
      setUserRegistered(data.userRegistered || false);
      // Fetch room credentials for each match if registered
      if (data.userRegistered && data.tournament.matches?.length > 0) {
        fetchMatchCredentials(data.tournament.matches);
      }
    } catch (err) {
      setError('Tournament not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchCredentials = async (matches) => {
    const credentials = {};
    for (const match of matches) {
      try {
        const data = await api.getRoomCredentials(match._id);
        if (data?.roomId) {
          credentials[match._id] = data;
        }
      } catch (err) {
        // Credentials not available
      }
    }
    setMatchCredentials(credentials);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setRegistering(true);
    try {
      await api.registerForTournament(params.id, teamForm);
      setShowRegisterModal(false);
      fetchTournament();
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400',
      registration_open: 'bg-green-500/20 text-green-400',
      registration_closed: 'bg-yellow-500/20 text-yellow-400',
      ongoing: 'bg-gaming-purple/20 text-gaming-purple animate-pulse',
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

  if (error && !tournament) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">{error}</h1>
            <Link href="/tournaments" className="btn-primary">Back to Tournaments</Link>
          </div>
        </div>
      </>
    );
  }

  const isRegistered = userRegistered;
  const slotsLeft = tournament.maxTeams - (tournament.registeredTeams || 0);
  const isFull = slotsLeft <= 0;

  return (
    <>
      {tournament && (
        <>
          <TournamentSchema tournament={tournament} />
          <BreadcrumbSchema items={[
            { name: 'Home', url: 'https://battlezone.com' },
            { name: 'Tournaments', url: 'https://battlezone.com/tournaments' },
            { name: tournament.title || tournament.name, url: `https://battlezone.com/tournaments/${params.id}` },
          ]} />
        </>
      )}
      <Navbar />
      <main className="min-h-screen bg-dark-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link href="/tournaments" className="inline-flex items-center text-dark-400 hover:text-white mb-6">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tournaments
          </Link>

          {/* Tournament Header */}
          <div className="card p-6 mb-6">
            {tournament.banner?.url && (
              <img src={tournament.banner.url} alt={tournament.title} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusBadge(tournament.status)}`}>
                  {tournament.status.replace('_', ' ').toUpperCase()}
                </span>
                <h1 className="text-2xl md:text-3xl font-bold">{tournament.title}</h1>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gaming-green">₹{tournament.prizePool}</div>
                <div className="text-dark-400 text-sm">Total Prize Pool</div>
              </div>
            </div>

            <p className="text-dark-300 mb-6">{tournament.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Entry Fee</div>
                <div className="text-xl font-bold">{tournament.entryFee === 0 ? 'FREE' : `₹${tournament.entryFee}`}</div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Format</div>
                <div className="text-xl font-bold capitalize">{tournament.format}</div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Teams</div>
                <div className="text-xl font-bold">{tournament.registeredTeams || 0}/{tournament.maxTeams}</div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <div className="text-dark-400 text-sm">Mode</div>
                <div className="text-xl font-bold capitalize">{tournament.mode}</div>
              </div>
            </div>
          </div>

          {/* Tournament Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Tournament Schedule</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-dark-400">Registration Opens</dt>
                  <dd className="font-medium">{new Date(tournament.registrationStartAt).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Registration Closes</dt>
                  <dd className="font-medium">{new Date(tournament.registrationEndAt).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Tournament Starts</dt>
                  <dd className="font-medium">{new Date(tournament.startAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Tournament Ends</dt>
                  <dd className="font-medium">{new Date(tournament.endAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Prize Distribution</h2>
              <div className="space-y-2">
                {tournament.prizeDistribution?.map((prize, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-dark-400">
                      {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`} {prize.position}
                    </span>
                    <span className="font-bold text-gaming-green">₹{prize.prize}</span>
                  </div>
                )) || (
                    <p className="text-dark-400">Prize details coming soon</p>
                  )}
              </div>
            </div>
          </div>

          {/* Rules */}
          {tournament.rules?.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">Rules & Regulations</h2>
              <ul className="space-y-2 text-dark-300">
                {tournament.rules.map((rule, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-primary-400">{idx + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Matches Schedule with Room Credentials */}
          {tournament.matches?.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">Match Schedule</h2>
              <div className="space-y-4">
                {tournament.matches.map((match, idx) => (
                  <div key={match._id} className="bg-dark-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-dark-400 text-sm">Match {idx + 1}</span>
                        <div className="font-medium">{match.title}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-dark-400">{new Date(match.scheduledAt).toLocaleString()}</div>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(match.status)}`}>
                          {match.status}
                        </span>
                      </div>
                    </div>

                    {/* Room Credentials for this match */}
                    {isRegistered && matchCredentials[match._id] && (
                      <div className="mt-3 pt-3 border-t border-dark-600">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gaming-green text-sm font-medium">🎮 Room Credentials</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-dark-800 rounded p-3">
                            <div className="text-dark-400 text-xs mb-1">Room ID</div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold">{matchCredentials[match._id].roomId}</span>
                              <button
                                onClick={() => copyToClipboard(matchCredentials[match._id].roomId, `room-${match._id}`)}
                                className="text-xs text-dark-400 hover:text-white"
                              >
                                {copied === `room-${match._id}` ? '✓' : '📋'}
                              </button>
                            </div>
                          </div>
                          <div className="bg-dark-800 rounded p-3">
                            <div className="text-dark-400 text-xs mb-1">Password</div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold">{matchCredentials[match._id].password}</span>
                              <button
                                onClick={() => copyToClipboard(matchCredentials[match._id].password, `pass-${match._id}`)}
                                className="text-xs text-dark-400 hover:text-white"
                              >
                                {copied === `pass-${match._id}` ? '✓' : '📋'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Waiting for credentials */}
                    {isRegistered && !matchCredentials[match._id] && match.status === 'upcoming' && (
                      <div className="mt-3 pt-3 border-t border-dark-600">
                        <div className="flex items-center gap-2 text-yellow-500 text-sm">
                          <span>⏳</span>
                          <span>Room credentials will be shared before the match</span>
                        </div>
                      </div>
                    )}

                    <Link href={`/matches/${match._id}`} className="block mt-3 text-primary-400 text-sm hover:underline">
                      View Match Details →
                    </Link>
                  </div>
                ))}
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

            {tournament.status === 'registration_open' && (
              <>
                {isRegistered ? (
                  <div className="text-center text-gaming-green font-medium py-4">
                    ✓ You are registered for this tournament
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    disabled={isFull}
                    className="btn-primary w-full py-3 text-lg"
                  >
                    {isFull ? 'Registration Full' : `Register Now - ₹${tournament.entryFee || 'FREE'}`}
                  </button>
                )}
              </>
            )}

            {tournament.status === 'ongoing' && (
              <div className="text-center py-4">
                <div className="text-gaming-purple text-xl font-bold animate-pulse">Tournament in Progress!</div>
              </div>
            )}

            {tournament.status === 'completed' && (
              <div className="text-center py-4 text-dark-400">
                This tournament has ended
              </div>
            )}
          </div>

          {/* Tournament Chat */}
          {isRegistered && (
            <div className="card p-0 mb-6 overflow-hidden h-[500px] flex flex-col">
              <div className="p-4 border-b border-dark-700 bg-dark-800">
                <h3 className="font-bold text-white flex items-center gap-2">💬 Tournament Chat</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat tournamentId={params.id} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Register for Tournament</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">Team Name</label>
                <input
                  type="text"
                  value={teamForm.teamName}
                  onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
                  className="input"
                  placeholder="Enter team name"
                  required
                />
              </div>
              <p className="text-dark-400 text-sm">
                Entry fee of ₹{tournament.entryFee} will be deducted from your wallet.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRegisterModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={registering} className="btn-primary flex-1">
                  {registering ? 'Registering...' : 'Confirm Registration'}
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
