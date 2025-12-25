import { Match, NewsArticle, BettingPrediction } from '../types';

export type { Match, NewsArticle, BettingPrediction };

export const LIVE_MATCHES: Match[] = [
  {
    id: '1',
    sport: 'Football',
    league: 'Premier League',
    homeTeam: {
      id: 't1',
      name: 'Manchester United',
      logo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=100&h=100&fit=crop',
      score: 2,
    },
    awayTeam: {
      id: 't2',
      name: 'Liverpool',
      logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&h=100&fit=crop',
      score: 1,
    },
    status: 'live',
    time: '67\'',
    minute: '67\'',
  },
  {
    id: '2',
    sport: 'Basketball',
    league: 'NBA',
    homeTeam: {
      id: 't3',
      name: 'LA Lakers',
      logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
      score: 98,
    },
    awayTeam: {
      id: 't4',
      name: 'Boston Celtics',
      logo: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=100&h=100&fit=crop',
      score: 102,
    },
    status: 'live',
    time: 'Q3 8:45',
    minute: 'Q3',
  },
  {
    id: '3',
    sport: 'Football',
    league: 'La Liga',
    homeTeam: {
      id: 't5',
      name: 'Real Madrid',
      logo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=100&h=100&fit=crop',
      score: 3,
    },
    awayTeam: {
      id: 't6',
      name: 'Barcelona',
      logo: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=100&h=100&fit=crop',
      score: 3,
    },
    status: 'live',
    time: '82\'',
    minute: '82\'',
  },
];

export const UPCOMING_MATCHES: Match[] = [
  {
    id: '4',
    sport: 'Tennis',
    league: 'ATP Tour',
    homeTeam: {
      id: 't7',
      name: 'Novak Djokovic',
      logo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=100&h=100&fit=crop',
    },
    awayTeam: {
      id: 't8',
      name: 'Carlos Alcaraz',
      logo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=100&h=100&fit=crop',
    },
    status: 'upcoming',
    time: '14:00',
  },
  {
    id: '5',
    sport: 'Football',
    league: 'Champions League',
    homeTeam: {
      id: 't9',
      name: 'Bayern Munich',
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop',
    },
    awayTeam: {
      id: 't10',
      name: 'PSG',
      logo: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=100&h=100&fit=crop',
    },
    status: 'upcoming',
    time: '20:00',
  },
];

export const FINISHED_MATCHES: Match[] = [
  {
    id: '6',
    sport: 'Basketball',
    league: 'NBA',
    homeTeam: {
      id: 't11',
      name: 'Golden State',
      logo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop',
      score: 115,
    },
    awayTeam: {
      id: 't12',
      name: 'Miami Heat',
      logo: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop',
      score: 108,
    },
    status: 'finished',
    time: 'FT',
  },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'n1',
    title: 'Manchester United Secures Dramatic Victory in Derby Clash',
    excerpt: 'Late goal seals three points in thrilling encounter at Old Trafford',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop',
    category: 'Football',
    publishedAt: '2 hours ago',
    readTime: '3 min read',
  },
  {
    id: 'n2',
    title: 'Lakers Star Returns from Injury: Team Eyes Playoff Push',
    excerpt: 'Key player back in action as championship hopes reignite',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=500&fit=crop',
    category: 'Basketball',
    publishedAt: '4 hours ago',
    readTime: '4 min read',
  },
  {
    id: 'n3',
    title: 'Tennis Legend Announces Retirement Plans After Final Season',
    excerpt: 'Emotional farewell tour set to begin next month',
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=500&fit=crop',
    category: 'Tennis',
    publishedAt: '6 hours ago',
    readTime: '5 min read',
  },
  {
    id: 'n4',
    title: 'Real Madrid vs Barcelona: El Clasico Ends in Stunning Draw',
    excerpt: 'Six-goal thriller keeps title race wide open',
    image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop',
    category: 'Football',
    publishedAt: '8 hours ago',
    readTime: '4 min read',
  },
];

export const BETTING_PREDICTIONS: BettingPrediction[] = [
  {
    id: 'b1',
    matchId: '4',
    match: UPCOMING_MATCHES[0],
    prediction: 'Djokovic to Win',
    confidence: 'high',
    odds: '1.85',
    analysis: 'Strong recent form and head-to-head record favor Djokovic on hard court',
  },
  {
    id: 'b2',
    matchId: '5',
    match: UPCOMING_MATCHES[1],
    prediction: 'Over 2.5 Goals',
    confidence: 'medium',
    odds: '1.70',
    analysis: 'Both teams have attacking strengths and defensive vulnerabilities',
  },
  {
    id: 'b3',
    matchId: '1',
    match: LIVE_MATCHES[0],
    prediction: 'Manchester United to Win',
    confidence: 'high',
    odds: '2.10',
    analysis: 'Home advantage and current score line suggest strong winning position',
  },
];
