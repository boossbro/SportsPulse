import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MatchDetailPage from './pages/MatchDetailPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import BettingPage from './pages/BettingPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import FeedPage from './pages/FeedPage';
import BlogPage from './pages/BlogPage';
import CreateBlogPage from './pages/CreateBlogPage';
import MessagesPage from './pages/MessagesPage';
import TrendingPage from './pages/TrendingPage';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useSidebar } from './hooks/useSidebar';

function App() {
  const { isOpen, toggle } = useSidebar();

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Header onMenuClick={toggle} />
                  <div className="flex relative">
                    <Sidebar isOpen={isOpen} onClose={() => toggle()} />
                    <main className="flex-1 min-w-0">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/match/:id" element={<MatchDetailPage />} />
                        <Route path="/news" element={<NewsPage />} />
                        <Route path="/news/:id" element={<NewsDetailPage />} />
                        <Route path="/betting" element={<BettingPage />} />
                        <Route path="/feed" element={<FeedPage />} />
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/blog/new" element={<CreateBlogPage />} />
                        <Route path="/blog/:id" element={<FeedPage />} />
                        <Route path="/trending" element={<TrendingPage />} />
                        <Route path="/hashtag/:tag" element={<TrendingPage />} />
                        <Route path="/profile/:id" element={<ProfilePage />} />
                        <Route path="/profile/edit" element={<EditProfilePage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
