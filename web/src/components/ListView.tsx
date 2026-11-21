"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Bookmark,
  CheckCircle2,
  XCircle,
  Trash2,
  Info,
  Star,
  Clock,
  ExternalLink,
  Calendar,
  LayoutGrid,
  List,
  Film,
  RotateCcw,
  Eye,
  Filter
} from "lucide-react";
import { Movie, SwipeAction } from "../types/movie";
import { useMovies } from "../context/MovieContext";

export interface ListViewProps {
  activeList?: "watchlist" | "watched" | "pass";
  onSelectList?: (list: "watchlist" | "watched" | "pass") => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  watchlist?: Movie[];
  watched?: Movie[];
  passed?: Movie[];
  pass?: Movie[];
  onMoveToWatched?: (movie: Movie) => void;
  onMoveToWatchlist?: (movie: Movie) => void;
  onMoveToPass?: (movie: Movie) => void;
  onRemove?: (movie: Movie) => void;
  onViewDetails?: (movie: Movie) => void;
  allMovies?: Movie[];
}

type SortOption =
  | "rank-asc"
  | "rank-desc"
  | "rating-desc"
  | "rating-asc"
  | "year-desc"
  | "year-asc"
  | "runtime-desc"
  | "runtime-asc";

const DECADE_OPTIONS = [
  { label: "All Decades", value: "all" },
  { label: "1920s - 1950s (Classics)", value: "1920s-1950s" },
  { label: "1960s", value: "1960s" },
  { label: "1970s", value: "1970s" },
  { label: "1980s", value: "1980s" },
  { label: "1990s", value: "1990s" },
  { label: "2000s", value: "2000s" },
  { label: "2010s", value: "2010s" },
  { label: "2020s", value: "2020s" },
];

const CERTIFICATE_OPTIONS = [
  { label: "All Certificates", value: "all" },
  { label: "15", value: "15" },
  { label: "12A", value: "12A" },
  { label: "18", value: "18" },
  { label: "PG", value: "PG" },
  { label: "U", value: "U" },
  { label: "12", value: "12" },
  { label: "X", value: "X" },
  { label: "A", value: "A" },
  { label: "AA", value: "AA" },
  { label: "Not Rated", value: "Not Rated" },
];

