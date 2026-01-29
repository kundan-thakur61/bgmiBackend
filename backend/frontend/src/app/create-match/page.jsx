'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getMatches } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CreateMatchPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gameType: 'pubg_mobile',
    matchType: 'tdm',
    mode: 'squad',
    map: 'erangel',
    entryFee: '',
    prizePool: '',
    perKillPrize: '0',
    maxSlots: '2', // Default to 1v1 challenge
    minLevelRequired: 'bronze',
    scheduledAt: '',
    roomId: '',
    roomPassword: '',
    rules: [],
    isFeatured: false,
    tags: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [activeMatches, setActiveMatches] = useState([]);
  const [checkingActiveMatch, setCheckingActiveMatch] = useState(true);
  const MAX_ACTIVE_MATCHES = 3;

  // Calculate costs
  const prizePool = parseInt(formData.prizePool) || 0;
  const creationFee = Math.max(Math.floor(prizePool * 0.10), prizePool > 0 ? 5 : 0);
  const totalCost = creationFee + prizePool;
  const entryFee = parseInt(formData.entryFee) || 0;

  useEffect(() => {
    setIsVisible(true);

    // Check if user already has an active match THEY CREATED
    const checkActiveMatch = async () => {
      try {
        // Use user.id or user._id (API returns 'id')
        const userId = user?.id || user?._id;
        if (!userId) {
          setCheckingActiveMatch(false);
          return;
        }

        const matches = await getMatches({
          createdBy: userId,
          status: 'upcoming,registration_open,registration_closed,room_revealed,live,result_pending'
        });

        // Find all matches created by this user
        const myActiveMatches = matches.matches.filter(match => {
          const matchCreatorId = match.createdBy?._id || match.createdBy?.id || match.createdBy;
          return matchCreatorId === userId || matchCreatorId?.toString() === userId?.toString();
        });

        setActiveMatches(myActiveMatches);
        if (myActiveMatches.length >= MAX_ACTIVE_MATCHES) {
          setError(`You already have ${myActiveMatches.length} active challenges. Maximum ${MAX_ACTIVE_MATCHES} allowed at a time.`);
        }
      } catch (err) {
        console.error('Error checking active matches:', err);
      } finally {
        setCheckingActiveMatch(false);
      }
    };

    if (user) {
      checkActiveMatch();
    } else {
      setCheckingActiveMatch(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRuleChange = (index, value) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData(prev => ({ ...prev, rules: newRules }));
  };

  const addRule = () => {
    setFormData(prev => ({ ...prev, rules: [...prev.rules, ''] }));
  };

  const removeRule = (index) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, rules: newRules }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user already has max active matches
    if (activeMatches.length >= MAX_ACTIVE_MATCHES) {
      setError(`You already have ${activeMatches.length} active challenges. Maximum ${MAX_ACTIVE_MATCHES} allowed at a time.`);
      return;
    }

    // Validate room credentials
    if (!formData.roomId || !formData.roomPassword) {
      setError('Room ID and Password are required. You need to create a room in the game first.');
      return;
    }

    // Validate balance
    if (user.walletBalance < totalCost) {
      setError(`Insufficient balance. You need ₹${totalCost} but have ₹${user.walletBalance}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const matchData = {
        ...formData,
        entryFee: parseInt(formData.entryFee),
        prizePool: parseInt(formData.prizePool),
        perKillPrize: parseInt(formData.perKillPrize),
        maxSlots: parseInt(formData.maxSlots),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        roomId: formData.roomId,
        roomPassword: formData.roomPassword
      };

      const result = await api.createUserMatch(matchData);

      // Update user balance in context
      if (result.costs) {
        updateUser({ walletBalance: user.walletBalance - result.costs.totalDeducted });
      }

      if (result.match && result.match._id) {
        router.push(`/matches/${result.match._id}`);
      } else {
        router.push('/create-match');
      }
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="text-center p-8 bg-dark-800/50 backdrop-blur-md rounded-2xl border border-dark-700">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl text-dark-200 mb-4">Please log in to create a challenge</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking for active match
  if (checkingActiveMatch) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="text-center p-8 bg-dark-800/50 backdrop-blur-md rounded-2xl border border-dark-700">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-xl text-dark-200 mb-4">Checking your active matches...</p>
        </div>
      </div>
    );
  }

  // Show message if user already has max active matches
  if (activeMatches.length >= MAX_ACTIVE_MATCHES) {
    return (
      <div className="max-w-4xl mx-auto p-4 min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 pt-16">
        <div className="text-center p-8 bg-dark-800/50 backdrop-blur-md rounded-2xl border border-dark-700">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-yellow-400 mb-2">Maximum Active Matches Reached!</p>
          <p className="text-lg text-dark-200 mb-6">You have {activeMatches.length} active challenges. Maximum {MAX_ACTIVE_MATCHES} allowed at a time.</p>

          <div className="bg-dark-700/50 p-6 rounded-xl mb-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-3">Your Active Matches ({activeMatches.length}/{MAX_ACTIVE_MATCHES})</h3>
            <div className="space-y-4">
              {activeMatches.map((match, index) => (
                <div key={match._id} className="bg-dark-800/50 p-4 rounded-lg border border-dark-600 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{index + 1}. {match.title}</p>
                      <p className="text-dark-400 text-sm">Status: <span className="text-yellow-400">{match.status}</span></p>
                      <p className="text-dark-400 text-sm">Players: {match.filledSlots}/{match.maxSlots}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/matches/${match._id}`)}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/matches')}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300"
            >
              View All Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gameIcons = {
    pubg_mobile: '🎯',
    free_fire: '🔥'
  };

  const modeIcons = {
    squad: '👥',
    duo: '👤👤',
    solo: '👤'
  };

  const levelColors = {
    bronze: 'from-orange-600 to-orange-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-500 to-yellow-700',
    platinum: 'from-cyan-400 to-cyan-600',
    diamond: 'from-blue-400 to-purple-500'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gaming-purple/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className={`relative max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-gaming-purple rounded-2xl mb-4 sm:mb-6 shadow-lg shadow-primary-500/30 animate-float">
            <span className="text-3xl sm:text-4xl">⚔️</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-300">
            Create Challenge
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-dark-400 max-w-2xl mx-auto">
            Challenge opponents to a TDM match! Set your prize pool and wait for challengers.
          </p>

          {/* Wallet Balance Display */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-dark-800/80 rounded-xl border border-dark-700">
            <span className="text-dark-400">Your Balance:</span>
            <span className={`font-bold ${user?.walletBalance >= totalCost ? 'text-green-400' : 'text-red-400'}`}>
              ₹{user?.walletBalance || 0}
            </span>
          </div>
        </div>

        {/* How It Works Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-500/10 to-gaming-purple/10 border border-primary-500/30 rounded-2xl">
          <h3 className="text-lg font-semibold text-primary-400 mb-3">🎮 How Challenge Matches Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="bg-primary-500/20 text-primary-400 rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</span>
              <p className="text-dark-300">You pay <strong className="text-white">Creation Fee + Prize Pool</strong> upfront</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary-500/20 text-primary-400 rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</span>
              <p className="text-dark-300">Challenge goes <strong className="text-white">live for everyone</strong> to see</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary-500/20 text-primary-400 rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</span>
              <p className="text-dark-300">Opponent pays <strong className="text-white">Entry Fee</strong> to accept</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary-500/20 text-primary-400 rounded-full w-6 h-6 flex items-center justify-center shrink-0">4</span>
              <p className="text-dark-300"><strong className="text-green-400">Room ID & Password</strong> revealed to both</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/50 text-red-400 rounded-2xl backdrop-blur-md animate-shake">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-gaming-purple/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-dark-800/50 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl sm:text-3xl">📝</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Weapon Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter an exciting match title"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Game Type <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="gameType"
                      value={formData.gameType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-all duration-300 appearance-none cursor-pointer"
                    >
                      <option value="pubg_mobile">🎯 PUBG Mobile</option>
                      <option value="free_fire">🔥 Free Fire</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* Match Details */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-dark-800/50 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl sm:text-3xl">🎮</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold">Match Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Select Map <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value="TDM /CUSTOM"
                      disabled
                      className="w-full px-4 py-3 bg-dark-700/30 border-2 border-dark-600 rounded-xl text-dark-400 cursor-not-allowed"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">

                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Mode <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="mode"
                      value={formData.mode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pl-12 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-all duration-300 appearance-none cursor-pointer"
                    >
                      <option value="squad">Squad (4 players)</option>
                      <option value="duo">Duo (2 players)</option>
                      <option value="solo">Solo (1 player)</option>
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      {modeIcons[formData.mode]}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-dark-800/50 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl sm:text-3xl">💰</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold">Challenge Pricing</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Prize Pool (₹) <span className="text-red-400">*</span>
                    <span className="text-xs text-dark-500 ml-2">(Winner takes all)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 font-semibold">₹</span>
                    <input
                      type="number"
                      name="prizePool"
                      value={formData.prizePool}
                      onChange={handleChange}
                      required
                      min="10"
                      className="w-full px-4 py-3 pl-10 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none transition-all duration-300"
                      placeholder="Min ₹10"
                    />
                  </div>
                  <p className="text-xs text-dark-500">This amount goes to the winner</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Entry Fee for Opponents (₹) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-semibold">₹</span>
                    <input
                      type="number"
                      name="entryFee"
                      value={formData.entryFee}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 pl-10 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none transition-all duration-300"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-dark-500">Opponents pay this to accept your challenge</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Max Players <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="maxSlots"
                      value={formData.maxSlots}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-all duration-300 appearance-none cursor-pointer"
                    >
                      <option value="2">1v1 (2 players)</option>
                      <option value="4">2v2 (4 players)</option>
                      <option value="8">4v4 (8 players)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              {prizePool > 0 && (
                <div className="mt-6 p-4 bg-dark-900/50 rounded-xl border border-dark-600">
                  <h4 className="text-sm font-semibold text-dark-300 mb-3">💳 Your Total Cost Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Prize Pool (goes to winner)</span>
                      <span className="text-yellow-400 font-medium">₹{prizePool}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Creation Fee (10%, min ₹5)</span>
                      <span className="text-orange-400 font-medium">₹{creationFee}</span>
                    </div>
                    <hr className="border-dark-600" />
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-white">Total You Pay Now</span>
                      <span className={totalCost <= (user?.walletBalance || 0) ? 'text-green-400' : 'text-red-400'}>₹{totalCost}</span>
                    </div>
                    {totalCost > (user?.walletBalance || 0) && (
                      <p className="text-red-400 text-xs mt-2">⚠️ Insufficient balance! Add ₹{totalCost - (user?.walletBalance || 0)} to your wallet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room Credentials */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-dark-800/50 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl sm:text-3xl">🔐</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold">Room Credentials</h2>
                  <p className="text-xs text-dark-400">Create a room in-game first, then enter details here</p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                <p className="text-yellow-400 text-sm">
                  🔒 <strong>Important:</strong> Room ID & Password will be hidden until an opponent joins. Both players will see them only after the match is full.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Room ID <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-lg">#</span>
                    <input
                      type="text"
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pl-10 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter room ID from game"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Room Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg">🔑</span>
                    <input
                      type="text"
                      name="roomPassword"
                      value={formData.roomPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pl-10 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter room password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Requirements */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-dark-800/50 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl sm:text-3xl">⏰</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold">Schedule & Requirements</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">
                    Scheduled Time <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg">📅</span>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pl-12 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-300">Minimum Level Required</label>
                  <div className="relative">
                    <select
                      name="minLevelRequired"
                      value={formData.minLevelRequired}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-all duration-300 appearance-none cursor-pointer"
                    >
                      <option value="bronze">🥉 Bronze</option>
                      <option value="silver">🥈 Silver</option>
                      <option value="gold">🥇 Gold</option>
                      <option value="platinum">💎 Platinum</option>
                      <option value="diamond">💠 Diamond</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full bg-gradient-to-r ${levelColors[formData.minLevelRequired]} transition-all duration-300`} />
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-dark-800/50 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl sm:text-3xl">📜</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold">Match Rules</h2>
                </div>
                <button
                  type="button"
                  onClick={addRule}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-gaming-purple rounded-xl font-semibold text-sm hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary-500/50"
                >
                  + Add Rule
                </button>
              </div>

              {formData.rules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-dark-600 rounded-2xl">
                  <div className="text-5xl mb-4">📝</div>
                  <p className="text-dark-400 mb-4">No rules added yet</p>
                  <button
                    type="button"
                    onClick={addRule}
                    className="px-6 py-3 bg-dark-700 hover:bg-dark-600 rounded-xl font-semibold transition-all duration-300"
                  >
                    Add Your First Rule
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-dark-700/30 rounded-xl border border-dark-600 hover:border-dark-500 transition-all duration-300 group/rule"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mt-1">
                        <span className="text-primary-400 font-bold text-sm">{index + 1}</span>
                      </div>
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => handleRuleChange(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-dark-700/50 border-2 border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none transition-all duration-300"
                        placeholder={`Rule ${index + 1}: e.g., No teaming allowed`}
                      />
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="flex-shrink-0 w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-300 flex items-center justify-center group-hover/rule:scale-110"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-dark-800/95 backdrop-blur-xl p-6 rounded-3xl border-2 border-dark-700 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-dark-400 mb-1">Ready to create your challenge?</p>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold">Total: <span className={totalCost <= (user?.walletBalance || 0) ? 'text-green-400' : 'text-red-400'}>₹{totalCost}</span></p>
                    {entryFee > 0 && <span className="text-sm text-dark-400">| Opponents pay: ₹{entryFee}</span>}
                  </div>
                  <p className="text-xs text-green-400 mt-1">✓ Room credentials revealed only after opponent joins</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 sm:flex-none px-6 py-3 bg-dark-700 hover:bg-dark-600 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totalCost > (user?.walletBalance || 0) || !formData.roomId || !formData.roomPassword}
                    className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-green-500/50 relative overflow-hidden group"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Challenge...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <span>⚔️</span>
                        <span className="ml-2">Create Challenge (₹{totalCost})</span>
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1f2937;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b5cf6, #ec4899);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a78bfa, #f472b6);
        }

        /* Remove number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
        }

        /* Custom date input styling */
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}