'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const REASON_OPTIONS = [
    { value: 'wrong_result', label: 'Wrong Result' },
    { value: 'missing_kills', label: 'Missing Kills' },
    { value: 'wrong_position', label: 'Wrong Position' },
    { value: 'prize_not_received', label: 'Prize Not Received' },
    { value: 'cheating', label: 'Cheating Report' },
    { value: 'bug_issue', label: 'Bug/Technical Issue' },
    { value: 'other', label: 'Other' },
];

export default function DisputeForm({ matchId, matchTitle, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        reason: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.reason) {
            setError('Please select a reason');
            return;
        }

        if (!formData.description || formData.description.length < 20) {
            setError('Please provide a detailed description (at least 20 characters)');
            return;
        }

        setSubmitting(true);
        try {
            await api.createDispute(matchId, {
                reason: formData.reason,
                description: formData.description,
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit dispute');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Dispute Match Result</h3>

            {matchTitle && (
                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400">Match</p>
                    <p className="text-white font-medium">{matchTitle}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Reason */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Reason for Dispute *</label>
                    <select
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        required
                    >
                        <option value="">Select a reason...</option>
                        {REASON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">
                        Describe the issue in detail *
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Please explain what happened and why you think the result is incorrect..."
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                        rows={4}
                        maxLength={1000}
                        required
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                        {formData.description.length}/1000
                    </div>
                </div>

                {/* Tips */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm font-medium mb-2">💡 Tips for a successful dispute:</p>
                    <ul className="text-yellow-200/80 text-sm space-y-1">
                        <li>• Be specific about what you think is wrong</li>
                        <li>• Include your in-game name and expected kills/position</li>
                        <li>• You can add screenshot evidence after submitting</li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Dispute'}
                    </button>
                </div>
            </form>
        </div>
    );
}
