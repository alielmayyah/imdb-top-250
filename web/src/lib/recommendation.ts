import { Movie, RecommendationItem } from '../types/movie';

export function calculateRecommendations(
  unswipedMovies: Movie[],
  watchlistMovies: Movie[],
  watchedMovies: Movie[],
  passedMovies: Movie[]
): RecommendationItem[] {
  // Pool of candidate movies to recommend: Watchlist + Unswiped
  const candidates = [...watchlistMovies, ...unswipedMovies];
  if (candidates.length === 0) return [];

  // If user hasn't watched anything yet, base score on IMDb rating and votes consensus
  if (watchedMovies.length === 0) {
    return candidates.map(movie => {
      const ratingScore = (movie.rating / 10) * 80;
      const voteScore = Math.min(20, (movie.votes_count / 3300000) * 20);
      const matchScore = Math.round(ratingScore + voteScore);
      return {
        movie,
        matchScore: Math.min(99, Math.max(70, matchScore)),
        reasons: ['IMDb Top 250 Hallmark', 'High Global Consensus']
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  // 1. Decade analysis of watched movies
  const watchedDecades: Record<number, number> = {};
  const passedDecades: Record<number, number> = {};
  for (const m of watchedMovies) {
    const decade = Math.floor(m.year / 10) * 10;
    watchedDecades[decade] = (watchedDecades[decade] || 0) + 1;
  }
  for (const m of passedMovies) {
    const decade = Math.floor(m.year / 10) * 10;
    passedDecades[decade] = (passedDecades[decade] || 0) + 1;
  }

  // 2. Average runtime of watched movies
  const avgWatchedRuntime =
    watchedMovies.reduce((acc, m) => acc + m.duration_minutes, 0) / watchedMovies.length;

  // 3. Certificate preferences
  const watchedCerts: Record<string, number> = {};
  for (const m of watchedMovies) {
    watchedCerts[m.certificate] = (watchedCerts[m.certificate] || 0) + 1;
  }

  // Favorite decade
  let favDecade = 0;
  let maxDecadeCount = 0;
  for (const [dec, count] of Object.entries(watchedDecades)) {
    if (count > maxDecadeCount) {
      maxDecadeCount = count;
      favDecade = Number(dec);
    }
  }

  return candidates.map(movie => {
    let score = 50; // base score
    const reasons: string[] = [];

    // Rating contribution (up to +20)
    score += (movie.rating - 8.0) * 15;

    // Decade affinity
    const movieDecade = Math.floor(movie.year / 10) * 10;
    if (watchedDecades[movieDecade]) {
      const decadeBoost = Math.min(18, (watchedDecades[movieDecade] / watchedMovies.length) * 25);
      score += decadeBoost;
      if (movieDecade === favDecade && maxDecadeCount >= 2) {
        reasons.push(`You enjoy ${movieDecade}s cinema`);
      }
    }
    if (passedDecades[movieDecade] && passedDecades[movieDecade] > 3) {
      score -= 6;
    }

    // Runtime sweet spot (+12 max)
    const runtimeDiff = Math.abs(movie.duration_minutes - avgWatchedRuntime);
    if (runtimeDiff <= 20) {
      score += 12;
      reasons.push(`Matches your typical runtime (~${Math.round(avgWatchedRuntime)}m)`);
    } else if (runtimeDiff <= 45) {
      score += 6;
    }

    // Certificate match (+10 max)
    if (watchedCerts[movie.certificate]) {
      const certBoost = Math.min(10, (watchedCerts[movie.certificate] / watchedMovies.length) * 15);
      score += certBoost;
      if (certBoost > 5) {
        reasons.push(`Prefers ${movie.certificate} rated films`);
      }
    }

    // Watchlist bonus (user already flagged interest)
    if (watchlistMovies.some(w => w.rank === movie.rank)) {
      score += 10;
      reasons.push('Already in your Watchlist');
    }

    // Global popularity bonus
    if (movie.votes_count >= 1500000) {
      score += 5;
      reasons.push('Universal audience acclaimed');
    }

    if (reasons.length === 0) {
      reasons.push('High IMDb critically acclaimed match');
    }

    const finalScore = Math.min(99, Math.max(65, Math.round(score)));

    return {
      movie,
      matchScore: finalScore,
      reasons: reasons.slice(0, 3)
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
