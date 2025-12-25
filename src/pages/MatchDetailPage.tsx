import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BETTING_PREDICTIONS } from '../constants/mockData';
import { fetchMatchById } from '../lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Match } from '../types';
import { useHistory } from '../hooks/useHistory';

const MatchDetailPage = () => {
  const { id } = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const prediction = BETTING_PREDICTIONS.find((p) => p.matchId === id);
  const { addToHistory } = useHistory();

  useEffect(() => {
    const loadMatch = async () => {
      if (!id) return;
      setLoading(true);
      const data = await fetchMatchById(id);
      setMatch(data);
      setLoading(false);
      
      // Add to history
      if (data) {
        addToHistory({
          id: data.id,
          type: 'match',
          title: `${data.homeTeam.name} vs ${data.awayTeam.name}`,
          subtitle: `${data.league} • ${data.sport}`,
          link: `/match/${data.id}`,
        });
      }
    };
    loadMatch();
  }, [id, addToHistory]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const isLive = match.status === 'live';
  const hasScore = match.homeTeam.score !== undefined;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-card">
        {/* Back Button */}
        <div className="px-4 py-3 border-b border-border">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to matches</span>
          </Link>
        </div>

        {/* Match Info */}
        <div className="px-4 py-4 border-b border-border">
          <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
            {match.league} • {match.sport}
          </div>
          
          {isLive && (
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse"></div>
              <span className="text-xs font-bold text-live">{match.time}</span>
            </div>
          )}

          {/* Teams and Scores */}
          <div className="space-y-4">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-foreground">
                {match.homeTeam.name}
              </span>
              {hasScore && (
                <span className="text-4xl font-bold text-foreground tabular-nums">
                  {match.homeTeam.score}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-foreground">
                {match.awayTeam.name}
              </span>
              {hasScore && (
                <span className="text-4xl font-bold text-foreground tabular-nums">
                  {match.awayTeam.score}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Statistics</h3>
          <div className="space-y-4">
            {[
              { label: 'Possession', home: 58, away: 42 },
              { label: 'Shots', home: 12, away: 8 },
              { label: 'Shots on Target', home: 6, away: 3 },
              { label: 'Corners', home: 5, away: 2 },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{stat.home}</span>
                  <span className="font-medium">{stat.label}</span>
                  <span>{stat.away}</span>
                </div>
                <div className="flex gap-2">
                  <div 
                    className="h-1.5 bg-primary rounded"
                    style={{ width: `${stat.home}%` }}
                  ></div>
                  <div 
                    className="h-1.5 bg-muted rounded"
                    style={{ width: `${stat.away}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prediction */}
        {prediction && (
          <div className="px-4 py-4 border-t border-border bg-secondary/30">
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Betting Tip</h3>
            <div className="bg-card border border-border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">{prediction.prediction}</span>
                <span className="text-sm font-bold text-primary">{prediction.odds}</span>
              </div>
              <p className="text-xs text-muted-foreground">{prediction.analysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetailPage;
