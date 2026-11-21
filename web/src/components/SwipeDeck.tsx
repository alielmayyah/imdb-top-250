"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RotateCcw,
  Check,
  Bookmark,
  X,
  Star,
  Sparkles,
  Trophy,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMovies } from "../context/MovieContext";
import { TinderCard } from "./TinderCard";
import { SwipeAction } from "../types/movie";
import { sounds } from "../lib/sounds";

export const SwipeDeck: React.FC = () => {
  const {
    deck,
    swipe,
    undo,
    history,
    stats,
    soundEnabled,
    toggleSound,
    setSelectedMovie,
    setActiveTab,
  } = useMovies();

  const [swipeDirection, setSwipeDirection] = useState<SwipeAction | null>(null);

  const topMovie = deck[0];
  const nextMovie = deck[1];
  const thirdMovie = deck[2];

  const handleSwipeAction = (action: SwipeAction) => {
    if (!topMovie) return;

    // Trigger instant sound feedback
    if (action === "watched") sounds.playSwipeRight();
    else if (action === "watchlist") sounds.playSwipeLeft();
    else if (action === "pass") sounds.playSwipeDown();
    else if (action === "superlike") sounds.playSuperLike();

    swipe(topMovie, action);
  };

  const handleButtonSwipe = (action: SwipeAction) => {
    if (!topMovie) return;
    setSwipeDirection(action);

    // Instant sound effect
    if (action === "watched") sounds.playSwipeRight();
    else if (action === "watchlist") sounds.playSwipeLeft();
    else if (action === "pass") sounds.playSwipeDown();
    else if (action === "superlike") sounds.playSuperLike();

    setTimeout(() => {
      swipe(topMovie, action);
      setSwipeDirection(null);
    }, 200);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (!topMovie) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleButtonSwipe("watched");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleButtonSwipe("watchlist");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleButtonSwipe("pass");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleButtonSwipe("superlike");
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      } else if (e.key === " ") {
        e.preventDefault();
        setSelectedMovie(topMovie);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [topMovie, undo, toggleSound]);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto h-[calc(100vh-140px)] min-h-[580px] max-h-[740px] px-4 py-2">
      {/* Top Deck Stats Pill & Sound Toggle */}
      <div className="flex items-center justify-between w-full px-2 py-1 mb-2 text-xs font-semibold text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{deck.length} remaining</span>
        </div>
        <div className="flex items-center gap-3">
          <div>
            Watched: <span className="text-emerald-400 font-bold">{stats.watchedCount}</span> / 250 ({stats.completionPercentage}%)
          </div>
          {/* Audio Mute/Unmute Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition-all ${
              soundEnabled
                ? "bg-[#18181b] border-amber-500/40 text-[#f5c518] hover:border-amber-400 hover:scale-105"
                : "bg-[#14161b] border-[#27272a] text-gray-500 hover:text-gray-400 hover:border-gray-500"
            }`}
            title={soundEnabled ? "Mute sound effects (M)" : "Enable sound effects (M)"}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Card Deck Area */}
      <div className="relative w-full flex-1 max-h-[560px]">
        {deck.length === 0 ? (
          /* Empty Deck State */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full h-full rounded-2xl bg-[#14161b] border border-[#27272a] p-8 flex flex-col items-center justify-center text-center shadow-card"
          >
            <div className="w-20 h-20 rounded-full bg-[#f5c518]/20 flex items-center justify-center mb-6 border border-[#f5c518]/30">
              <Trophy className="w-10 h-10 text-[#f5c518]" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              You Swiped All 250 Movies!
            </h3>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              You've officially classified every film in the IMDb Top 250.
              Explore your personalized lists and smart AI recommendations!
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
                <div className="text-xl font-bold text-emerald-400">{stats.watchedCount}</div>
                <div className="text-xs text-gray-400">Watched</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-blue-500/20">
                <div className="text-xl font-bold text-blue-400">{stats.watchlistCount}</div>
                <div className="text-xs text-gray-400">Want to Watch</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => setActiveTab("watchlist")}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <Bookmark className="w-4 h-4" /> View Your Watchlist
              </button>
              <button
                onClick={() => setActiveTab("suggestions")}
                className="w-full py-3 px-4 rounded-xl bg-[#f5c518] hover:bg-[#ffcf33] text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <Sparkles className="w-4 h-4" /> See Top Suggestions
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="relative w-full h-full">
            {/* 3rd Card in Stack */}
            {thirdMovie && (
              <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 rounded-2xl overflow-hidden bg-[#14161b] border border-[#27272a]"
                style={{ transform: "scale(0.88) translateY(32px)" }}
              >
                {thirdMovie.local_poster_path && (
                  <img
                    src={`/${thirdMovie.local_poster_path}`}
                    alt=""
                    className="w-full h-full object-cover filter brightness-50"
                  />
                )}
              </div>
            )}

            {/* 2nd Card in Stack */}
            {nextMovie && (
              <TinderCard
                key={nextMovie.rank}
                movie={nextMovie}
                isTop={false}
                onSwipe={() => {}}
                onOpenDetails={setSelectedMovie}
              />
            )}

            {/* Top Interactive Card */}
            <AnimatePresence>
              {topMovie && (
                <TinderCard
                  key={topMovie.rank}
                  movie={topMovie}
                  isTop={true}
                  onSwipe={handleSwipeAction}
                  onOpenDetails={setSelectedMovie}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Tinder Action Buttons Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 py-2 w-full">
        {/* Undo Button */}
        <button
          onClick={undo}
          disabled={history.length === 0}
          className={`p-3 rounded-full border transition-all transform active:scale-90 ${
            history.length > 0
              ? "bg-[#18181b] border-[#3f3f46] text-yellow-400 hover:border-yellow-400 shadow-md"
              : "bg-[#14161b] border-[#27272a] text-gray-600 cursor-not-allowed"
          }`}
          title="Undo last swipe (Backspace / Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Swipe Left: Haven't Watched / Watchlist */}
        <button
          onClick={() => handleButtonSwipe("watchlist")}
          disabled={!topMovie}
          className="p-3.5 sm:p-4 rounded-full bg-[#18181b] border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all transform active:scale-90 hover:scale-105 shadow-glow-watchlist disabled:opacity-40"
          title="Haven't Watched / Add to Watchlist (← Left Arrow)"
        >
          <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Super Like: ⭐ Center Button between Left and Down */}
        <button
          onClick={() => handleButtonSwipe("superlike")}
          disabled={!topMovie}
          className="p-3.5 sm:p-4 rounded-full bg-gradient-to-br from-cyan-950/80 via-[#18181b] to-purple-950/80 border-2 border-cyan-400/70 text-cyan-300 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.55)] transition-all transform active:scale-90 hover:scale-110 shadow-lg disabled:opacity-40 group"
          title="Super Like! (↑ Up Arrow)"
        >
          <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-cyan-400/30 text-cyan-300 group-hover:fill-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all" />
        </button>

        {/* Swipe Down: Not Interested / Pass */}
        <button
          onClick={() => handleButtonSwipe("pass")}
          disabled={!topMovie}
          className="p-3 sm:p-3.5 rounded-full bg-[#18181b] border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 hover:border-rose-400 transition-all transform active:scale-90 hover:scale-105 shadow-glow-pass disabled:opacity-40"
          title="Not Interested / Skip (↓ Down Arrow)"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Swipe Right: Watched */}
        <button
          onClick={() => handleButtonSwipe("watched")}
          disabled={!topMovie}
          className="p-3.5 sm:p-4 rounded-full bg-[#18181b] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all transform active:scale-90 hover:scale-105 shadow-glow-watched disabled:opacity-40"
          title="Watched It! (→ Right Arrow)"
        >
          <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Info / Details Button */}
        <button
          onClick={() => topMovie && setSelectedMovie(topMovie)}
          disabled={!topMovie}
          className="p-3 rounded-full bg-[#18181b] border border-[#3f3f46] text-gray-300 hover:text-[#f5c518] hover:border-[#f5c518] transition-all transform active:scale-90 disabled:opacity-40"
          title="Movie Details (Space)"
        >
          <Info className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
