"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Clock,
  Calendar,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  XCircle,
  Film,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Movie, SwipeAction } from "../types/movie";
import { useMovies } from "../context/MovieContext";

export interface MovieDetailModalProps {
  movie?: Movie | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSwipe?: (movie: Movie, action: SwipeAction) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie: propMovie,
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSwipe: propOnSwipe,
}) => {
  const context = useMovies();

  // Resolve movie & open state from props or context
  const activeMovie = propMovie !== undefined ? propMovie : context.selectedMovie;
  const isVisible = propIsOpen !== undefined ? propIsOpen : Boolean(context.selectedMovie);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      context.setSelectedMovie(null);
    }
  };

  const handleSwipe = (action: SwipeAction) => {
    if (!activeMovie) return;

    if (propOnSwipe) {
      propOnSwipe(activeMovie, action);
    } else {
      // Check if movie is currently in deck or lists
      const isInDeck = context.deck.some((m) => m.rank === activeMovie.rank);
      if (isInDeck) {
        context.swipe(activeMovie, action);
      } else {
        context.moveMovie(activeMovie, action);
      }
    }
    handleClose();
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isVisible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVisible]);

  // Image source fallback state
  const [imgError, setImgError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setImgError(false);
    setIsZoomed(false);
  }, [activeMovie?.rank]);

  if (!activeMovie) return null;

  const posterPath =
    !imgError && activeMovie.local_poster_path
      ? `/${activeMovie.local_poster_path}`
      : activeMovie.poster_url || "/placeholder.jpg";

  // Check current status in user lists
  const isWatched = context.watched.some((m) => m.rank === activeMovie.rank);
  const isWatchlist = context.watchlist.some((m) => m.rank === activeMovie.rank);
  const isPassed = context.passed.some((m) => m.rank === activeMovie.rank);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col my-auto z-10 bg-[#14161b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header Bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] bg-[#101217]/80 backdrop-blur-sm z-20">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded font-black text-xs bg-[#f5c518] text-black tracking-wide shadow-sm">
                  #{activeMovie.rank}
                </span>
                <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                  IMDb Top 250
                </span>
                {isWatched && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Watched
                  </span>
                )}
                {isWatchlist && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <Bookmark className="w-3 h-3" /> Watchlist
                  </span>
                )}
                {isPassed && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Passed
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Top Section: Poster & Key Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                {/* Poster Preview with Zoom */}
                <div className="sm:col-span-5 flex flex-col items-center">
                  <div
                    className="group relative w-full aspect-[2/3] max-w-[240px] rounded-xl overflow-hidden bg-black/60 border border-[#2e333d] shadow-lg cursor-pointer"
                    onClick={() => setIsZoomed(!isZoomed)}
                    title="Click to toggle poster zoom"
                  >
                    <img
                      src={posterPath}
                      alt={activeMovie.title}
                      onError={() => setImgError(true)}
                      className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                        isZoomed ? "scale-125" : "group-hover:scale-105"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="text-[11px] font-medium text-white/90 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                        {isZoomed ? "Click to reset" : "Click to zoom"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div className="sm:col-span-7 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                      {activeMovie.title}
                    </h2>

                    {/* Metadata Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold text-gray-300">
                      <span className="flex items-center gap-1 bg-[#1a1d24] px-2.5 py-1 rounded border border-[#2e333d]">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {activeMovie.year}
                      </span>

                      <span className="flex items-center gap-1 bg-[#1a1d24] px-2.5 py-1 rounded border border-[#2e333d]">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {activeMovie.duration} ({activeMovie.duration_minutes}m)
                      </span>

                      {activeMovie.certificate && (
                        <span className="flex items-center gap-1 bg-[#1a1d24] px-2.5 py-1 rounded border border-[#2e333d] text-amber-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          Rated {activeMovie.certificate}
                        </span>
                      )}
                    </div>

                    {/* Rating & Consensus Card */}
                    <div className="bg-[#0e1014] border border-[#242731] rounded-xl p-3.5 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-[#f5c518]/15 border border-[#f5c518]/30">
                            <Star className="w-5 h-5 text-[#f5c518] fill-[#f5c518]" />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-white">
                                {activeMovie.rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-400 font-semibold">/10</span>
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Based on{" "}
                              <span className="font-semibold text-gray-200">
                                {activeMovie.votes_display || activeMovie.votes_count.toLocaleString()}
                              </span>{" "}
                              user votes
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-[#f5c518] flex items-center justify-end gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Top Ranked
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Rank #{activeMovie.rank} of 250
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Movie Quick Overview Insights */}
                    <div className="text-xs text-gray-400 space-y-1.5 mb-4 leading-relaxed">
                      {activeMovie.director && activeMovie.director !== "Unknown" && (
                        <p>
                          <span className="text-gray-200 font-semibold">Director:</span>{" "}
                          <span className="text-purple-300 font-medium">{activeMovie.director}</span>
                        </p>
                      )}
                      {activeMovie.genres && activeMovie.genres.length > 0 && (
                        <p>
                          <span className="text-gray-200 font-semibold">Genres:</span>{" "}
                          <span className="text-amber-300 font-medium">{activeMovie.genres.join(" • ")}</span>
                        </p>
                      )}
                      {activeMovie.cast && activeMovie.cast.length > 0 && (
                        <p>
                          <span className="text-gray-200 font-semibold">Cast:</span>{" "}
                          <span className="text-gray-300">{activeMovie.cast.slice(0, 4).join(", ")}</span>
                        </p>
                      )}
                      {activeMovie.description && (
                        <p className="pt-2 text-gray-300 italic border-t border-[#242731]">
                          "{activeMovie.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Direct IMDb Button */}
                  <a
                    href={activeMovie.imdb_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-[#f5c518] hover:bg-[#e4b613] text-black font-extrabold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <span className="font-black tracking-tighter bg-black text-[#f5c518] px-1.5 py-0.5 rounded text-xs leading-none">
                      IMDb
                    </span>
                    <span>View Full Page on IMDb</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Swipe Action Footer */}
            <div className="p-4 sm:p-5 border-t border-[#27272a] bg-[#101217] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-medium text-gray-400 text-center sm:text-left">
                Quick classify this movie:
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Pass (Red) */}
                <button
                  onClick={() => handleSwipe("pass")}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    isPassed
                      ? "bg-rose-500 text-white border-rose-400"
                      : "bg-[#1f222a] text-rose-400 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-400"
                  }`}
                  title="Pass / Not interested"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Pass</span>
                </button>

                {/* Watchlist (Blue) */}
                <button
                  onClick={() => handleSwipe("watchlist")}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    isWatchlist
                      ? "bg-blue-600 text-white border-blue-400"
                      : "bg-[#1f222a] text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400"
                  }`}
                  title="Want to Watch / Add to Watchlist"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Want to Watch</span>
                </button>

                {/* Watched (Green) */}
                <button
                  onClick={() => handleSwipe("watched")}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    isWatched
                      ? "bg-emerald-600 text-white border-emerald-400"
                      : "bg-[#1f222a] text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400"
                  }`}
                  title="Mark as Watched"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Watched</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MovieDetailModal;
