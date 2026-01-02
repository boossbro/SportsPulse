import { Link, useLocation } from 'react-router-dom';
import { Clock, Trash2, X, FileText, MessageSquare, Hash, Home, TrendingUp, Video, Trophy, Mail, Bell, Search } from 'lucide-react';
import { useHistory } from '../../hooks/useHistory';
import { useAuth } from '../../stores/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { history, clearHistory, removeItem } = useHistory();

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const navigationLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/hashtag', label: 'Hashtags', icon: Hash },
    { path: '/trending', label: 'Trending', icon: TrendingUp },
    { path: '/community', label: 'Community', icon: MessageSquare },
    { path: '/videos', label: 'Videos', icon: Video },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/messages', label: 'Messages', icon: Mail },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:sticky lg:h-[calc(100vh-3.5rem)] overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="px-3 py-3 border-b border-gray-200">
            <nav className="space-y-1">
              {navigationLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    isActive(path)
                      ? 'text-primary bg-red-50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Recent Views Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Recent Views
              </h2>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-gray-600">
                  No recent activity
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Browse content to see it here
                </p>
              </div>
            ) : (
              <div>
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group border-b border-gray-100 hover:bg-gray-50 transition-colors relative"
                  >
                    <Link
                      to={item.link}
                      className="block px-4 py-3 pr-10"
                      onClick={() => {
                        onClose();
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded uppercase tracking-wide font-medium ${
                                item.type === 'match'
                                  ? 'bg-red-50 text-primary'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {item.type}
                            </span>
                            <span className="text-xs text-gray-500 tabular-nums">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-0.5">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded z-10"
                      title="Remove from history"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={clearHistory}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All History
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
