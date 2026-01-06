import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { getAllUsers, followUser, unfollowUser, checkIsFollowing } from '../lib/api';
import { Users, Loader2, User, Search, TrendingUp, UserPlus, UserCheck } from 'lucide-react';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [followStates, setFollowStates] = useState<Map<string, boolean>>(new Map());
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialUsers();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading]);

  const loadInitialUsers = async () => {
    setLoading(true);
    setPage(1);
    
    const result = await getAllUsers({ page: 1, limit: 20 });
    setUsers(result.data);
    setHasMore(result.hasMore);
    
    // Load follow states
    await loadFollowStates(result.data);
    
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    const result = await getAllUsers({ page: nextPage, limit: 20 });
    setUsers(prev => [...prev, ...result.data]);
    setHasMore(result.hasMore);
    setPage(nextPage);
    
    await loadFollowStates(result.data);
    
    setLoadingMore(false);
  }, [page, hasMore, loadingMore]);

  const loadFollowStates = async (usersToCheck: any[]) => {
    const states = new Map(followStates);
    for (const user of usersToCheck) {
      if (user.id !== currentUser?.id && !states.has(user.id)) {
        const isFollowing = await checkIsFollowing(user.id);
        states.set(user.id, isFollowing);
      }
    }
    setFollowStates(states);
  };

  const handleFollowToggle = async (userId: string) => {
    const isFollowing = followStates.get(userId) || false;

    // Optimistic update
    setFollowStates(prev => new Map(prev).set(userId, !isFollowing));
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, followers_count: isFollowing ? Math.max(0, u.followers_count - 1) : u.followers_count + 1 }
        : u
    ));

    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  const filteredUsers = searchQuery.trim()
    ? users.filter(u => 
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-14 bg-white z-10 border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discover People</h1>
              <p className="text-sm text-gray-600">Find and connect with content creators</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, email, or bio..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 px-4">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
          <p className="text-sm text-gray-600">
            Try a different search query
          </p>
        </div>
      ) : (
        <div>
          {filteredUsers.map((user) => {
            const isFollowing = followStates.get(user.id) || false;
            const isOwnProfile = user.id === currentUser?.id;

            return (
              <div key={user.id} className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <Link to={`/profile/${user.id}`} className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-gray-500" />
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${user.id}`} className="group">
                          <h3 className="text-base font-bold text-gray-900 group-hover:underline">
                            {user.username || 'Unknown'}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                        {user.bio && (
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">{user.bio}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{user.posts_count || 0} posts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{user.followers_count || 0} followers</span>
                          </div>
                        </div>
                      </div>

                      {!isOwnProfile && (
                        <button
                          onClick={() => handleFollowToggle(user.id)}
                          className={`px-5 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
                            isFollowing
                              ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                              : 'bg-primary text-white hover:bg-red-600'
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div ref={observerTarget} className="py-8 flex justify-center">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
            </div>
          )}

          {!hasMore && filteredUsers.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">You've reached the end</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
