"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Award,
  BarChart3,
  Clock,
  Star,
  Flame,
  Bookmark,
  CheckCircle2,
  XCircle,
  Download,
  RotateCcw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Film,
  Calendar,
  Layers,
  AlertTriangle,
  X,
  FileSpreadsheet,
  FileCode
} from "lucide-react";
import { Movie } from "../types/movie";
import { useMovies } from "../context/MovieContext";
import rawMoviesData from "../data/movies.json";

export interface StatsViewProps {
  watched?: Movie[];
  watchlist?: Movie[];
  passed?: Movie[];
  pass?: Movie[];
  allMovies?: Movie[];
  onResetProgress?: () => void;
  onExport?: (format: "json" | "csv", listType?: "watchlist" | "watched" | "all") => void;
  onNavigateTab?: (tab: string) => void;
}

interface Milestone {
  id: string;
  count: number;
  title: string;
  badge: string;
  description: string;
  icon: string;
}

const MILESTONES: Milestone[] = [
  {
    id: "novice",
    count: 10,
    title: "Film Novice",
    badge: "Bronze Reel",
    description: "Watched your first 10 films from the IMDb Top 250",
    icon: "🌱",
  },
  {
    id: "enthusiast",
    count: 25,
    title: "Film Enthusiast",
    badge: "Silver Ticket",
    description: "Completed 10% of cinema's greatest masterworks",
    icon: "🎟️",
  },
  {
    id: "cinephile",
    count: 50,
    title: "Cinephile",
    badge: "Golden Clapper",
    description: "A genuine lover of classic and modern cinematic brilliance",
    icon: "🎬",
  },
  {
    id: "connoisseur",
    count: 100,
    title: "Cinema Connoisseur",
    badge: "Century Club",
    description: "Crossed 100 films! Exceptional breadth across decades",
    icon: "🏆",
  },
  {
    id: "legend",
    count: 150,
    title: "IMDb Legend",
    badge: "Hall of Fame",
    description: "Conquered over 60% of the entire Top 250 canon",
    icon: "👑",
  },
  {
    id: "master",
    count: 200,
    title: "Master of Cinema",
    badge: "Platinum Director",
    description: "Only 50 films away from total completion",
    icon: "✨",
  },
  {
    id: "completionist",
    count: 250,
    title: "IMDb Completionist",
    badge: "Grandmaster",
    description: "Witnessed all 250 greatest movies in human history",
    icon: "🌟",
  },
];

// Pre-computed total movies in each decade for IMDb Top 250
const DECADE_TOTALS: Record<number, number> = {
  1920: 6,
  1930: 6,
  1940: 9,
  1950: 21,
  1960: 17,
  1970: 16,
  1980: 26,
  1990: 39,
  2000: 48,
  2010: 44,
  2020: 18,
};

const CERTIFICATE_TOTALS: Record<string, number> = {
  "15": 63,
  "18": 36,
  "U": 34,
  "PG": 33,
  "12A": 32,
  "A": 25,
  "X": 15,
  "12": 8,
  "AA": 3,
  "Not Rated": 1,
};

const OVERALL_TOP250_AVG_RATING = 8.31;

