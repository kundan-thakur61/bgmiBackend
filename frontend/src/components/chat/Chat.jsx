'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sendMessage, getMatchMessages, getTournamentMessages } from '@/lib/api';
import { io } from 'socket.io-client';

export default function Chat({ matchId, tournamentId }) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, { withCredentials: true });
    setSocket(newSocket);

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        let data;
        if (matchId) {
          data = await getMatchMessages(matchId);
        } else if (tournamentId) {
          data = await getTournamentMessages(tournamentId);
        }
        setMessages(data.data || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Join the appropriate room
    if (matchId) {
      newSocket.emit('join_match', matchId);
    } else if (tournamentId) {
      newSocket.emit('join_tournament', tournamentId);
    }

    // Listen for new messages
    newSocket.on('new_message', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      if (matchId) {
        newSocket.emit('leave_match', matchId);
      } else if (tournamentId) {
        newSocket.emit('leave_tournament', tournamentId);
      }
      newSocket.disconnect();
    };
  }, [matchId, tournamentId, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    try {
      await sendMessage(matchId, tournamentId, message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Please log in to use chat.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender._id === user._id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <span className="font-semibold text-sm mr-2">
                      {msg.sender.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}