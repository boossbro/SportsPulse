import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { sendMessage, searchUsers } from '../lib/api';
import { Send, X, User, Loader2, Search } from 'lucide-react';

const ComposeMessagePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const recipientIdFromUrl = searchParams.get('to');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Debounced search
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setSearching(true);
        const results = await searchUsers(searchQuery, 10);
        setSearchResults(results.filter((u: any) => u.id !== user?.id));
        setSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedRecipient) return;

    setSending(true);
    const result = await sendMessage(selectedRecipient.id, message);

    if (result.data) {
      navigate('/messages');
    } else {
      alert('Failed to send message: ' + result.error);
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-14 bg-white z-10 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">New Message</h1>
          </div>
        </div>
      </div>

      {/* Recipient Selection */}
      {!selectedRecipient ? (
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a user..."
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Search Results */}
          {searching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No users found</p>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((userResult) => (
                <button
                  key={userResult.id}
                  onClick={() => setSelectedRecipient(userResult)}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {userResult.avatar_url ? (
                      <img src={userResult.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{userResult.username}</div>
                    {userResult.bio && <p className="text-sm text-gray-600 line-clamp-1">{userResult.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* Selected Recipient */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {selectedRecipient.avatar_url ? (
                  <img src={selectedRecipient.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{selectedRecipient.username}</div>
              </div>
              <button
                onClick={() => setSelectedRecipient(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Message Input */}
          <div className="flex-1 p-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full h-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              autoFocus
            />
          </div>

          {/* Send Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="w-full px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComposeMessagePage;
