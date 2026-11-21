export interface Movie {
  rank: number;
  title: string;
  imdb_id: string;
  year: number;
  duration: string;
  duration_minutes: number;
  certificate: string;
  rating: number;
  votes_display: string;
  votes_count: number;
  imdb_url: string;
  poster_url: string | null;
  local_poster_path: string | null;
}

export type SwipeDirection = 'right' | 'left' | 'down';
export type SwipeAction = 'watched' | 'watchlist' | 'pass';

export interface SwipeHistoryItem {
  movie: Movie;
  action: SwipeAction;
  timestamp: number;
}

export interface RecommendationItem {
  movie: Movie;
  matchScore: number; // 0 to 100
  reasons: string[];
}