export const ListView: React.FC<ListViewProps> = (props) => {
  // Gracefully fallback to MovieContext if available
  let context: ReturnType<typeof useMovies> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    context = useMovies();
  } catch {
    context = null;
  }

  // Lists resolution
  const watchlist = props.watchlist ?? context?.watchlist ?? [];
  const watched = props.watched ?? context?.watched ?? [];
  const passed = props.passed ?? props.pass ?? context?.passed ?? [];

  // Active list determination
  const [internalList, setInternalList] = useState<"watchlist" | "watched" | "pass">("watchlist");

  const currentTabRaw = props.activeList || props.activeTab || (context?.activeTab as string) || internalList;
  const currentList: "watchlist" | "watched" | "pass" =
    currentTabRaw === "watched"
      ? "watched"
      : currentTabRaw === "pass" || currentTabRaw === "passed"
      ? "pass"
      : "watchlist";

  const handleListSwitch = (list: "watchlist" | "watched" | "pass") => {
    setInternalList(list);
    props.onSelectList?.(list);
    props.onTabChange?.(list);
    if (context?.setActiveTab && (list === "watchlist" || list === "watched")) {
      context.setActiveTab(list);
    }
  };

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecade, setSelectedDecade] = useState("all");
  const [selectedCertificate, setSelectedCertificate] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("rank-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Selected movie for in-component details modal
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);

  // Active list dataset
  const rawListMovies = useMemo(() => {
    switch (currentList) {
      case "watched":
        return watched;
      case "pass":
        return passed;
      case "watchlist":
      default:
        return watchlist;
    }
  }, [currentList, watched, passed, watchlist]);

  // Filtered and sorted dataset
  const filteredMovies = useMemo(() => {
    let result = [...rawListMovies];

    // 1. Text Search (title or year)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.year.toString().includes(q) ||
          m.rank.toString() === q
      );
    }

    // 2. Filter by Decade
    if (selectedDecade !== "all") {
      if (selectedDecade === "1920s-1950s") {
        result = result.filter((m) => m.year >= 1920 && m.year <= 1959);
      } else {
        const decadeStart = parseInt(selectedDecade.replace("s", ""), 10);
        result = result.filter(
          (m) => m.year >= decadeStart && m.year <= decadeStart + 9
        );
      }
    }

    // 3. Filter by Certificate
    if (selectedCertificate !== "all") {
      result = result.filter((m) => m.certificate === selectedCertificate);
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "rank-asc":
          return a.rank - b.rank;
        case "rank-desc":
          return b.rank - a.rank;
        case "rating-desc":
          return b.rating - a.rating;
        case "rating-asc":
          return a.rating - b.rating;
        case "year-desc":
          return b.year - a.year;
        case "year-asc":
          return a.year - b.year;
        case "runtime-desc":
          return b.duration_minutes - a.duration_minutes;
        case "runtime-asc":
          return a.duration_minutes - b.duration_minutes;
        default:
          return a.rank - b.rank;
      }
    });

    return result;
  }, [rawListMovies, searchQuery, selectedDecade, selectedCertificate, sortBy]);

  // Actions
  const handleMoveToWatched = (movie: Movie) => {
    if (props.onMoveToWatched) {
      props.onMoveToWatched(movie);
    } else if (context) {
      context.moveMovie(movie, "watched");
    }
  };

  const handleMoveToWatchlist = (movie: Movie) => {
    if (props.onMoveToWatchlist) {
      props.onMoveToWatchlist(movie);
    } else if (context) {
      context.moveMovie(movie, "watchlist");
    }
  };

  const handleMoveToPass = (movie: Movie) => {
    if (props.onMoveToPass) {
      props.onMoveToPass(movie);
    } else if (context) {
      context.moveMovie(movie, "pass");
    }
  };

  const handleRemove = (movie: Movie) => {
    if (props.onRemove) {
      props.onRemove(movie);
    } else if (context) {
      context.moveMovie(movie, "unswiped");
    }
  };

  const handleOpenDetails = (movie: Movie) => {
    if (props.onViewDetails) {
      props.onViewDetails(movie);
    }
    if (context?.setSelectedMovie) {
      context.setSelectedMovie(movie);
    }
    setModalMovie(movie);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDecade("all");
    setSelectedCertificate("all");
    setSortBy("rank-asc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedDecade !== "all" ||
    selectedCertificate !== "all" ||
    sortBy !== "rank-asc";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* List Switcher Segmented Control */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#14161b] p-2 sm:p-2.5 rounded-2xl border border-[#242731] shadow-card">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Watchlist Tab */}
          <button
            onClick={() => handleListSwitch("watchlist")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              currentList === "watchlist"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bookmark className="w-4 h-4 text-blue-400" />
            <span>To Watch</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                currentList === "watchlist"
                  ? "bg-black/30 text-white"
                  : "bg-[#242731] text-gray-300"
              }`}
            >
              {watchlist.length}
            </span>
          </button>

          {/* Watched Tab */}
          <button
            onClick={() => handleListSwitch("watched")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              currentList === "watched"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Watched</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                currentList === "watched"
                  ? "bg-black/30 text-white"
                  : "bg-[#242731] text-gray-300"
              }`}
            >
              {watched.length}
            </span>
          </button>

          {/* Not Interested / Pass Tab */}
          <button
            onClick={() => handleListSwitch("pass")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              currentList === "pass"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Not Interested</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                currentList === "pass"
                  ? "bg-black/30 text-white"
                  : "bg-[#242731] text-gray-300"
              }`}
            >
              {passed.length}
            </span>
          </button>
        </div>

        {/* View Mode Toggle & Mobile Filter Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#242731]">
          <div className="text-xs text-gray-400 font-medium">
            Showing <span className="text-white font-bold">{filteredMovies.length}</span> of {rawListMovies.length}
          </div>

          <div className="flex items-center gap-1.5 bg-[#0b0c0e] p-1 rounded-xl border border-[#242731]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-[#242731] text-[#f5c518]"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-[#242731] text-[#f5c518]"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowFiltersMobile((prev) => !prev)}
            className="sm:hidden p-2 rounded-xl bg-[#242731] text-gray-300 hover:text-white"
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-[#14161b] p-4 rounded-2xl border border-[#242731] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Real-time search input */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, year, or rank #..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#0b0c0e] border border-[#242731] focus:border-[#f5c518] rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
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

          {/* Desktop & Collapsible Mobile Filters */}
          <div
            className={`${
              showFiltersMobile ? "grid" : "hidden sm:grid"
            } grid-cols-1 sm:grid-cols-3 md:col-span-7 gap-3`}
          >
            {/* Decade Filter */}
            <div className="relative">
              <select
                value={selectedDecade}
                onChange={(e) => setSelectedDecade(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#0b0c0e] border border-[#242731] focus:border-[#f5c518] rounded-xl text-xs sm:text-sm text-gray-200 outline-none cursor-pointer appearance-none transition-colors"
              >
                {DECADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#14161b]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>

            {/* Certificate Filter */}
            <div className="relative">
              <select
                value={selectedCertificate}
                onChange={(e) => setSelectedCertificate(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#0b0c0e] border border-[#242731] focus:border-[#f5c518] rounded-xl text-xs sm:text-sm text-gray-200 outline-none cursor-pointer appearance-none transition-colors"
              >
                {CERTIFICATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#14161b]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full py-2.5 px-3 bg-[#0b0c0e] border border-[#242731] focus:border-[#f5c518] rounded-xl text-xs sm:text-sm text-gray-200 outline-none cursor-pointer appearance-none transition-colors"
              >
                <option value="rank-asc" className="bg-[#14161b]">
                  Sort: Rank (#1 Top)
                </option>
                <option value="rank-desc" className="bg-[#14161b]">
                  Sort: Rank (#250 First)
                </option>
                <option value="rating-desc" className="bg-[#14161b]">
                  Sort: Rating (Highest)
                </option>
                <option value="rating-asc" className="bg-[#14161b]">
                  Sort: Rating (Lowest)
                </option>
                <option value="year-desc" className="bg-[#14161b]">
                  Sort: Year (Newest)
                </option>
                <option value="year-asc" className="bg-[#14161b]">
                  Sort: Year (Oldest)
                </option>
                <option value="runtime-desc" className="bg-[#14161b]">
                  Sort: Runtime (Longest)
                </option>
                <option value="runtime-asc" className="bg-[#14161b]">
                  Sort: Runtime (Shortest)
                </option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills indicator if active */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#242731]/80 text-xs text-gray-400">
            <span className="font-semibold text-gray-300">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242731] text-white">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3 h-3 text-gray-400 hover:text-white" />
                </button>
              </span>
            )}
            {selectedDecade !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242731] text-white">
                Decade: {selectedDecade}
                <button onClick={() => setSelectedDecade("all")}>
                  <X className="w-3 h-3 text-gray-400 hover:text-white" />
                </button>
              </span>
            )}
            {selectedCertificate !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242731] text-white">
                Cert: {selectedCertificate}
                <button onClick={() => setSelectedCertificate("all")}>
                  <X className="w-3 h-3 text-gray-400 hover:text-white" />
                </button>
              </span>
            )}
            {sortBy !== "rank-asc" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242731] text-white">
                Sorted
                <button onClick={() => setSortBy("rank-asc")}>
                  <X className="w-3 h-3 text-gray-400 hover:text-white" />
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-[#f5c518] hover:underline ml-auto font-medium"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Movies Grid / List or Empty State */}
      {filteredMovies.length > 0 ? (
        viewMode === "grid" ? (
          /* Responsive Grid (1 col mobile, 2 col tablet, 3-4 col desktop) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredMovies.map((movie) => {
              const posterSrc = movie.local_poster_path
                ? `/${movie.local_poster_path}`
                : movie.poster_url || "";

              return (
                <motion.div
                  key={movie.rank}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col rounded-2xl bg-[#14161b] border border-[#242731] hover:border-gray-600 transition-all duration-300 hover:shadow-card overflow-hidden"
                >
                  {/* Poster Header */}
                  <div className="relative aspect-[16/10] w-full bg-[#0b0c0e] overflow-hidden">
                    <img
                      src={posterSrc}
                      alt={movie.title}
                      loading="lazy"
                      onError={(e) => {
                        // fallback to external poster or placeholder
                        const target = e.currentTarget;
                        if (movie.poster_url && target.src !== movie.poster_url) {
                          target.src = movie.poster_url;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14161b] via-[#14161b]/30 to-transparent" />

                    {/* Rank Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-black bg-[#f5c518] text-black shadow-md">
                        #{movie.rank}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-black/60 backdrop-blur-md border border-white/10 text-gray-300">
                        {movie.certificate}
                      </span>
                    </div>

                    {/* Year Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-md text-xs font-bold bg-black/70 backdrop-blur-md text-gray-200 border border-white/10">
                        {movie.year}
                      </span>
                    </div>

                    {/* Quick Details overlay button */}
                    <button
                      onClick={() => handleOpenDetails(movie)}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-black/70 hover:bg-[#f5c518] text-white hover:text-black transition-colors backdrop-blur-md opacity-0 group-hover:opacity-100 shadow-md"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Movie Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3
                        onClick={() => handleOpenDetails(movie)}
                        className="font-bold text-white text-base line-clamp-1 hover:text-[#f5c518] cursor-pointer transition-colors"
                        title={movie.title}
                      >
                        {movie.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        {/* Rating */}
                        <div className="flex items-center gap-1 text-[#f5c518] font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{movie.rating.toFixed(1)}</span>
                          <span className="text-[11px] text-gray-500 font-normal">
                            ({movie.votes_display})
                          </span>
                        </div>
                        <span>•</span>
                        {/* Runtime */}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{movie.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="pt-3 border-t border-[#242731] flex items-center justify-between gap-1.5">
                      {/* Move to Watched button (if not already in watched) */}
                      {currentList !== "watched" && (
                        <button
                          onClick={() => handleMoveToWatched(movie)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                          title="Mark as Watched"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Watched</span>
                        </button>
                      )}

                      {/* Move to Watchlist button (if not already in watchlist) */}
                      {currentList !== "watchlist" && (
                        <button
                          onClick={() => handleMoveToWatchlist(movie)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                          title="Add to Watchlist"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">To Watch</span>
                        </button>
                      )}

                      {/* Move to Pass button (if not already in pass) */}
                      {currentList !== "pass" && (
                        <button
                          onClick={() => handleMoveToPass(movie)}
                          className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                          title="Not Interested"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Remove / Reset to Deck */}
                      <button
                        onClick={() => handleRemove(movie)}
                        className="py-1.5 px-2.5 rounded-lg bg-[#242731] hover:bg-gray-700 text-gray-400 hover:text-white text-xs flex items-center justify-center transition-colors"
                        title="Remove / Return to swipe deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* View Details modal */}
                      <button
                        onClick={() => handleOpenDetails(movie)}
                        className="py-1.5 px-2.5 rounded-lg bg-[#242731] hover:bg-gray-700 text-gray-400 hover:text-[#f5c518] text-xs flex items-center justify-center transition-colors"
                        title="Movie Info"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Compact List View */
          <div className="space-y-2">
            {filteredMovies.map((movie) => {
              const posterSrc = movie.local_poster_path
                ? `/${movie.local_poster_path}`
                : movie.poster_url || "";

              return (
                <div
                  key={movie.rank}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#14161b] border border-[#242731] hover:border-gray-600 transition-all gap-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="w-8 text-center text-xs font-black text-[#f5c518]">
                      #{movie.rank}
                    </span>
                    <img
                      src={posterSrc}
                      alt=""
                      className="w-10 h-14 object-cover rounded bg-[#0b0c0e] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div
                        onClick={() => handleOpenDetails(movie)}
                        className="font-bold text-white text-sm truncate cursor-pointer hover:text-[#f5c518]"
                      >
                        {movie.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span className="text-[#f5c518] font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> {movie.rating}
                        </span>
                        <span>•</span>
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span>{movie.duration}</span>
                        <span className="hidden sm:inline px-1.5 py-0.2 rounded bg-black/40 text-[10px] text-gray-300">
                          {movie.certificate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for list row */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {currentList !== "watched" && (
                      <button
                        onClick={() => handleMoveToWatched(movie)}
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-colors"
                        title="Mark Watched"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {currentList !== "watchlist" && (
                      <button
                        onClick={() => handleMoveToWatchlist(movie)}
                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-colors"
                        title="Move to Watchlist"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    )}
                    {currentList !== "pass" && (
                      <button
                        onClick={() => handleMoveToPass(movie)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                        title="Not Interested"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(movie)}
                      className="p-2 rounded-lg bg-[#242731] hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDetails(movie)}
                      className="p-2 rounded-lg bg-[#242731] hover:bg-gray-700 text-gray-400 hover:text-[#f5c518] transition-colors"
                      title="Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="rounded-2xl bg-[#14161b] border border-[#242731] p-10 sm:p-16 flex flex-col items-center justify-center text-center">
          {rawListMovies.length === 0 ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-[#242731]/60 flex items-center justify-center mb-5 text-gray-500">
                {currentList === "watched" ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/60" />
                ) : currentList === "watchlist" ? (
                  <Bookmark className="w-10 h-10 text-blue-500/60" />
                ) : (
                  <XCircle className="w-10 h-10 text-rose-500/60" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {currentList === "watched"
                  ? "No Watched Movies Yet"
                  : currentList === "watchlist"
                  ? "Your Watchlist is Empty"
                  : "No Disliked Movies"}
              </h3>
              <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
                {currentList === "watched"
                  ? "Swipe right on movies in Discover mode to mark them as watched and track your progress!"
                  : currentList === "watchlist"
                  ? "Swipe left on movies you haven't seen yet to build your ultimate IMDb watchlist."
                  : "Movies you swipe down on (not interested) will appear here."}
              </p>
              {context && (
                <button
                  onClick={() => context?.setActiveTab?.("swipe")}
                  className="px-5 py-2.5 rounded-xl bg-[#f5c518] text-black font-bold text-sm hover:bg-[#ffcf33] transition-colors flex items-center gap-2 shadow-lg shadow-[#f5c518]/20"
                >
                  <Film className="w-4 h-4" />
                  Start Discovering Movies
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#242731]/60 flex items-center justify-center mb-4 text-gray-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No matching movies found
              </h3>
              <p className="text-gray-400 text-sm max-w-sm mb-5">
                We couldn't find any films matching your search query or filter criteria in this list.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-[#242731] hover:bg-gray-700 text-white font-semibold text-xs transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Movie Details Modal */}
      <AnimatePresence>
        {modalMovie && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#14161b] border border-[#242731] rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setModalMovie(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Banner Poster */}
              <div className="relative aspect-[16/9] w-full bg-[#0b0c0e]">
                <img
                  src={
                    modalMovie.local_poster_path
                      ? `/${modalMovie.local_poster_path}`
                      : modalMovie.poster_url || ""
                  }
                  alt={modalMovie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14161b] via-[#14161b]/40 to-transparent" />
                <div className="absolute bottom-4 left-5 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-md text-xs font-black bg-[#f5c518] text-black shadow-lg">
                    #{modalMovie.rank} TOP 250
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-black/60 border border-white/10 text-gray-200">
                    {modalMovie.certificate}
                  </span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-white">{modalMovie.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-300">
                    <div className="flex items-center gap-1.5 text-[#f5c518] font-bold">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{modalMovie.rating}</span>
                      <span className="text-xs text-gray-400 font-normal">
                        ({modalMovie.votes_display} votes)
                      </span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {modalMovie.year}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {modalMovie.duration}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={modalMovie.imdb_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0b0c0e] hover:bg-black border border-[#242731] hover:border-[#f5c518] text-gray-200 hover:text-[#f5c518] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>View on IMDb</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Move actions inside modal */}
                <div className="pt-4 border-t border-[#242731] space-y-2">
                  <div className="text-xs font-semibold text-gray-400">Classify Movie:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        handleMoveToWatched(modalMovie);
                        setModalMovie(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Watched
                    </button>
                    <button
                      onClick={() => {
                        handleMoveToWatchlist(modalMovie);
                        setModalMovie(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Bookmark className="w-4 h-4" /> To Watch
                    </button>
                    <button
                      onClick={() => {
                        handleMoveToPass(modalMovie);
                        setModalMovie(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Pass
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
