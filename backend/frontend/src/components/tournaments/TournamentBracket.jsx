'use client';

import { useState, useEffect } from 'react';

// Bracket visualization for tournament formats
export default function TournamentBracket({ tournament }) {
    const [rounds, setRounds] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);

    useEffect(() => {
        if (tournament) {
            generateBracket();
        }
    }, [tournament]);

    const generateBracket = () => {
        // For single elimination bracket
        if (tournament.format === 'single_elimination' && tournament.rounds) {
            setRounds(tournament.rounds);
        } else if (tournament.participants) {
            // Generate virtual bracket from participants if no rounds defined
            const numTeams = tournament.participants.length;
            const numRounds = Math.ceil(Math.log2(numTeams));

            const generatedRounds = [];
            let matchesInRound = Math.ceil(numTeams / 2);

            for (let r = 0; r < numRounds; r++) {
                const roundMatches = [];
                for (let m = 0; m < matchesInRound; m++) {
                    if (r === 0) {
                        // First round - pair participants
                        const team1Index = m * 2;
                        const team2Index = m * 2 + 1;
                        roundMatches.push({
                            id: `${r}-${m}`,
                            team1: tournament.participants[team1Index] || null,
                            team2: tournament.participants[team2Index] || null,
                            winner: null,
                            status: 'upcoming'
                        });
                    } else {
                        roundMatches.push({
                            id: `${r}-${m}`,
                            team1: null,
                            team2: null,
                            winner: null,
                            status: 'upcoming'
                        });
                    }
                }
                generatedRounds.push({
                    roundNumber: r + 1,
                    title: getRoundName(r, numRounds),
                    matches: roundMatches
                });
                matchesInRound = Math.ceil(matchesInRound / 2);
            }

            setRounds(generatedRounds);
        }
    };

    const getRoundName = (roundIndex, totalRounds) => {
        const remaining = totalRounds - roundIndex;
        if (remaining === 1) return 'Finals';
        if (remaining === 2) return 'Semi-Finals';
        if (remaining === 3) return 'Quarter-Finals';
        return `Round ${roundIndex + 1}`;
    };

    if (!tournament) {
        return (
            <div className="text-center py-8 text-gray-400">
                No tournament data available
            </div>
        );
    }

    // For Battle Royale format, show leaderboard instead
    if (tournament.format === 'battle_royale') {
        return (
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">Battle Royale Format</h3>
                <p className="text-gray-400 mb-6">
                    This tournament uses Battle Royale format. Rankings are determined by points from each match.
                </p>

                {/* Show leaderboard if available */}
                {tournament.leaderboard && tournament.leaderboard.length > 0 ? (
                    <div className="space-y-2">
                        {tournament.leaderboard.slice(0, 10).map((entry, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-gray-800/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                            index === 1 ? 'bg-gray-300 text-black' :
                                                index === 2 ? 'bg-orange-500 text-black' :
                                                    'bg-gray-700 text-white'
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-white">{entry.teamName || 'Team'}</span>
                                </div>
                                <div className="flex gap-6 text-sm">
                                    <span className="text-gray-400">{entry.totalKills || 0} kills</span>
                                    <span className="text-cyan-400 font-bold">{entry.totalPoints || 0} pts</span>
                                    {entry.prize > 0 && (
                                        <span className="text-green-400 font-bold">₹{entry.prize}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Tournament has not started yet</p>
                )}
            </div>
        );
    }

    // Elimination bracket view
    return (
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 overflow-x-auto">
            <h3 className="text-xl font-bold text-white mb-6">Tournament Bracket</h3>

            <div className="flex gap-8 min-w-max">
                {rounds.map((round, roundIndex) => (
                    <div key={roundIndex} className="flex flex-col">
                        {/* Round Header */}
                        <div className="text-center mb-4">
                            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                                {round.title || `Round ${round.roundNumber}`}
                            </h4>
                        </div>

                        {/* Matches */}
                        <div
                            className="flex flex-col justify-around flex-1"
                            style={{ gap: `${Math.pow(2, roundIndex) * 2}rem` }}
                        >
                            {(round.matches || []).map((match, matchIndex) => (
                                <div
                                    key={match.id || matchIndex}
                                    className={`w-48 bg-gray-800/80 rounded-lg overflow-hidden border ${match.status === 'live' ? 'border-red-500 shadow-lg shadow-red-500/20' :
                                            match.status === 'completed' ? 'border-green-500/50' :
                                                'border-gray-700'
                                        }`}
                                    onClick={() => setSelectedMatch(match)}
                                >
                                    {/* Team 1 */}
                                    <div className={`px-3 py-2 flex justify-between items-center border-b border-gray-700 ${match.winner?.user?.toString() === match.team1?.user?.toString() ? 'bg-green-500/20' : ''
                                        }`}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            {match.team1 ? (
                                                <>
                                                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                        {(match.team1.teamName || match.team1.user?.name || 'T')[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-white truncate">
                                                        {match.team1.teamName || match.team1.user?.name || 'Team 1'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">TBD</span>
                                            )}
                                        </div>
                                        {match.team1?.score !== undefined && (
                                            <span className="text-sm font-bold text-white">{match.team1.score}</span>
                                        )}
                                    </div>

                                    {/* Team 2 */}
                                    <div className={`px-3 py-2 flex justify-between items-center ${match.winner?.user?.toString() === match.team2?.user?.toString() ? 'bg-green-500/20' : ''
                                        }`}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            {match.team2 ? (
                                                <>
                                                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                        {(match.team2.teamName || match.team2.user?.name || 'T')[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-white truncate">
                                                        {match.team2.teamName || match.team2.user?.name || 'Team 2'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">TBD</span>
                                            )}
                                        </div>
                                        {match.team2?.score !== undefined && (
                                            <span className="text-sm font-bold text-white">{match.team2.score}</span>
                                        )}
                                    </div>

                                    {/* Match Status */}
                                    {match.status === 'live' && (
                                        <div className="px-3 py-1 bg-red-500/20 text-center">
                                            <span className="text-xs text-red-400 font-bold uppercase flex items-center justify-center gap-1">
                                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                Live
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Winner Display */}
                {tournament.status === 'completed' && tournament.leaderboard?.[0] && (
                    <div className="flex flex-col justify-center items-center">
                        <div className="text-center">
                            <div className="text-5xl mb-2">🏆</div>
                            <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-2">Champion</h4>
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-2">
                                {(tournament.leaderboard[0].teamName || 'W')[0].toUpperCase()}
                            </div>
                            <p className="text-white font-bold">{tournament.leaderboard[0].teamName}</p>
                            {tournament.leaderboard[0].prize > 0 && (
                                <p className="text-green-400 font-bold">₹{tournament.leaderboard[0].prize}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-700 rounded" />
                    <span className="text-gray-400">Upcoming</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded animate-pulse" />
                    <span className="text-gray-400">Live</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500/50 rounded" />
                    <span className="text-gray-400">Completed</span>
                </div>
            </div>
        </div>
    );
}
