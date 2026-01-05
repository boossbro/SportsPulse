import { useDoubleBackExit } from "./hooks/useDoubleBackExit";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import StoryDetailPage from './pages/StoryDetailPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import CreateBlogPage from './pages/CreateBlogPage';
import CreateVideoPage from './pages/CreateVideoPage';
import MessagesPage from './pages/MessagesPage';
import TrendingPage from './pages/TrendingPage';
import HashtagPage from './pages/HashtagPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import CommunityPage from './pages/CommunityPage';
import VideosPage from './pages/VideosPage';
import LeaderboardPage from './pages/LeaderboardPage';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useSidebar } from './hooks/useSidebar';

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
      <p className="text-sm text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

function App() {
  const { isOpen, toggle } = useSidebar();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <Header onMenuClick={toggle} />
                  <div className="flex relative">
                    <Sidebar isOpen={isOpen} onClose={() => toggle()} />
                    <main className="flex-1 min-w-0">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/story/:id" element={<StoryDetailPage />} />
                        <Route path="/create" element={<CreateBlogPage />} />
                        <Route path="/upload-video" element={<CreateVideoPage />} />
                        <Route path="/trending" element={<TrendingPage />} />
                        <Route path="/hashtag/:tag" element={<HashtagPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/community" element={<CommunityPage />} />
                        <Route path="/videos" element={<VideosPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route path="/profile/:id" element={<ProfilePage />} />
                        <Route path="/profile/edit" element={<EditProfilePage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                      </Routes>
                    </main>
                  </div>
                  {/* Bottom Navigation for Mobile */}
                  <BottomNav />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
