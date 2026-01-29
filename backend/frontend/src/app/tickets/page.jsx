'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TicketsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical',
    message: '',
  });

  const categories = [
    { value: 'payment', label: 'Payment Issue' },
    { value: 'withdrawal', label: 'Withdrawal Issue' },
    { value: 'match', label: 'Match Related' },
    { value: 'tournament', label: 'Tournament Related' },
    { value: 'account', label: 'Account Issue' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'report_user', label: 'Report User' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const fetchTickets = async () => {
    try {
      const data = await api.getTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.createTicket(newTicket);
      setShowNewTicket(false);
      setNewTicket({ subject: '', category: 'technical', message: '' });
      fetchTickets();
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      await api.replyToTicket(selectedTicket._id, replyMessage);
      setReplyMessage('');
      // Refresh ticket
      const data = await api.getTicket(selectedTicket._id);
      setSelectedTicket(data.ticket);
      fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      resolved: 'bg-green-500/20 text-green-400',
      closed: 'bg-dark-600 text-dark-400',
    };
    return badges[status] || badges.open;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'text-dark-400',
      normal: 'text-blue-400',
      high: 'text-orange-400',
      urgent: 'text-red-400',
    };
    return badges[priority] || badges.normal;
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Support Tickets</h1>
              <p className="text-dark-400 text-sm">Get help from our support team</p>
            </div>
            <button onClick={() => setShowNewTicket(true)} className="btn-primary">
              New Ticket
            </button>
          </div>

          {/* Tickets List */}
          {tickets.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-4">🎫</div>
              <h2 className="text-xl font-bold mb-2">No tickets yet</h2>
              <p className="text-dark-400 mb-4">Create a ticket if you need help</p>
              <button onClick={() => setShowNewTicket(true)} className="btn-primary">
                Create Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="card p-4 cursor-pointer hover:bg-dark-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h3 className="font-medium">{ticket.subject}</h3>
                      <p className="text-dark-400 text-sm mt-1 line-clamp-1">{ticket.message}</p>
                    </div>
                    <div className="text-right text-xs text-dark-500">
                      <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                      <div className="capitalize">{ticket.category}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="label">Category</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="input"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="input"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Describe your issue in detail..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewTicket(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-dark-400 capitalize">{selectedTicket.category}</span>
                </div>
                <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-dark-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="space-y-4 mb-4 max-h-[40vh] overflow-y-auto">
              {/* Original message */}
              <div className="bg-dark-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">You</span>
                  <span className="text-xs text-dark-500">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-dark-300">{selectedTicket.message}</p>
              </div>

              {/* Replies */}
              {selectedTicket.replies?.map((reply, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 ${
                    reply.isAdmin ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-dark-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {reply.isAdmin ? '🛡️ Support Team' : 'You'}
                    </span>
                    <span className="text-xs text-dark-500">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-dark-300">{reply.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== 'closed' && (
              <form onSubmit={handleReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="input flex-1"
                  placeholder="Type your reply..."
                />
                <button type="submit" className="btn-primary">
                  Send
                </button>
              </form>
            )}

            {selectedTicket.status === 'closed' && (
              <div className="text-center text-dark-400 py-4">
                This ticket is closed
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
