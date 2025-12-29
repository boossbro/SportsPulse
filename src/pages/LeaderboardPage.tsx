import { useState, useEffect } from 'react';
import { getWriterRankings } from '../lib/api';
import { Loader2, Trophy, TrendingUp, Eye, Heart, MessageCircle, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeaderboardPage = () => {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setLoading(true);
    const data = await getWriterRankings(50);
    setRankings(data);
    setLoading(false);
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-red-600 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Top Writers</h1>
        </div>
        <p className="text-white/90">Recognizing the best content creators in our community</p>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No rankings yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {rankings.map((writer, index) => (
            <Link
              key={writer.id}
              to={`/profile/${writer.user_id}`}
              className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <div className={`text-2xl font-bold ${getMedalColor(writer.rank)} w-12 text-center`}>
                {writer.rank <= 3 ? (
                  <Trophy className="w-8 h-8 mx-auto" />
                ) : (
                  `#${writer.rank}`
                )}
              </div>

              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {writer.user_profiles?.avatar_url ? (
                  <img
                    src={writer.user_profiles.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-gray-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1">
                  {writer.user_profiles?.username || 'Unknown'}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{Math.round(writer.score)} pts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{writer.total_views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{writer.posts_count} posts</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {Math.round(writer.score)}
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
