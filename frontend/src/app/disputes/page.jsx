'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const REASON_LABELS = {
    wrong_result: 'Wrong Result',
    missing_kills: 'Missing Kills',
    wrong_position: 'Wrong Position',
    prize_not_received: 'Prize Not Received',
    cheating: 'Cheating Report',
    bug_issue: 'Bug/Technical Issue',
    other: 'Other',
};

export default function DisputesPage() {
    const { user, loading: authLoading } = useAuth();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    useEffect(() => {
        if (!authLoading && user) {
            fetchDisputes();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading, filter, pagination.page]);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(filter !== 'all' && { status: filter }),
            };
            const data = await api.getMyDisputes(params);
            setDisputes(data.disputes || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
            }));
        } catch (err) {
            console.error('Failed to fetch disputes:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user && !authLoading) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl mb-4">⚖️</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
                        <p className="text-gray-400 mb-6">Please login to view your disputes</p>
                        <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold">
                            Login
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">My Disputes</h1>
                        <p className="text-gray-400">Track and manage your result disputes</p>
                    </div>

                    {/* Info Card */}
                    <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-6 border border-cyan-500/30 mb-8">
                        <h3 className="font-bold text-white mb-2">📋 How Disputes Work</h3>
                        <ul className="text-gray-300 text-sm space-y-1">
                            <li>• Submit a dispute within 24 hours of match completion</li>
                            <li>• Provide clear evidence (screenshots/videos) to support your claim</li>
                            <li>• Our team reviews disputes within 24-48 hours</li>
                            <li>• You'll be notified once a decision is made</li>
                        </ul>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {['all', 'pending', 'under_review', 'resolved', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setFilter(status);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === status
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                        : 'bg-gray-800/30 text-gray-400 hover:text-white border border-transparent'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Disputes List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 animate-pulse">
                                    <div className="space-y-3">
                                        <div className="h-5 w-3/4 bg-gray-700 rounded" />
                                        <div className="h-4 w-1/2 bg-gray-700 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : disputes.length === 0 ? (
                        <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                            <div className="text-5xl mb-4">📋</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Disputes</h3>
                            <p className="text-gray-400">
                                {filter === 'all'
                                    ? "You haven't submitted any disputes yet"
                                    : `No ${filter.replace('_', ' ')} disputes found`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {disputes.map((dispute) => (
                                <Link
                                    key={dispute._id}
                                    href={`/disputes/${dispute._id}`}
                                    className="block bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 hover:border-cyan-500/30 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[dispute.status]}`}>
                                                    {dispute.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    {REASON_LABELS[dispute.reason] || dispute.reason}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-white mb-2">
                                                Match: {dispute.match?.title || 'Unknown Match'}
                                            </h3>

                                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                                {dispute.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                <span>📅 Submitted: {formatDate(dispute.createdAt)}</span>
                                                {dispute.evidence?.length > 0 && (
                                                    <span>📎 {dispute.evidence.length} evidence attached</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <span className="text-cyan-400 text-sm font-medium">View Details →</span>
                                        </div>
                                    </div>

                                    {/* Resolution info if resolved */}
                                    {dispute.status === 'resolved' && dispute.resolution && (
                                        <div className="mt-4 pt-4 border-t border-gray-800">
                                            <span className={`text-sm font-medium ${dispute.resolution === 'accepted' ? 'text-green-400' :
                                                    dispute.resolution === 'partially_accepted' ? 'text-yellow-400' :
                                                        'text-red-400'
                                                }`}>
                                                Resolution: {dispute.resolution.replace('_', ' ')}
                                            </span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.total > pagination.limit && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-400">
                                Page {pagination.page}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={disputes.length < pagination.limit}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
