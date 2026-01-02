import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, User, Repeat, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'mentions' | 'likes'>('all');

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
        return <MessageCircle className="w-6 h-6 text-blue-500" />;
      case 'follow':
        return <User className="w-6 h-6 text-green-500" />;
      case 'repost':
        return <Repeat className="w-6 h-6 text-primary" />;
      case 'mention':
        return <AtSign className="w-6 h-6 text-purple-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  // Mock notifications for demo
  const mockNotifications = [
    {
      id: '1',
      type: 'like',
      user: { username: 'john_doe', avatar: null },
      content: 'liked your post',
      preview: 'Amazing story about technology trends...',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'comment',
      user: { username: 'jane_smith', avatar: null },
      content: 'commented on your post',
      preview: 'Great insights! I especially liked...',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'follow',
      user: { username: 'tech_writer', avatar: null },
      content: 'started following you',
      preview: null,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: true,
    },
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-14 bg-white z-10 border-b border-gray-200">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
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
        {notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-sm text-gray-600">
              When you get notifications, they'll show up here
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              to={`/story/${notification.id}`}
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
                      <Link
                        to={`/profile/${notification.user.username}`}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
                      >
                        {notification.user.avatar ? (
                          <img
                            src={notification.user.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </Link>
                      <div>
                        <span className="font-semibold text-gray-900">
                          {notification.user.username}
                        </span>
                        <span className="text-gray-600 ml-1">
                          {notification.content}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {getTimeAgo(notification.timestamp)}
                    </span>
                  </div>

                  {notification.preview && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.preview}
                    </p>
                  )}
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
