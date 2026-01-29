'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sendMessage, getMatchMessages, SOCKET_URL } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { io } from 'socket.io-client';

export default function MatchChat({ matchId, isJoined = false }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (matchId && user) {
            fetchMessages();
            connectSocket();
        } else {
            setLoading(false);
        }

        return () => {
            if (socket) {
                socket.emit('leave_match', matchId);
                socket.disconnect();
            }
        };
    }, [matchId, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const connectSocket = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socketInstance = io(SOCKET_URL, {
            auth: { token }
        });

        socketInstance.on('connect', () => {
            socketInstance.emit('join_match', matchId);
        });

        socketInstance.on('new_message', (message) => {
            if (message.match === matchId || message.matchId === matchId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
            }
        });

        setSocket(socketInstance);
    };

    const fetchMessages = async () => {
        try {
            const data = await getMatchMessages(matchId);
            setMessages(data.data || []);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            await sendMessage(matchId, null, messageContent);
            // Message will be added via socket, no need for optimistic update to avoid duplication

        } catch (err) {
            console.error('Failed to send message:', err);
            setNewMessage(messageContent); // Restore message on error
        } finally {
            setSending(false);
        }
    };

    if (!user) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Match Chat</h3>
                <p className="text-gray-400 text-center py-8">Login to participate in the chat</p>
            </div>
        );
    }

    if (!isJoined) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Match Chat</h3>
                <p className="text-gray-400 text-center py-8">Join the match to access the chat</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800 flex flex-col h-96">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="font-bold text-white flex items-center gap-2">
                    💬 Match Chat
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = message.sender?._id === user._id;
                        return (
                            <div
                                key={message._id || index}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                                    {!isOwn && (
                                        <p className="text-xs text-gray-400 mb-1">{message.sender?.name || 'Unknown'}</p>
                                    )}
                                    <div className={`px-4 py-2 rounded-2xl ${isOwn
                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-br-sm'
                                        : 'bg-gray-800 text-white rounded-bl-sm'
                                        }`}>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        maxLength={500}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50"
                    >
                        {sending ? '...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
}