export const StatsView: React.FC<StatsViewProps> = (props) => {
  let context: ReturnType<typeof useMovies> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    context = useMovies();
  } catch {
    context = null;
  }

  const allMovies = (props.allMovies || context?.allMovies || rawMoviesData) as Movie[];
  const watched = props.watched || context?.watched || [];
  const watchlist = props.watchlist || context?.watchlist || [];
  const passed = props.passed || props.pass || context?.passed || [];

  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Core Calculations
  const watchedCount = watched.length;
  const totalCount = allMovies.length || 250;
  const completionPercentage = Math.round((watchedCount / totalCount) * 100 * 10) / 10;

  // Watch Time Calculations
  const totalMinutes = useMemo(() => {
    return watched.reduce((acc, m) => acc + (m.duration_minutes || 0), 0);
  }, [watched]);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const totalDays = (totalMinutes / (60 * 24)).toFixed(1);
  const avgWatchedRuntime = watchedCount > 0 ? Math.round(totalMinutes / watchedCount) : 0;

  // Rating Comparisons
  const avgWatchedRating = useMemo(() => {
    if (watchedCount === 0) return 0;
    const sum = watched.reduce((acc, m) => acc + m.rating, 0);
    return Math.round((sum / watchedCount) * 100) / 100;
  }, [watched, watchedCount]);

  const ratingDiff = useMemo(() => {
    if (watchedCount === 0) return 0;
    return Math.round((avgWatchedRating - OVERALL_TOP250_AVG_RATING) * 100) / 100;
  }, [avgWatchedRating, watchedCount]);

  const highestRatedWatched = useMemo(() => {
    if (watched.length === 0) return null;
    return [...watched].sort((a, b) => b.rating - a.rating)[0];
  }, [watched]);

  const lowestRatedWatched = useMemo(() => {
    if (watched.length === 0) return null;
    return [...watched].sort((a, b) => a.rating - b.rating)[0];
  }, [watched]);

  // Decade Distribution
  const decadeBreakdown = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const m of watched) {
      const dec = Math.floor(m.year / 10) * 10;
      counts[dec] = (counts[dec] || 0) + 1;
    }

    return Object.entries(DECADE_TOTALS).map(([decadeStr, total]) => {
      const decade = Number(decadeStr);
      const watchedInDecade = counts[decade] || 0;
      const pct = Math.round((watchedInDecade / total) * 100);
      return {
        decade,
        label: `${decade}s`,
        watchedCount: watchedInDecade,
        totalInTop250: total,
        percentage: pct,
      };
    });
  }, [watched]);

  // Favorite Decade
  const favoriteDecade = useMemo(() => {
    if (watchedCount === 0) return null;
    let max = -1;
    let fav: (typeof decadeBreakdown)[0] | null = null;
    for (const item of decadeBreakdown) {
      if (item.watchedCount > max && item.watchedCount > 0) {
        max = item.watchedCount;
        fav = item;
      }
    }
    return fav;
  }, [decadeBreakdown, watchedCount]);

  // Certificate Distribution
  const certificateBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of watched) {
      counts[m.certificate] = (counts[m.certificate] || 0) + 1;
    }

    return Object.entries(CERTIFICATE_TOTALS)
      .map(([cert, total]) => {
        const watchedInCert = counts[cert] || 0;
        const pctOfWatched =
          watchedCount > 0 ? Math.round((watchedInCert / watchedCount) * 100) : 0;
        const pctOfTop250 = Math.round((watchedInCert / total) * 100);
        return {
          certificate: cert,
          watchedCount: watchedInCert,
          totalInTop250: total,
          pctOfWatched,
          pctOfTop250,
        };
      })
      .filter((c) => c.watchedCount > 0 || c.totalInTop250 >= 15)
      .sort((a, b) => b.watchedCount - a.watchedCount);
  }, [watched, watchedCount]);

  // Current and Next Milestones
  const currentMilestone = useMemo(() => {
    const achieved = MILESTONES.filter((m) => watchedCount >= m.count);
    return achieved.length > 0 ? achieved[achieved.length - 1] : null;
  }, [watchedCount]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => watchedCount < m.count) || null;
  }, [watchedCount]);

  // Milestone Celebration
  const celebrateMilestone = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#f5c518", "#10b981", "#3b82f6", "#ffffff"],
    });
  };

  // Export handlers
  const handleExportCSV = (listType: "watchlist" | "watched" | "all") => {
    let moviesToExport: Movie[] = [];
    let filename = "imdb-top250-movies.csv";

    if (listType === "watchlist") {
      moviesToExport = watchlist;
      filename = "imdb-top250-watchlist.csv";
    } else if (listType === "watched") {
      moviesToExport = watched;
      filename = "imdb-top250-watched.csv";
    } else {
      moviesToExport = [...watched, ...watchlist];
      filename = "imdb-top250-all.csv";
    }

    if (moviesToExport.length === 0) {
      alert("No movies available to export in this category.");
      return;
    }

    const headers = [
      "Rank",
      "Title",
      "Year",
      "IMDb Rating",
      "Certificate",
      "Duration",
      "Duration Minutes",
      "Votes",
      "IMDb URL",
    ];

    const rows = moviesToExport.map((m) => [
      m.rank,
      `"${m.title.replace(/"/g, '""')}"`,
      m.year,
      m.rating,
      `"${m.certificate}"`,
      `"${m.duration}"`,
      m.duration_minutes,
      `"${m.votes_display}"`,
      `"${m.imdb_url}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
    setShowExportModal(false);
  };

  const handleExportJSON = (listType: "watchlist" | "watched" | "all") => {
    let payload: unknown = null;
    let filename = "imdb-top250-data.json";

    if (listType === "watchlist") {
      payload = {
        exportedAt: new Date().toISOString(),
        list: "watchlist",
        count: watchlist.length,
        movies: watchlist,
      };
      filename = "imdb-top250-watchlist.json";
    } else if (listType === "watched") {
      payload = {
        exportedAt: new Date().toISOString(),
        list: "watched",
        count: watched.length,
        movies: watched,
      };
      filename = "imdb-top250-watched.json";
    } else {
      payload = {
        exportedAt: new Date().toISOString(),
        stats: {
          watchedCount: watched.length,
          watchlistCount: watchlist.length,
          passedCount: passed.length,
          completionPercentage,
          totalWatchMinutes: totalMinutes,
        },
        watched,
        watchlist,
        passed,
      };
      filename = "imdb-top250-complete-backup.json";
    }

    const jsonString = JSON.stringify(payload, null, 2);
    downloadFile(jsonString, filename, "application/json");
    setShowExportModal(false);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset Progress Handler
  const handleConfirmReset = () => {
    if (props.onResetProgress) {
      props.onResetProgress();
    } else if (context) {
      context.resetAll();
    }
    setShowResetConfirm(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#14161b] p-6 rounded-2xl border border-[#242731] shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">IMDb Top 250 Progress</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Comprehensive breakdown of your classic cinema conquest
          </p>
        </div>

        {/* Action Buttons: Export & Reset */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#242731] hover:bg-gray-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-[#f5c518]" />
            <span>Export Data</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Main Overall Progress & Milestone Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#14161b] via-[#14161b] to-[#1c1f26] border border-[#242731] p-6 sm:p-8 shadow-card overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Overall Completion
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {watchedCount}
              </span>
              <span className="text-xl sm:text-2xl text-gray-500 font-bold">
                / {totalCount} movies
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#f5c518]">
                ({completionPercentage}%)
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {watchedCount === 0
                ? "Start swiping in Discover mode to mark watched movies and unlock milestones."
                : watchedCount === 250
                ? "Incredible achievement! You have watched every single film in the IMDb Top 250!"
                : `You've watched ${watchedCount} masterpieces. ${
                    250 - watchedCount
                  } movies remaining to complete the Top 250.`}
            </p>
          </div>

          {/* Current Milestone Badge Showcase */}
          {currentMilestone ? (
            <div
              onClick={celebrateMilestone}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#0b0c0e]/80 border border-[#f5c518]/30 shadow-lg cursor-pointer hover:border-[#f5c518] transition-all group"
              title="Click to celebrate!"
            >
              <div className="text-3xl p-3 rounded-xl bg-[#f5c518]/10 border border-[#f5c518]/20 group-hover:scale-110 transition-transform">
                {currentMilestone.icon}
              </div>
              <div>
                <div className="text-[10px] text-[#f5c518] uppercase tracking-wider font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Current Milestone
                </div>
                <div className="text-lg font-black text-white">{currentMilestone.title}</div>
                <div className="text-xs text-gray-400">{currentMilestone.badge}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0b0c0e]/60 border border-[#242731]">
              <div className="text-2xl p-2.5 rounded-xl bg-gray-800 text-gray-400">🌱</div>
              <div>
                <div className="text-xs text-gray-400 font-semibold">Next Goal</div>
                <div className="text-sm font-bold text-white">Watch 10 movies to earn Novice</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="w-full h-3.5 bg-[#0b0c0e] rounded-full overflow-hidden p-0.5 border border-[#242731]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(watchedCount > 0 ? 2 : 0, completionPercentage))}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#f5c518] to-amber-500 shadow-glow-watched"
            />
          </div>

          {/* Next Milestone Track */}
          {nextMilestone && (
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>
                Next: <strong className="text-white">{nextMilestone.title}</strong> ({nextMilestone.count} films)
              </span>
              <span className="text-[#f5c518] font-semibold">
                {nextMilestone.count - watchedCount} more to unlock
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Watched Movies */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#242731] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Watched
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{watchedCount}</div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              {completionPercentage}% of Top 250
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#242731] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Watchlist
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{watchlist.length}</div>
            <div className="text-xs text-blue-400 font-medium mt-1">
              Saved for movie night
            </div>
          </div>
        </div>

        {/* Total Watch Time */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#242731] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Watch Time
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-[#f5c518]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {totalHours}h {remainingMins}m
            </div>
            <div className="text-xs text-gray-400 font-medium mt-1">
              {totalDays} continuous days of film
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#242731] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Avg Rating
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">
              {watchedCount > 0 ? avgWatchedRating.toFixed(2) : "—"}
            </div>
            <div className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-1">
              {watchedCount > 0 ? (
                <>
                  <span>vs 8.31 top 250 avg</span>
                  {ratingDiff >= 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center">
                      <TrendingUp className="w-3 h-3 ml-0.5 inline" /> +{ratingDiff}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center">
                      <TrendingDown className="w-3 h-3 ml-0.5 inline" /> {ratingDiff}
                    </span>
                  )}
                </>
              ) : (
                "Rate movies to compare"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Roadmap */}
      <div className="bg-[#14161b] p-6 rounded-2xl border border-[#242731] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#f5c518]" />
              Milestone Achievements
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Unlock badges as you journey through IMDb's highest-ranked cinema
            </p>
          </div>
          <button
            onClick={celebrateMilestone}
            className="text-xs text-[#f5c518] hover:underline font-semibold"
          >
            Celebrate 🎉
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MILESTONES.map((m) => {
            const isUnlocked = watchedCount >= m.count;
            const isCurrent = currentMilestone?.id === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? "bg-[#f5c518]/10 border-[#f5c518] shadow-md shadow-[#f5c518]/10"
                    : isUnlocked
                    ? "bg-[#0b0c0e] border-emerald-500/40 text-gray-200"
                    : "bg-[#0b0c0e]/40 border-[#242731] opacity-50 text-gray-500"
                }`}
              >
                <div className="text-2xl">{m.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-bold text-xs truncate ${
                        isCurrent ? "text-[#f5c518]" : isUnlocked ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {m.title}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                        isUnlocked
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {m.count}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                    {m.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decade Distribution & Certificate Breakdown (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Decade Distribution Breakdown */}
        <div className="lg:col-span-7 bg-[#14161b] p-6 rounded-2xl border border-[#242731] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Decade Breakdown
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                How many movies you have watched per decade
              </p>
            </div>
            {favoriteDecade && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">
                Fav: {favoriteDecade.label} ({favoriteDecade.watchedCount})
              </span>
            )}
          </div>

          <div className="space-y-3">
            {decadeBreakdown.map((item) => (
              <div key={item.decade} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-300">{item.label}</span>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-white font-bold">{item.watchedCount}</span>
                    <span className="text-gray-500">/ {item.totalInTop250}</span>
                    <span className="text-blue-400 w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-[#0b0c0e] rounded-full overflow-hidden border border-[#242731]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate Breakdown & Rating Highlights */}
        <div className="lg:col-span-5 space-y-6">
          {/* Certificate Breakdown */}
          <div className="bg-[#14161b] p-6 rounded-2xl border border-[#242731] space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Certificate Distribution
            </h2>
            <p className="text-xs text-gray-400">
              Breakdown of watched films by British/IMDb certificate rating
            </p>

            <div className="space-y-2.5">
              {certificateBreakdown.map((cert) => (
                <div key={cert.certificate} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#0b0c0e] border border-[#242731] font-bold text-gray-300">
                      {cert.certificate}
                    </span>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-white font-bold">{cert.watchedCount}</span>
                      <span className="text-gray-500">/ {cert.totalInTop250}</span>
                      <span className="text-purple-400 font-semibold w-8 text-right">
                        {cert.pctOfTop250}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#0b0c0e] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${cert.pctOfTop250}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Highlights Card */}
          {watchedCount > 0 && (
            <div className="bg-[#14161b] p-6 rounded-2xl border border-[#242731] space-y-4">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-[#f5c518]" /> Rating Highlights
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {highestRatedWatched && (
                  <div className="p-3 rounded-xl bg-[#0b0c0e] border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">
                      Highest Rated
                    </div>
                    <div className="font-bold text-white truncate mt-1">
                      {highestRatedWatched.title}
                    </div>
                    <div className="text-[#f5c518] font-black mt-0.5">
                      ★ {highestRatedWatched.rating}
                    </div>
                  </div>
                )}

                {lowestRatedWatched && (
                  <div className="p-3 rounded-xl bg-[#0b0c0e] border border-[#242731]">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">
                      Lowest in List
                    </div>
                    <div className="font-bold text-white truncate mt-1">
                      {lowestRatedWatched.title}
                    </div>
                    <div className="text-[#f5c518] font-black mt-0.5">
                      ★ {lowestRatedWatched.rating}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#14161b] border border-[#242731] rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#f5c518]" />
                  Export Your Data
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Download your personalized IMDb Top 250 records. Open in Excel, Google Sheets, Notion, or keep as a JSON backup.
              </p>

              <div className="space-y-2.5">
                {/* Watchlist CSV */}
                <button
                  onClick={() => handleExportCSV("watchlist")}
                  className="w-full p-3.5 rounded-xl bg-[#0b0c0e] hover:bg-[#242731] border border-[#242731] hover:border-blue-500/50 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-bold text-sm text-white">Watchlist (CSV)</div>
                      <div className="text-xs text-gray-400">
                        {watchlist.length} films ready for spreadsheet import
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Watched CSV */}
                <button
                  onClick={() => handleExportCSV("watched")}
                  className="w-full p-3.5 rounded-xl bg-[#0b0c0e] hover:bg-[#242731] border border-[#242731] hover:border-emerald-500/50 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-sm text-white">Watched Movies (CSV)</div>
                      <div className="text-xs text-gray-400">
                        {watched.length} watched titles with ratings & runtime
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Watchlist JSON */}
                <button
                  onClick={() => handleExportJSON("watchlist")}
                  className="w-full p-3.5 rounded-xl bg-[#0b0c0e] hover:bg-[#242731] border border-[#242731] hover:border-[#f5c518]/50 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-[#f5c518]" />
                    <div>
                      <div className="font-bold text-sm text-white">Watchlist (JSON)</div>
                      <div className="text-xs text-gray-400">
                        Structured JSON format with complete metadata
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Complete Backup JSON */}
                <button
                  onClick={() => handleExportJSON("all")}
                  className="w-full p-3.5 rounded-xl bg-[#0b0c0e] hover:bg-[#242731] border border-[#242731] hover:border-purple-500/50 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-bold text-sm text-white">Complete Backup (JSON)</div>
                      <div className="text-xs text-gray-400">
                        All lists (Watched, Watchlist, Passed) & statistics
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#14161b] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Reset All Progress?</h3>
                  <p className="text-xs text-rose-400/90 font-semibold">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-[#0b0c0e] p-4 rounded-xl border border-[#242731] text-xs text-gray-300 space-y-2">
                <p>
                  You are about to reset your entire classification progress:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>
                    <strong className="text-white">{watched.length}</strong> Watched movies
                  </li>
                  <li>
                    <strong className="text-white">{watchlist.length}</strong> Watchlist movies
                  </li>
                  <li>
                    <strong className="text-white">{passed.length}</strong> Not Interested movies
                  </li>
                </ul>
                <p className="text-gray-400 pt-1">
                  All 250 movies will be returned to the Discover card deck.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#242731] hover:bg-gray-700 text-white font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-600/30"
                >
                  Yes, Reset Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
