import { Movie, RecommendationItem, TasteProfile } from '../types/movie';

export function getTasteProfile(watchedMovies: Movie[], superLikedRanks: Set<number> = new Set()): TasteProfile {
  if (watchedMovies.length === 0) {
    return {
      topGenres: [],
      favoriteDirectors: [],
      favoriteDecade: "None",
      averageRuntime: 0,
      totalWatched: 0,
      genreAffinities: {}
    };
  }

  // 1. Genres breakdown
  const genreWeights: Record<string, number> = {};
  let totalGenreHits = 0;

  for (const m of watchedMovies) {
    const multiplier = superLikedRanks.has(m.rank) ? 3 : 1;
    for (const g of (m.genres || [])) {
      genreWeights[g] = (genreWeights[g] || 0) + multiplier;
      totalGenreHits += multiplier;
    }
  }

  const topGenres = Object.entries(genreWeights)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: totalGenreHits > 0 ? Math.round((count / totalGenreHits) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 2. Favorite Directors
  const directorCounts: Record<string, number> = {};
  for (const m of watchedMovies) {
    if (m.director && m.director !== "Unknown") {
      const multiplier = superLikedRanks.has(m.rank) ? 2 : 1;
      directorCounts[m.director] = (directorCounts[m.director] || 0) + multiplier;
    }
  }

  const favoriteDirectors = Object.entries(directorCounts)
    .map(([director, count]) => ({ director, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 3. Favorite Decade
  const decadeCounts: Record<number, number> = {};
  for (const m of watchedMovies) {
    const dec = Math.floor(m.year / 10) * 10;
    decadeCounts[dec] = (decadeCounts[dec] || 0) + 1;
  }
  let favDecade = 0;
  let maxDec = 0;
  for (const [dec, count] of Object.entries(decadeCounts)) {
    if (count > maxDec) {
      maxDec = count;
      favDecade = Number(dec);
    }
  }

  // 4. Average Runtime
  const totalMins = watchedMovies.reduce((a, b) => a + b.duration_minutes, 0);
  const averageRuntime = Math.round(totalMins / watchedMovies.length);

  return {
    topGenres,
    favoriteDirectors,
    favoriteDecade: favDecade > 0 ? `${favDecade}s` : "None",
    averageRuntime,
    totalWatched: watchedMovies.length,
    genreAffinities: genreWeights
  };
}

export function calculateRecommendations(
  unswipedMovies: Movie[],
  watchlistMovies: Movie[],
  watchedMovies: Movie[],
  passedMovies: Movie[],
  superLikedRanks: Set<number> = new Set()
): RecommendationItem[] {
  const candidates = [...watchlistMovies, ...unswipedMovies];
  if (candidates.length === 0) return [];

  // Cold start baseline
  if (watchedMovies.length === 0) {
    return candidates.map(movie => {
      const ratingScore = (movie.rating / 10) * 80;
      const voteScore = Math.min(20, (movie.votes_count / 3300000) * 20);
      const matchScore = Math.round(ratingScore + voteScore);
      return {
        movie,
        matchScore: Math.min(99, Math.max(70, matchScore)),
        reasons: ['IMDb Top 250 Masterpiece', 'Global Universal Acclaim']
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  const profile = getTasteProfile(watchedMovies, superLikedRanks);

  // Map of passed genres to penalize
  const passedGenres: Record<string, number> = {};
  for (const m of passedMovies) {
    for (const g of (m.genres || [])) {
      passedGenres[g] = (passedGenres[g] || 0) + 1;
    }
  }

  // Watched Directors map
  const watchedDirectors: Record<string, number> = {};
  for (const d of profile.favoriteDirectors) {
    watchedDirectors[d.director] = d.count;
  }

  // Watched Actors map
  const watchedActors: Record<string, number> = {};
  for (const m of watchedMovies) {
    for (const actor of (m.cast || [])) {
      watchedActors[actor] = (watchedActors[actor] || 0) + 1;
    }
  }

  return candidates.map(movie => {
    let score = 50; // base score
    const reasons: string[] = [];
    const matchedDirectors: string[] = [];
    const matchedGenres: string[] = [];

    // 1. Director Match (+24 pts)
    if (movie.director && watchedDirectors[movie.director]) {
      const count = watchedDirectors[movie.director];
      score += 24;
      matchedDirectors.push(movie.director);
      reasons.push(`Directed by ${movie.director} (You watched ${count} film${count > 1 ? 's' : ''})`);
    }

    // 2. Genre Affinity (+28 pts max)
    let genreScore = 0;
    const movieGenres = movie.genres || [];
    for (const g of movieGenres) {
      if (profile.genreAffinities[g]) {
        genreScore += Math.min(14, (profile.genreAffinities[g] / profile.totalWatched) * 20);
        matchedGenres.push(g);
      }
      if (passedGenres[g] && passedGenres[g] >= 3 && !profile.genreAffinities[g]) {
        score -= 6;
      }
    }
    score += Math.min(28, genreScore);

    if (matchedGenres.length >= 2) {
      reasons.push(`Matches your passion for ${matchedGenres.slice(0, 2).join(' & ')}`);
    } else if (matchedGenres.length === 1) {
      reasons.push(`${matchedGenres[0]} masterpiece`);
    }

    // 3. Cast / Leading Actor match (+12 pts)
    for (const actor of (movie.cast || [])) {
      if (watchedActors[actor] && watchedActors[actor] >= 2) {
        score += 12;
        reasons.push(`Stars ${actor} (Seen in ${watchedActors[actor]} of your favorites)`);
        break;
      }
    }

    // 4. Decade match (+14 pts)
    const movieDecade = `${Math.floor(movie.year / 10) * 10}s`;
    if (movieDecade === profile.favoriteDecade && profile.totalWatched >= 3) {
      score += 14;
      reasons.push(`Classic ${movieDecade} cinema`);
    }

    // 5. Runtime sweet spot (+10 pts)
    const runtimeDiff = Math.abs(movie.duration_minutes - profile.averageRuntime);
    if (runtimeDiff <= 25) {
      score += 10;
      reasons.push(`Matches your average runtime (~${profile.averageRuntime}m)`);
    }

    // 6. Watchlist Prioritization (+12 pts)
    if (watchlistMovies.some(w => w.rank === movie.rank)) {
      score += 12;
      reasons.push('Saved in your Watchlist');
    }

    // 7. Critical Rating Bonus
    score += (movie.rating - 8.0) * 15;

    // Default fallback reason
    if (reasons.length === 0) {
      reasons.push('High IMDb Critical Acclaim');
    }

    const finalScore = Math.min(99, Math.max(68, Math.round(score)));

    return {
      movie,
      matchScore: finalScore,
      reasons: reasons.slice(0, 3),
      matchedDirectors,
      matchedGenres
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
