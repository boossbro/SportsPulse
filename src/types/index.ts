export interface Team {
  id: string;
  name: string;
  logo: string;
  score?: number;
}

export interface Match {
  id: string;
  sport: 'Football' | 'Basketball' | 'Tennis' | 'Baseball';
  league: string;
  homeTeam: Team;
  awayTeam: Team;
  status: 'live' | 'upcoming' | 'finished';
  time: string;
  minute?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  publishedAt: string;
  readTime?: string;
}

export interface BettingPrediction {
  id: string;
  matchId: string;
  match: Match;
  prediction: string;
  confidence: 'high' | 'medium' | 'low';
  odds: string;
  analysis: string;
}
