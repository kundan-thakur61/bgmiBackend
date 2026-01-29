'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function EditMatchPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        entryFee: '',
        prizePool: '',
        perKillPrize: '',
        maxSlots: '',
        scheduledAt: '',
        rules: []
    });

    useEffect(() => {
        if (!authLoading) {
            fetchMatch();
        }
    }, [params.id, authLoading]);

    const fetchMatch = async () => {
        try {
            const data = await api.getMatch(params.id);
            const matchData = data.match;
            setMatch(matchData);

            // Check if user can edit this match
            const creatorId = matchData.createdBy?._id || matchData.createdBy?.id || matchData.createdBy;
            const userId = user?.id || user?._id;
            const isCreator = creatorId === userId || creatorId?.toString() === userId?.toString();
            const isAdmin = user?.role && ['admin', 'super_admin', 'match_manager'].includes(user.role);

            if (!isCreator && !isAdmin) {
                setError('You do not have permission to edit this match');
                return;
            }

            // Check if match can be edited
            if (!['upcoming', 'registration_open'].includes(matchData.status)) {
                setError('This match cannot be edited anymore');
                return;
            }

            // Populate form with existing data
            setFormData({
                title: matchData.title || '',
                description: matchData.description || '',
                entryFee: matchData.entryFee?.toString() || '0',
                prizePool: matchData.prizePool?.toString() || '0',
                perKillPrize: matchData.perKillPrize?.toString() || '0',
                maxSlots: matchData.maxSlots?.toString() || '2',
                scheduledAt: matchData.scheduledAt ? new Date(matchData.scheduledAt).toISOString().slice(0, 16) : '',
                rules: matchData.rules || []
            });
        } catch (err) {
            setError('Match not found');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const updateData = {
                title: formData.title,
                description: formData.description,
                entryFee: parseInt(formData.entryFee) || 0,
                prizePool: parseInt(formData.prizePool) || 0,
                perKillPrize: parseInt(formData.perKillPrize) || 0,
                scheduledAt: new Date(formData.scheduledAt).toISOString(),
                rules: formData.rules.filter(r => r.trim() !== '')
            };

            // Only allow maxSlots update if no players have joined yet (except creator)
            const filledSlots = match.filledSlots || match.joinedUsers?.length || 0;
            if (filledSlots <= 1) {
                updateData.maxSlots = parseInt(formData.maxSlots) || 2;
            }

            await api.updateUserMatch(params.id, updateData);
            setSuccess('Match updated successfully!');

            // Redirect after a short delay
            setTimeout(() => {
                router.push(`/matches/${params.id}`);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to update match');
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </>
        );
    }

    if (!isAuthenticated) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Please log in to edit matches</h1>
                        <Link href="/login" className="btn-primary">Go to Login</Link>
                    </div>
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

    const filledSlots = match?.filledSlots || match?.joinedUsers?.length || 0;
    const canEditSlots = filledSlots <= 1;

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-dark-900 py-8">
                <div className="container mx-auto px-4 max-w-2xl">
                    {/* Back Button */}
                    <Link href={`/matches/${params.id}`} className="inline-flex items-center text-dark-400 hover:text-white mb-6">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Match
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Edit Match</h1>
                        <p className="text-dark-400">Update your match details</p>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl">
                            {success}
                        </div>
                    )}

                    {/* Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info Card */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span>📝</span> Basic Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Title <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="input w-full"
                                        placeholder="Match title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="input w-full"
                                        placeholder="Match description (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Scheduled Time <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="scheduledAt"
                                        value={formData.scheduledAt}
                                        onChange={handleChange}
                                        required
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing Card */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span>💰</span> Pricing
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Entry Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="entryFee"
                                        value={formData.entryFee}
                                        onChange={handleChange}
                                        min="0"
                                        className="input w-full"
                                    />
                                    <p className="text-xs text-dark-500 mt-1">What opponents pay to join</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Prize Pool (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="prizePool"
                                        value={formData.prizePool}
                                        onChange={handleChange}
                                        min="0"
                                        className="input w-full"
                                        disabled
                                    />
                                    <p className="text-xs text-yellow-500 mt-1">⚠️ Prize pool cannot be changed</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Per Kill Prize (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="perKillPrize"
                                        value={formData.perKillPrize}
                                        onChange={handleChange}
                                        min="0"
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Max Players
                                    </label>
                                    <select
                                        name="maxSlots"
                                        value={formData.maxSlots}
                                        onChange={handleChange}
                                        disabled={!canEditSlots}
                                        className="input w-full"
                                    >
                                        <option value="2">1v1 (2 players)</option>
                                        <option value="4">2v2 (4 players)</option>
                                        <option value="8">4v4 (8 players)</option>
                                    </select>
                                    {!canEditSlots && (
                                        <p className="text-xs text-yellow-500 mt-1">⚠️ Cannot change - players have joined</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rules Card */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span>📜</span> Match Rules
                                </h2>
                                <button
                                    type="button"
                                    onClick={addRule}
                                    className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm hover:bg-primary-500/30 transition-all"
                                >
                                    + Add Rule
                                </button>
                            </div>

                            {formData.rules.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-dark-600 rounded-xl">
                                    <p className="text-dark-400 mb-2">No rules added</p>
                                    <button
                                        type="button"
                                        onClick={addRule}
                                        className="text-primary-400 hover:text-primary-300"
                                    >
                                        Add your first rule
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.rules.map((rule, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm font-bold shrink-0">
                                                {index + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={rule}
                                                onChange={(e) => handleRuleChange(index, e.target.value)}
                                                className="input flex-1"
                                                placeholder={`Rule ${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeRule(index)}
                                                className="w-8 h-8 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center shrink-0"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <Link
                                href={`/matches/${params.id}`}
                                className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-semibold transition-all text-center"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </>
    );
}
