import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StoryDetailPage from './pages/StoryDetailPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
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
                <div className="min-h-screen bg-gray-50">
                  <Header onMenuClick={toggle} />
                  <div className="flex relative">
                    <Sidebar isOpen={isOpen} onClose={() => toggle()} />
                    <main className="flex-1 min-w-0">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/story/:id" element={<StoryDetailPage />} />
                        <Route path="/create" element={<CreateBlogPage />} />
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
