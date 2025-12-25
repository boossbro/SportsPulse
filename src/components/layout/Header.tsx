import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Newspaper, TrendingUp, LogOut, User } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { authService } from '../../lib/auth';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const navItems = [
    { path: '/', label: 'Scores' },
    { path: '/news', label: 'News', icon: Newspaper },
    { path: '/betting', label: 'Tips', icon: TrendingUp },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button 
              onClick={onMenuClick}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">LiveScore</span>
            </Link>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{label}</span>
              </Link>
            ))}
            
            {/* User Menu */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded shadow-lg z-50">
                    <div className="p-3 border-b border-border">
                      <div className="text-sm font-medium text-foreground">{user?.username}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                    </div>
                    <Link
                      to={`/profile/${user?.id}`}
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>View Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
