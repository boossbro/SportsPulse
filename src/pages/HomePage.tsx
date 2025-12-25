import { useState, useEffect } from 'react';
import LiveMatchCard from '../components/features/LiveMatchCard';
import { Match } from '../constants/mockData';
import { fetchMatches, syncSportsData } from '../lib/api';
import { RefreshCw, Loader2 } from 'lucide-react';

type SportFilter = 'all' | 'Football' | 'Basketball' | 'Tennis' | 'Baseball';

const HomePage = () => {
  const [sport, setSport] = useState<SportFilter>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const sports: SportFilter[] = ['all', 'Football', 'Basketball', 'Tennis', 'Baseball'];

  const loadMatches = async () => {
    setLoading(true);
    const data = await fetchMatches();
    setMatches(data);
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncSportsData();
    if (result.success) {
      setLastSync(new Date());
      await loadMatches();
    } else {
      console.error('Sync failed:', result.error);
      alert('Failed to sync sports data: ' + result.error);
    }
    setSyncing(false);
  };

  useEffect(() => {
    // Initial load and sync
    const initializeData = async () => {
      await loadMatches();
      await handleSync();
    };
    
    initializeData();
    
    // Auto-refresh every 60 seconds for live scores
    const interval = setInterval(() => {
      loadMatches();
    }, 60000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFilteredMatches = (): { live: Match[], upcoming: Match[], finished: Match[] } => {
    const filterBySport = (matchList: Match[]) => 
      sport === 'all' ? matchList : matchList.filter(m => m.sport === sport);
    
    const live = filterBySport(matches.filter(m => m.status === 'live'));
    const upcoming = filterBySport(matches.filter(m => m.status === 'upcoming'));
    const finished = filterBySport(matches.filter(m => m.status === 'finished'));
    
    return { live, upcoming, finished };
  };

  const { live, upcoming, finished } = getFilteredMatches();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Sport Tabs */}
      <div className="bg-card border-b border-border sticky top-14 z-40">
        <div className="flex items-center justify-between">
          <div className="flex overflow-x-auto flex-1">
            {sports.map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  sport === s
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'all' ? 'All Sports' : s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4">
            {lastSync && (
              <span className="text-xs text-muted-foreground">
                {lastSync.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              title="Sync live scores"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
        {/* Live Matches */}
        {live.length > 0 && (
          <div className="mb-6">
            <div className="px-4 py-3 bg-secondary border-b border-border">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Live Now ({live.length})
              </h2>
            </div>
            {live.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Upcoming Matches */}
        {upcoming.length > 0 && (
          <div className="mb-6">
            <div className="px-4 py-3 bg-secondary border-b border-border">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Upcoming ({upcoming.length})
              </h2>
            </div>
            {upcoming.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Finished Matches */}
        {finished.length > 0 && (
          <div className="mb-6">
            <div className="px-4 py-3 bg-secondary border-b border-border">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Finished ({finished.length})
              </h2>
            </div>
            {finished.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {live.length === 0 && upcoming.length === 0 && finished.length === 0 && (
          <div className="text-center py-16 px-4">
            <p className="text-muted-foreground mb-4">No matches available</p>
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Sync Live Scores
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
