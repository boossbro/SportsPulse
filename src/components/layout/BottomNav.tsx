import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Bell, Mail } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/create', icon: PlusCircle, label: 'Create' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/messages', icon: Mail, label: 'Messages' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive(path)
                ? 'text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive(path) ? 'fill-primary' : ''}`} />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
