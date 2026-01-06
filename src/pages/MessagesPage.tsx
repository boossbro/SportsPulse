import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../stores/authStore';
import { getConversations, getMessages, sendMessage } from '../lib/api';
import { Loader2, Send, User, MessageCircle, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      if (selectedConv) {
        loadMessages(selectedConv.id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConv]);

  const loadConversations = async () => {
    const data = await getConversations();
    setConversations(data);
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    const data = await getMessages(convId);
    setMessages(data);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSelectConversation = (conv: any) => {
    setSelectedConv(conv);
    loadMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !user) return;

    setSending(true);
    
    // Get the other user's ID
    const otherUserId = selectedConv.user1_id === user.id 
      ? selectedConv.user2_id 
      : selectedConv.user1_id;

    const result = await sendMessage(otherUserId, newMessage);

    if (result.data) {
      setMessages([...messages, result.data]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }

    setSending(false);
  };

  const getOtherUser = (conv: any) => {
    if (!user) return null;
    return conv.user1_id === user.id ? conv.user2 : conv.user1;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-56px)]">
      <div className="flex h-full bg-card">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex-shrink-0 overflow-y-auto">
          <div className="px-4 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            <Link
              to="/messages/compose"
              className="p-2 bg-primary text-white rounded-full hover:bg-red-600 transition-colors"
              title="New message"
            >
              <Edit className="w-5 h-5" />
            </Link>
          </div>
          
          {conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 border-b border-border text-left hover:bg-secondary/30 transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-secondary/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                      {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {otherUser?.username || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="px-4 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {getOtherUser(selectedConv)?.avatar_url ? (
                      <img
                        src={getOtherUser(selectedConv).avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {getOtherUser(selectedConv)?.username || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                          {msg.sender?.avatar_url ? (
                            <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
