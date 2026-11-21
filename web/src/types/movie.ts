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
  genres: string[];
  director: string;
  cast: string[];
  description: string;
}

export type SwipeDirection = 'right' | 'left' | 'down' | 'up';
export type SwipeAction = 'watched' | 'watchlist' | 'pass' | 'superlike';

export interface SwipeHistoryItem {
  movie: Movie;
  action: SwipeAction;
  timestamp: number;
}

export interface RecommendationItem {
  movie: Movie;
  matchScore: number; // 0 to 100
  reasons: string[];
  matchedDirectors?: string[];
  matchedGenres?: string[];
}

export interface TasteProfile {
  topGenres: { genre: string; count: number; percentage: number }[];
  favoriteDirectors: { director: string; count: number }[];
  favoriteDecade: string;
  averageRuntime: number;
  totalWatched: number;
  genreAffinities: Record<string, number>;
}
