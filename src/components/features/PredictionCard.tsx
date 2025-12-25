import { BettingPrediction } from '../../types';
import { TrendingUp, Target, DollarSign } from 'lucide-react';

interface PredictionCardProps {
  prediction: BettingPrediction;
}

const PredictionCard = ({ prediction }: PredictionCardProps) => {
  const confidenceColors = {
    high: 'bg-success/10 text-success border-success/30',
    medium: 'bg-warning/10 text-warning border-warning/30',
    low: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="match-card">
      {/* Match Info */}
      <div className="mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {prediction.match.league}
        </span>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <img
              src={prediction.match.homeTeam.logo}
              alt={prediction.match.homeTeam.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm font-medium">{prediction.match.homeTeam.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={prediction.match.awayTeam.logo}
              alt={prediction.match.awayTeam.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm font-medium">{prediction.match.awayTeam.name}</span>
          </div>
        </div>
      </div>

      {/* Prediction */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground text-lg">{prediction.prediction}</span>
        </div>

        {/* Confidence and Odds */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${confidenceColors[prediction.confidence]}`}>
            <Target className="w-3 h-3" />
            <span className="uppercase">{prediction.confidence} Confidence</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
            <DollarSign className="w-3 h-3" />
            <span>{prediction.odds}</span>
          </div>
        </div>

        {/* Analysis */}
        <p className="text-sm text-muted-foreground">{prediction.analysis}</p>
      </div>
    </div>
  );
};

export default PredictionCard;
