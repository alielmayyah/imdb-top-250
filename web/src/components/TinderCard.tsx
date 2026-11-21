"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Star, Clock, Info, CheckCircle2, Bookmark, XCircle, Clapperboard, Users } from "lucide-react";
import { Movie, SwipeAction } from "../types/movie";

interface TinderCardProps {
  movie: Movie;
  isTop: boolean;
  onSwipe: (action: SwipeAction) => void;
  onOpenDetails: (movie: Movie) => void;
}

export const TinderCard: React.FC<TinderCardProps> = ({
  movie,
  isTop,
  onSwipe,
  onOpenDetails,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Dynamic rotation based on horizontal drag
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);

  // Opacities for the stamps based on drag direction
  // Drag Right -> Watched (Green)
  const watchedOpacity = useTransform(x, [40, 140], [0, 1]);
  // Drag Left -> Want to Watch / Watchlist (Blue)
  const watchlistOpacity = useTransform(x, [-40, -140], [0, 1]);
  // Drag Down -> Not Interested / Pass (Red)
  const passOpacity = useTransform(y, [40, 140], [0, 1]);
  // Drag Up -> Super Like (Cyan)
  const superLikeOpacity = useTransform(y, [-40, -130], [0, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const thresholdX = 100;
    const thresholdY = 100;
    const velocityThreshold = 350;

    // Swipe Up -> Super Like
    if (info.offset.y < -thresholdY || info.velocity.y < -velocityThreshold) {
      onSwipe("superlike");
    }
    // Swipe Right -> Watched
    else if (info.offset.x > thresholdX || info.velocity.x > velocityThreshold) {
      onSwipe("watched");
    }
    // Swipe Left -> Haven't watched (Watchlist)
    else if (info.offset.x < -thresholdX || info.velocity.x < -velocityThreshold) {
      onSwipe("watchlist");
    }
    // Swipe Down -> Not Interested
    else if (info.offset.y > thresholdY || info.velocity.y > velocityThreshold) {
      onSwipe("pass");
    }
  };

  const posterSrc = movie.local_poster_path
    ? `/${movie.local_poster_path}`
    : movie.poster_url || "/placeholder.jpg";

  return (
    <motion.div
      ref={cardRef}
      className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : 0,
        rotate: isTop ? rotate : 0,
        touchAction: "none",
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={
        isTop
          ? { scale: 1, y: 0, opacity: 1 }
          : { scale: 0.94, y: 16, opacity: 0.85 }
      }
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#14161b] border border-[#27272a] shadow-card flex flex-col justify-between">
        {/* Full Card Poster Background with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={posterSrc}
            alt={movie.title}
            className="w-full h-full object-cover filter brightness-[0.92] transition-transform duration-500 hover:scale-105"
            draggable={false}
          />
          {/* Subtle vignette and bottom dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-[#0b0c0e]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        </div>

        {/* Dynamic Stamp Badges */}
        {isTop && (
          <>
            {/* SWIPE RIGHT: WATCHED */}
            <motion.div
              style={{ opacity: watchedOpacity }}
              className="stamp stamp-watched flex items-center gap-2"
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              WATCHED
            </motion.div>

            {/* SWIPE LEFT: HAVEN'T WATCHED / WATCHLIST */}
            <motion.div
              style={{ opacity: watchlistOpacity }}
              className="stamp stamp-watchlist flex items-center gap-2"
            >
              <Bookmark className="w-7 h-7 text-blue-400" />
              WANT TO WATCH
            </motion.div>

            {/* SWIPE DOWN: NOT INTERESTED */}
            <motion.div
              style={{ opacity: passOpacity }}
              className="stamp stamp-pass flex items-center gap-2"
            >
              <XCircle className="w-7 h-7 text-rose-500" />
              NOT INTERESTED
            </motion.div>

            {/* SWIPE UP: SUPER LIKE */}
            <motion.div
              style={{ opacity: superLikeOpacity }}
              className="stamp stamp-superlike flex items-center gap-2"
            >
              <Star className="w-7 h-7 text-cyan-400 fill-current" />
              SUPER LIKE
            </motion.div>
          </>
        )}

        {/* Top Floating Badge Bar */}
        <div className="relative z-10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-black/60 backdrop-blur-md border border-[#f5c518]/50 text-[#f5c518]">
              #{movie.rank} TOP 250
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/50 backdrop-blur-md border border-white/10 text-gray-300">
              {movie.certificate}
            </span>
            {movie.genres && movie.genres[0] && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-950/60 backdrop-blur-md border border-purple-500/30 text-purple-300 hidden sm:inline-block">
                {movie.genres[0]}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(movie);
            }}
            className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all transform hover:scale-110"
            title="View Details"
          >
            <Info className="w-5 h-5 text-gray-200 hover:text-[#f5c518]" />
          </button>
        </div>

        {/* Bottom Movie Details Panel */}
        <div className="relative z-10 p-5 sm:p-6 pt-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md line-clamp-2">
            {movie.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mt-2.5 text-sm font-medium text-gray-300">
            <div className="flex items-center gap-1.5 text-[#f5c518] font-bold">
              <Star className="w-4 h-4 fill-current" />
              <span>{movie.rating}</span>
              <span className="text-xs text-gray-400 font-normal">({movie.votes_display})</span>
            </div>
            <span>•</span>
            <span className="text-gray-200">{movie.year}</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-gray-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{movie.duration}</span>
            </div>
          </div>

          {/* Director & Cast Tags */}
          <div className="mt-2.5 space-y-1 text-xs text-gray-300">
            {movie.director && movie.director !== "Unknown" && (
              <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                <Clapperboard className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Dir: {movie.director}</span>
              </div>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{movie.cast.slice(0, 3).join(", ")}</span>
              </div>
            )}
          </div>

          {/* Swipe hints */}
          <div className="mt-3.5 pt-2.5 border-t border-white/10 grid grid-cols-4 text-center text-[10px] text-gray-400 font-semibold">
            <span className="text-blue-400">← Watchlist</span>
            <span className="text-cyan-400">↑ Super Like</span>
            <span className="text-rose-400">↓ Pass</span>
            <span className="text-emerald-400">Watched →</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
