import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, User, Repeat, AtSign, UserPlus, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'mentions' | 'likes'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-6 h-6 text-red-500 fill-red-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-6 h-6 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-6 h-6 text-green-500" />;
      case 'repost':
        return <Repeat className="w-6 h-6 text-primary" />;
      case 'mention':
        return <AtSign className="w-6 h-6 text-purple-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.type === 'follow') {
      return `/profile/${notification.actor_id}`;
    }
    
    if (notification.content_type === 'blog_post') {
      return `/story/${notification.content_id}`;
    }
    
    if (notification.content_type === 'community_post') {
      return `/community#${notification.content_id}`;
    }
    
    if (notification.content_type === 'video') {
      return `/videos#${notification.content_id}`;
    }
    
    return '#';
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'mentions') return n.type === 'mention';
    if (filter === 'likes') return n.type === 'like';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen bg-white pb-20">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-14 bg-white z-10 border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">{unreadCount} unread</p>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex border-t border-gray-100">
          {[
            { key: 'all', label: 'All' },
            { key: 'mentions', label: 'Mentions' },
            { key: 'likes', label: 'Likes' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                filter === key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-sm text-gray-600">
              When you get notifications, they'll show up here
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <Link
              key={notification.id}
              to={getNotificationLink(notification)}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              className={`block border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="p-4 flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 pt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {notification.actor && (
                        <Link
                          to={`/profile/${notification.actor_id}`}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notification.actor.avatar_url ? (
                            <img
                              src={notification.actor.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-500" />
                          )}
                        </Link>
                      )}
                      <div>
                        <span className="font-semibold text-gray-900">
                          {notification.actor?.username || 'Someone'}
                        </span>
                        <span className="text-gray-600 ml-1">
                          {notification.message}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {getTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>

                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
