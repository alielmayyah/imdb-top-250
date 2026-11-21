"use client";

import React from "react";
import {
  Flame,
  Bookmark,
  CheckCircle2,
  Sparkles,
  BarChart3,
  RotateCcw,
  Volume2,
  VolumeX,
  Star
} from "lucide-react";
import { useMovies } from "../context/MovieContext";

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, stats, resetAll, soundEnabled, toggleSound } = useMovies();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0c0e]/90 backdrop-blur-md border-b border-[#242731]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveTab("swipe")}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f5c518] to-amber-500 flex items-center justify-center shadow-lg shadow-[#f5c518]/20 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 text-black fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-white">IMDb</span>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-[#f5c518] to-orange-400 bg-clip-text text-transparent">
                Tinder
              </span>
            </div>
            <div className="text-[10px] text-gray-400 tracking-wider uppercase font-semibold">
              Top 250 Classifier
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Deck Tab */}
          <button
            onClick={() => setActiveTab("swipe")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "swipe"
                ? "bg-[#f5c518] text-black shadow-md shadow-[#f5c518]/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Discover</span>
            {stats.unswipedCount > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "swipe" ? "bg-black/20 text-black" : "bg-[#27272a] text-gray-300"
              }`}>
                {stats.unswipedCount}
              </span>
            )}
          </button>

          {/* Watchlist Tab (Haven't seen) */}
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "watchlist"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">Watchlist</span>
            {stats.watchlistCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-blue-500/30 text-blue-200">
                {stats.watchlistCount}
              </span>
            )}
          </button>

          {/* Watched Tab */}
          <button
            onClick={() => setActiveTab("watched")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "watched"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Watched</span>
            {stats.watchedCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/30 text-emerald-200">
                {stats.watchedCount}
              </span>
            )}
          </button>

          {/* AI Suggestions Tab */}
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "suggestions"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span className="hidden md:inline">Picks</span>
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "stats"
                ? "bg-zinc-800 text-white border border-zinc-700"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Stats</span>
          </button>
        </nav>

        {/* Right Section: Progress & Sound & Reset */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled
                ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
            title={soundEnabled ? "Sound Effects Enabled (Click to mute)" : "Sound Effects Muted (Click to enable)"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="text-right">
            <div className="text-xs font-bold text-gray-300 flex items-center justify-end gap-1.5">
              <span>{stats.watchedCount} / 250 Watched</span>
              {stats.superLikeCount > 0 && (
                <span className="text-cyan-400 flex items-center gap-0.5 text-[11px]">
                  <Star className="w-3 h-3 fill-current" /> {stats.superLikeCount}
                </span>
              )}
            </div>
            <div className="w-28 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#f5c518] transition-all duration-500"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={resetAll}
            className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Reset All Progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
