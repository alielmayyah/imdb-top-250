"use client";

import React, { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Star,
  Clock,
  Check,
  Bookmark,
  ThumbsDown,
  Info,
  Flame,
  Search,
  Filter,
  Dices,
  Clapperboard,
  Users,
  Compass,
  TrendingUp,
  X,
  ExternalLink
} from "lucide-react";
import { useMovies } from "../context/MovieContext";
import { calculateRecommendations } from "../lib/recommendation";
import { Movie, RecommendationItem } from "../types/movie";
import { sounds } from "../lib/sounds";

export const RecommendationsView: React.FC = () => {
  const {
    deck,
    watchlist,
    watched,
    passed,
    superLikedRanks,
    tasteProfile,
    moveMovie,
    setSelectedMovie,
    setActiveTab,
  } = useMovies();

  const [searchQuery, setSearchQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"match" | "rating" | "year">("match");
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [roulettePick, setRoulettePick] = useState<RecommendationItem | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Compute recommendations
  const allRecommendations = useMemo(() => {
    return calculateRecommendations(deck, watchlist, watched, passed, superLikedRanks);
  }, [deck, watchlist, watched, passed, superLikedRanks]);

  // Filter recommendations by mood, search, and sort
  const filteredRecommendations = useMemo(() => {
    return allRecommendations
      .filter(({ movie }) => {
        // Search filter
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          movie.title.toLowerCase().includes(query) ||
          movie.year.toString().includes(query) ||
          (movie.director && movie.director.toLowerCase().includes(query)) ||
          (movie.genres && movie.genres.some((g) => g.toLowerCase().includes(query)));

        if (!matchesSearch) return false;

        // Mood filter
        if (moodFilter === "mind-bending") {
          return movie.genres.some((g) => ["Sci-Fi", "Mystery", "Thriller"].includes(g));
        }
        if (moodFilter === "action") {
          return movie.genres.some((g) => ["Action", "Adventure", "Crime"].includes(g));
        }
        if (moodFilter === "drama") {
          return movie.genres.some((g) => ["Drama", "Biography", "History"].includes(g));
        }
        if (moodFilter === "quick") {
          return movie.duration_minutes <= 120;
        }
        if (moodFilter === "epic") {
          return movie.duration_minutes >= 150;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "match") return b.matchScore - a.matchScore;
        if (sortBy === "rating") return b.movie.rating - a.movie.rating;
        if (sortBy === "year") return b.movie.year - a.movie.year;
        return 0;
      });
  }, [allRecommendations, searchQuery, moodFilter, sortBy]);

  // Roulette picker
  const startRoulette = () => {
    if (filteredRecommendations.length === 0) return;
    setIsRouletteOpen(true);
    setIsSpinning(true);
    sounds.playSuperLike();

    let count = 0;
    const maxSteps = 15;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * Math.min(12, filteredRecommendations.length));
      setRoulettePick(filteredRecommendations[randomIdx]);
      count++;
      if (count >= maxSteps) {
        clearInterval(interval);
        setIsSpinning(false);
        // Best pick: top recommendation
        const finalPick = filteredRecommendations[0];
        setRoulettePick(finalPick);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f5c518", "#a855f7", "#38bdf8"],
        });
      }
    }, 100);
  };

  const totalSwiped = watched.length + watchlist.length + passed.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Page Title & Roulette Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">AI Recommendations</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Real-time movie matches powered by your genre affinities, favorite directors, and viewing rhythm.
          </p>
        </div>

        {/* Pick for me tonight button */}
        <button
          onClick={startRoulette}
          disabled={filteredRecommendations.length === 0}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#f5c518] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-40"
        >
          <Dices className="w-5 h-5 text-yellow-300" />
          <span>Pick for Me Tonight!</span>
        </button>
      </div>

      {/* Your Movie Taste Profile Card */}
      {tasteProfile.totalWatched > 0 && (
        <div className="bg-[#14161b] border border-[#27272a] rounded-3xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242731] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Your Movie Taste DNA</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Based on {tasteProfile.totalWatched} Watched Film{tasteProfile.totalWatched > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Genres */}
            <div>
              <div className="text-xs uppercase font-extrabold text-gray-400 tracking-wider mb-2.5">
                Top Genres
              </div>
              <div className="space-y-2">
                {tasteProfile.topGenres.map((g) => (
                  <div key={g.genre} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-200">{g.genre}</span>
                      <span className="text-purple-300">{g.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#242731] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                        style={{ width: `${g.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Directors */}
            <div>
              <div className="text-xs uppercase font-extrabold text-gray-400 tracking-wider mb-2.5">
                Favorite Directors
              </div>
              {tasteProfile.favoriteDirectors.length > 0 ? (
                <div className="space-y-2">
                  {tasteProfile.favoriteDirectors.map((d) => (
                    <div
                      key={d.director}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-[#242731] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Clapperboard className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-gray-200 font-semibold">{d.director}</span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded">
                        {d.count} film{d.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic py-4">
                  Keep swiping to discover your favorite filmmakers.
                </div>
              )}
            </div>

            {/* Era & Runtime Vibe */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase font-extrabold text-gray-400 tracking-wider mb-2.5">
                  Cinema Profile
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-[#242731] flex items-center justify-between">
                    <span className="text-gray-400">Preferred Era:</span>
                    <span className="text-white font-bold">{tasteProfile.favoriteDecade}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-[#242731] flex items-center justify-between">
                    <span className="text-gray-400">Sweet-Spot Runtime:</span>
                    <span className="text-white font-bold">~{tasteProfile.averageRuntime} mins</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-[#242731] flex items-center justify-between">
                    <span className="text-gray-400">Super Liked Classics:</span>
                    <span className="text-cyan-400 font-bold">{superLikedRanks.size} films</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood For Tonight & Search Filter Bar */}
      <div className="bg-[#14161b] border border-[#27272a] rounded-2xl p-4 mb-6 space-y-4">
        {/* Mood Chips */}
        <div>
          <div className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#f5c518]" />
            <span>Mood for Tonight:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "✨ All Recommendations" },
              { id: "mind-bending", label: "🧠 Mind-Bending" },
              { id: "action", label: "💥 High Adrenaline" },
              { id: "drama", label: "🎭 Deep Drama & Bio" },
              { id: "quick", label: "⚡ Under 2 Hours" },
              { id: "epic", label: "👑 Epic (>2.5h)" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMoodFilter(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  moodFilter === m.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-black/30 text-gray-400 hover:text-white border border-[#27272a]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#242731]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, director, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-black/40 border border-[#27272a] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-black/40 border border-[#27272a] rounded-xl p-1">
            <span className="text-gray-500 px-2 font-semibold text-[11px]">Sort:</span>
            <button
              onClick={() => setSortBy("match")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                sortBy === "match" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Match %
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                sortBy === "rating" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Rating
            </button>
            <button
              onClick={() => setSortBy("year")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                sortBy === "year" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Encouragement Banner */}
      {totalSwiped < 5 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-black/40 border border-purple-500/30 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <div className="text-sm font-bold text-white">
                Swiped {totalSwiped} / 250 films so far!
              </div>
              <div className="text-xs text-gray-400">
                Swipe more movies in the Discover Deck to sharpen your AI taste model.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("swipe")}
            className="px-4 py-2 rounded-xl bg-[#f5c518] hover:bg-[#ffcf33] text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Keep Swiping</span>
          </button>
        </div>
      )}

      {/* Grid of Recommended Movies */}
      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-16 bg-[#14161b] rounded-2xl border border-[#27272a] p-8">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Recommendations in this Mood</h3>
          <p className="text-sm text-gray-400">
            Try switching mood filters or search terms!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecommendations.map(({ movie, matchScore, reasons }) => {
            const inWatchlist = watchlist.some((m) => m.rank === movie.rank);
            const posterSrc = movie.local_poster_path
              ? `/${movie.local_poster_path}`
              : movie.poster_url || "";

            return (
              <div
                key={movie.rank}
                className="bg-[#14161b] border border-[#27272a] hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between group shadow-xl"
              >
                <div>
                  {/* Top Poster Banner */}
                  <div
                    className="relative h-52 overflow-hidden bg-black/40 cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    {posterSrc ? (
                      <img
                        src={posterSrc}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-gray-500">
                        No Poster
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14161b] via-[#14161b]/50 to-transparent" />

                    {/* Match Score Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-purple-600/90 backdrop-blur-md text-white border border-purple-400/40 flex items-center gap-1 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      <span>{matchScore}% Match</span>
                    </div>

                    {/* Rank Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded text-xs font-black bg-black/70 backdrop-blur-md border border-[#f5c518]/50 text-[#f5c518]">
                      #{movie.rank}
                    </div>

                    {inWatchlist && (
                      <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/80 backdrop-blur-md text-white flex items-center gap-1">
                        <Bookmark className="w-3 h-3" /> In Watchlist
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <h3
                      className="text-lg font-bold text-white leading-tight line-clamp-1 hover:text-[#f5c518] cursor-pointer mb-1"
                      onClick={() => setSelectedMovie(movie)}
                    >
                      {movie.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                      <div className="flex items-center gap-1 text-[#f5c518] font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{movie.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{movie.year}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{movie.duration}</span>
                      </div>
                    </div>

                    {/* Director & Cast */}
                    <div className="text-xs space-y-1 mb-3">
                      {movie.director && movie.director !== "Unknown" && (
                        <div className="flex items-center gap-1 text-purple-300 font-semibold truncate">
                          <Clapperboard className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>{movie.director}</span>
                        </div>
                      )}
                      {movie.genres && (
                        <div className="flex flex-wrap gap-1">
                          {movie.genres.map((g) => (
                            <span
                              key={g}
                              className="px-2 py-0.2 rounded text-[10px] font-semibold bg-black/50 text-gray-300 border border-white/5"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reasons Tags */}
                    <div className="space-y-1 mb-2">
                      {reasons.map((r, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-950/40 border border-purple-800/30 text-purple-200 flex items-center gap-1.5"
                        >
                          <TrendingUp className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 pt-0 grid grid-cols-4 gap-1.5 border-t border-[#27272a] mt-2">
                  <button
                    onClick={() => moveMovie(movie, "watched")}
                    className="py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold"
                    title="Mark as Watched"
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveMovie(movie, "watchlist")}
                    className="py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold"
                    title="Add to Watchlist"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveMovie(movie, "pass")}
                    className="py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold"
                    title="Not Interested"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedMovie(movie)}
                    className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition-colors flex items-center justify-center text-xs font-bold"
                    title="View Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Roulette Modal */}
      {isRouletteOpen && roulettePick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#14161b] border-2 border-purple-500/50 rounded-3xl overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsRouletteOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSpinning ? "Finding Your Movie Match..." : "Tonight's Ultimate Pick!"}</span>
            </div>

            <div className="w-40 h-60 mx-auto rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-xl mb-4 bg-black">
              {roulettePick.movie.local_poster_path ? (
                <img
                  src={`/${roulettePick.movie.local_poster_path}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            <h3 className="text-2xl font-black text-white leading-tight mb-1">
              {roulettePick.movie.title}
            </h3>
            <div className="text-xs text-purple-300 font-bold mb-3">
              {roulettePick.matchScore}% Personalized Match • {roulettePick.movie.year} • {roulettePick.movie.duration}
            </div>

            <p className="text-xs text-gray-400 italic max-w-md mx-auto mb-6 line-clamp-2">
              "{roulettePick.movie.description || roulettePick.reasons.join(" • ")}"
            </p>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={roulettePick.movie.imdb_url}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl bg-[#f5c518] hover:bg-[#ffcf33] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View on IMDb</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  moveMovie(roulettePick.movie, "watched");
                  setIsRouletteOpen(false);
                }}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Mark as Watched</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
