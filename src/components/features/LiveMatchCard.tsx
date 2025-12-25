import { Match } from '../../types';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useHistory } from '../../hooks/useHistory';

interface LiveMatchCardProps {
  match: Match;
}

const LiveMatchCard = ({ match }: LiveMatchCardProps) => {
  const isLive = match.status === 'live';
  const hasScore = match.homeTeam.score !== undefined;
  const { addToHistory } = useHistory();
  
  const handleClick = () => {
    addToHistory({
      id: match.id,
      type: 'match',
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      subtitle: `${match.league} • ${match.sport}`,
      link: `/match/${match.id}`,
    });
  };
  
  return (
    <Link 
      to={`/match/${match.id}`} 
      onClick={handleClick}
      className="block"
    >
      <div className={`match-row ${isLive ? 'match-row-live' : ''} px-4 py-3`}>
        <div className="flex items-center gap-4">
          {/* Time/Status */}
          <div className="w-14 flex-shrink-0">
            {isLive ? (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse"></div>
                <span className="text-xs font-bold text-live">{match.time}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">{match.time}</span>
            )}
          </div>

          {/* Teams and Scores */}
          <div className="flex-1 min-w-0">
            {/* Home Team */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground truncate flex-1 mr-3">
                {match.homeTeam.name}
              </span>
              {hasScore && (
                <span className="text-base font-bold text-foreground tabular-nums w-8 text-right">
                  {match.homeTeam.score}
                </span>
              )}
            </div>
            
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate flex-1 mr-3">
                {match.awayTeam.name}
              </span>
              {hasScore && (
                <span className="text-base font-bold text-foreground tabular-nums w-8 text-right">
                  {match.awayTeam.score}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
};

export default LiveMatchCard;
