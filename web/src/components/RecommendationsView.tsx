"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Flame,
  Star,
  Clock,
  Calendar,
  Check,
  Bookmark,
  X,
  Info,
  SlidersHorizontal,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Film,
  Shield,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Movie, SwipeAction, RecommendationItem } from "../types/movie";
import { useMovies } from "../context/MovieContext";
import { calculateRecommendations } from "../lib/recommendation";
import { MovieDetailModal } from "./MovieDetailModal";

export type SortOption = "match" | "rating" | "year-desc" | "year-asc" | "rank";
export type SourceFilter = "all" | "watchlist" | "unswiped";

export interface RecommendationsViewProps {
  onSelectMovie?: (movie: Movie) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  onSelectMovie,
}) => {
  const {
    deck,
    watchlist,
    watched,
    passed,
    history,
    swipe,
    moveMovie,
    setSelectedMovie,
    setActiveTab,
  } = useMovies();

  // Search, filter & sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [minMatch, setMinMatch] = useState<number>(0);

  // Total swipes count
  const swipesCount = history.length;
  const isCalibrating = swipesCount < 3;

  // Base recommendations from algorithm
  const rawRecommendations = useMemo(() => {
    return calculateRecommendations(deck, watchlist, watched, passed);
  }, [deck, watchlist, watched, passed]);

  // Filtered & sorted recommendations
  const filteredRecommendations = useMemo(() => {
    return rawRecommendations
      .filter((item) => {
        // Source filter
        if (sourceFilter === "watchlist") {
          const isWatchlisted = watchlist.some((w) => w.rank === item.movie.rank);
          if (!isWatchlisted) return false;
        } else if (sourceFilter === "unswiped") {
          const isWatchlisted = watchlist.some((w) => w.rank === item.movie.rank);
          if (isWatchlisted) return false;
        }

        // Min match score filter
        if (minMatch > 0 && item.matchScore < minMatch) {
          return false;
        }

        // Search title query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = item.movie.title.toLowerCase().includes(q);
          const matchYear = item.movie.year.toString().includes(q);
          const matchRank = `#${item.movie.rank}`.includes(q);
          if (!matchTitle && !matchYear && !matchRank) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "match") {
          return b.matchScore - a.matchScore;
        }
        if (sortBy === "rating") {
          return b.movie.rating - a.movie.rating;
        }
        if (sortBy === "year-desc") {
          return b.movie.year - a.movie.year;
        }
        if (sortBy === "year-asc") {
          return a.movie.year - b.movie.year;
        }
        if (sortBy === "rank") {
          return a.movie.rank - b.movie.rank;
        }
        return 0;
      });
  }, [rawRecommendations, sourceFilter, minMatch, searchQuery, sortBy, watchlist]);

  // Handle Quick Actions
  const handleQuickAction = (movie: Movie, action: SwipeAction) => {
    const isCurrentlyInDeck = deck.some((m) => m.rank === movie.rank);
    if (isCurrentlyInDeck) {
      swipe(movie, action);
    } else {
      moveMovie(movie, action);
    }
  };

  const handleInspect = (movie: Movie) => {
    if (onSelectMovie) {
      onSelectMovie(movie);
    } else {
      setSelectedMovie(movie);
    }
  };

  const getMatchBadgeStyle = (score: number) => {
    if (score >= 90) {
      return "bg-[#f5c518]/15 text-[#f5c518] border-[#f5c518]/40 shadow-[0_0_12px_rgba(245,197,24,0.2)]";
    }
    if (score >= 80) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (score >= 70) {
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
    return "bg-gray-800/80 text-gray-300 border-gray-700";
  };

  const getReasonIcon = (reason: string) => {
    const lower = reason.toLowerCase();
    if (lower.includes("decade") || lower.includes("cinema") || lower.includes("enjoy")) {
      return <Film className="w-3 h-3 text-amber-400 shrink-0" />;
    }
    if (lower.includes("runtime") || lower.includes("typical") || lower.includes("epic")) {
      return <Clock className="w-3 h-3 text-cyan-400 shrink-0" />;
    }
    if (lower.includes("consensus") || lower.includes("hallmark") || lower.includes("acclaimed")) {
      return <Award className="w-3 h-3 text-yellow-400 shrink-0" />;
    }
    if (lower.includes("watchlist")) {
      return <Bookmark className="w-3 h-3 text-blue-400 shrink-0" />;
    }
    if (lower.includes("cert") || lower.includes("rated")) {
      return <Shield className="w-3 h-3 text-purple-400 shrink-0" />;
    }
    return <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#242731] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#f5c518]/20 border border-[#f5c518]/40 text-[#f5c518]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Recommendations
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Personalized Top 250 predictions weighted by your decade affinities, runtimes, and consensus.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-[#14161b] border border-[#27272a] px-3.5 py-2 rounded-xl">
          <div className="text-gray-400">
            Candidate Pool:{" "}
            <span className="font-bold text-white">{rawRecommendations.length}</span> movies
          </div>
          <span className="text-gray-600">•</span>
          <div className="text-gray-400">
            Watched:{" "}
            <span className="font-bold text-emerald-400">{watched.length}</span>
          </div>
        </div>
      </div>

      {/* Encouraging Prompt for < 3 Swipes */}
      {isCalibrating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c1917] via-[#1a1c23] to-[#131722] border border-[#f5c518]/40 p-5 sm:p-6 shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="p-3 rounded-2xl bg-[#f5c518]/15 border border-[#f5c518]/30 shrink-0 mt-0.5">
                <Flame className="w-6 h-6 text-[#f5c518] animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Sharpening Your AI Taste Profile
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f5c518] text-black">
                    {swipesCount} / 3 Swiped
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  You have classified {swipesCount} {swipesCount === 1 ? "movie" : "movies"} so far.
                  Swipe at least <strong className="text-white">3 cards</strong> in the Tinder deck
                  to unlock high-accuracy decade, runtime, and certificate affinity matching!
                  Meanwhile, we've ranked candidates by global consensus.
                </p>

                {/* Progress Pip Indicator */}
                <div className="flex items-center gap-2 pt-1.5">
                  {[0, 1, 2].map((step) => {
                    const isDone = swipesCount > step;
                    return (
                      <div
                        key={step}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isDone
                            ? "w-8 bg-[#f5c518]"
                            : step === swipesCount
                            ? "w-6 bg-[#f5c518]/40 animate-pulse"
                            : "w-4 bg-gray-700"
                        }`}
                      />
                    );
                  })}
                  <span className="text-[11px] text-gray-400 ml-1">
                    {3 - swipesCount} more needed for calibration
                  </span>
                </div>
              </div>
            </div>

            {/* Jump to Deck CTA */}
            <button
              onClick={() => setActiveTab("swipe")}
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-[#f5c518] hover:bg-[#ffcf33] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shrink-0"
            >
              <span>Swipe More Cards</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Filter & Sort Controls Bar */}
      <div className="bg-[#14161b] border border-[#27272a] rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recommended movies by title or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0c0e] border border-[#242731] text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#f5c518] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0b0c0e] border border-[#242731] text-xs font-medium text-gray-200 focus:outline-none focus:border-[#f5c518] transition-colors"
            >
              <option value="match">Match Percentage (Highest first)</option>
              <option value="rating">IMDb Rating (Highest first)</option>
              <option value="year-desc">Release Year (Newest first)</option>
              <option value="year-asc">Release Year (Oldest first)</option>
              <option value="rank">IMDb Rank (#1 to #250)</option>
            </select>
          </div>

          {/* Source Filter Select */}
          <div className="md:col-span-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Pool:
            </span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0b0c0e] border border-[#242731] text-xs font-medium text-gray-200 focus:outline-none focus:border-[#f5c518] transition-colors"
            >
              <option value="all">All ({rawRecommendations.length})</option>
              <option value="watchlist">Watchlist only ({watchlist.length})</option>
              <option value="unswiped">Unswiped deck only ({deck.length})</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges (Min Match %) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#242731] text-xs">
          <span className="text-gray-400 font-medium">Minimum Match:</span>
          {[
            { label: "All Scores", val: 0 },
            { label: "75%+ Match", val: 75 },
            { label: "85%+ Match", val: 85 },
            { label: "90%+ Top Match", val: 90 },
          ].map((pill) => (
            <button
              key={pill.val}
              onClick={() => setMinMatch(pill.val)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                minMatch === pill.val
                  ? "bg-[#f5c518] text-black font-bold shadow-sm"
                  : "bg-[#0b0c0e] text-gray-400 hover:text-white border border-[#242731]"
              }`}
            >
              {pill.label}
            </button>
          ))}

          <span className="ml-auto text-gray-400">
            Showing <strong className="text-white">{filteredRecommendations.length}</strong> matches
          </span>
        </div>
      </div>

      {/* Recommendations Feed Grid */}
      {filteredRecommendations.length === 0 ? (
        <div className="rounded-2xl bg-[#14161b] border border-[#27272a] p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Movies Match Your Current Filter</h3>
          <p className="text-sm text-gray-400 max-w-md">
            Try adjusting your search query, lowering the minimum match threshold, or switching pool options.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setMinMatch(0);
              setSourceFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-[#242731] hover:bg-[#2d323e] text-sm text-gray-200 font-semibold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredRecommendations.map(({ movie, matchScore, reasons }) => {
              const isWatchlisted = watchlist.some((w) => w.rank === movie.rank);
              const posterSrc = movie.local_poster_path
                ? `/${movie.local_poster_path}`
                : movie.poster_url || "/placeholder.jpg";

              return (
                <motion.div
                  key={movie.rank}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col rounded-2xl bg-[#14161b] border border-[#27272a] hover:border-[#3f4350] transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden"
                >
                  {/* Poster Image Container */}
                  <div
                    className="relative w-full aspect-[16/10] overflow-hidden bg-black/60 cursor-pointer"
                    onClick={() => handleInspect(movie)}
                  >
                    <img
                      src={posterSrc}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center filter brightness-[0.92] transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14161b] via-black/30 to-transparent" />

                    {/* Rank Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded font-black text-xs bg-[#f5c518] text-black shadow">
                        #{movie.rank}
                      </span>
                      {isWatchlisted && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600/90 text-white backdrop-blur-sm border border-blue-400/40 flex items-center gap-1 shadow">
                          <Bookmark className="w-2.5 h-2.5" /> Watchlist
                        </span>
                      )}
                    </div>

                    {/* Match Score Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border backdrop-blur-md flex items-center gap-1 shadow-md ${getMatchBadgeStyle(
                          matchScore
                        )}`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {matchScore}% Match
                      </span>
                    </div>

                    {/* Rating Pill overlay at bottom */}
                    <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-xs bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10 text-white">
                      <Star className="w-3.5 h-3.5 text-[#f5c518] fill-[#f5c518]" />
                      <span className="font-black">{movie.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-gray-400">({movie.votes_display})</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Movie Title & Year */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3
                          onClick={() => handleInspect(movie)}
                          className="font-bold text-white text-base group-hover:text-[#f5c518] transition-colors line-clamp-1 cursor-pointer"
                          title={movie.title}
                        >
                          {movie.title}
                        </h3>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {movie.year}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {movie.duration}
                        </span>
                        {movie.certificate && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px]">
                              {movie.certificate}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Recommendation Reason Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {reasons.slice(0, 2).map((reason, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#1a1d24] border border-[#2e333d] text-gray-300 font-medium"
                          >
                            {getReasonIcon(reason)}
                            <span className="truncate max-w-[170px]">{reason}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Action Button Bar */}
                    <div className="pt-3 border-t border-[#242731] flex items-center justify-between gap-1.5">
                      {/* Pass (Red) */}
                      <button
                        onClick={() => handleQuickAction(movie, "pass")}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 transition-all flex items-center justify-center gap-1 text-xs font-semibold"
                        title="Pass / Not interested"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pass</span>
                      </button>

                      {/* Watchlist (Blue) */}
                      <button
                        onClick={() => handleQuickAction(movie, "watchlist")}
                        className={`flex-1 py-1.5 px-2 rounded-xl border transition-all flex items-center justify-center gap-1 text-xs font-semibold ${
                          isWatchlisted
                            ? "bg-blue-600 text-white border-blue-500"
                            : "bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/30"
                        }`}
                        title="Add to Watchlist"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Watchlist</span>
                      </button>

                      {/* Mark as Watched (Green) */}
                      <button
                        onClick={() => handleQuickAction(movie, "watched")}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all flex items-center justify-center gap-1 text-xs font-semibold"
                        title="Mark as Watched"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline">Watched</span>
                      </button>

                      {/* Inspect details button */}
                      <button
                        onClick={() => handleInspect(movie)}
                        className="p-1.5 rounded-xl bg-[#20242e] hover:bg-[#2b303d] text-gray-300 hover:text-[#f5c518] border border-[#2e333d] transition-colors"
                        title="Inspect full movie details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Global Movie Detail Modal */}
      <MovieDetailModal />
    </div>
  );
};

export default RecommendationsView;
