import PredictionCard from '../components/features/PredictionCard';
import { BETTING_PREDICTIONS } from '../constants/mockData';
import { TrendingUp, Info } from 'lucide-react';

const BettingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Betting Predictions</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Quick predictions and analysis for upcoming matches
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground font-medium mb-1">
            For Entertainment Purposes Only
          </p>
          <p className="text-xs text-muted-foreground">
            These predictions are based on statistical analysis and are not guaranteed. 
            Please bet responsibly and within your means.
          </p>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BETTING_PREDICTIONS.map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} />
        ))}
      </div>
    </div>
  );
};

export default BettingPage;
