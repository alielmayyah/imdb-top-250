"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { Movie, SwipeAction, SwipeHistoryItem, TasteProfile } from "../types/movie";
import { getTasteProfile } from "../lib/recommendation";
import { sounds } from "../lib/sounds";
import rawMoviesData from "../data/movies.json";

interface MovieContextType {
  allMovies: Movie[];
  deck: Movie[];
  watched: Movie[];
  watchlist: Movie[];
  passed: Movie[];
  history: SwipeHistoryItem[];
  superLikedRanks: Set<number>;
  tasteProfile: TasteProfile;
  soundEnabled: boolean;
  toggleSound: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedMovie: Movie | null;
  setSelectedMovie: (movie: Movie | null) => void;
  swipe: (movie: Movie, action: SwipeAction) => void;
  undo: () => void;
  moveMovie: (movie: Movie, toAction: SwipeAction | "unswiped") => void;
  resetAll: () => void;
  stats: {
    total: number;
    watchedCount: number;
    watchlistCount: number;
    passedCount: number;
    unswipedCount: number;
    superLikeCount: number;
    completionPercentage: number;
  };
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

const STORAGE_KEY = "imdb_tinder_state_v2";

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const allMovies = rawMoviesData as Movie[];

  const [deck, setDeck] = useState<Movie[]>(allMovies);
  const [watched, setWatched] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [passed, setPassed] = useState<Movie[]>([]);
  const [history, setHistory] = useState<SwipeHistoryItem[]>([]);
  const [superLikedRanks, setSuperLikedRanks] = useState<Set<number>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("swipe");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const watchedList: Movie[] = parsed.watched || [];
        const watchlistList: Movie[] = parsed.watchlist || [];
        const passedList: Movie[] = parsed.passed || [];
        const historyList: SwipeHistoryItem[] = parsed.history || [];
        const superLikes: number[] = parsed.superLikes || [];

        const swipedRanks = new Set([
          ...watchedList.map((m) => m.rank),
          ...watchlistList.map((m) => m.rank),
          ...passedList.map((m) => m.rank),
        ]);

        const remainingDeck = allMovies.filter((m) => !swipedRanks.has(m.rank));

        setWatched(watchedList);
        setWatchlist(watchlistList);
        setPassed(passedList);
        setHistory(historyList);
        setSuperLikedRanks(new Set(superLikes));
        setDeck(remainingDeck);
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const state = {
        watched,
        watchlist,
        passed,
        history,
        superLikes: Array.from(superLikedRanks),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [watched, watchlist, passed, history, superLikedRanks, isLoaded]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      sounds.enabled = !prev;
      return !prev;
    });
  };

  const triggerMilestoneConfetti = (count: number) => {
    if ([10, 25, 50, 100, 150, 200, 250].includes(count)) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f5c518", "#10b981", "#3b82f6", "#a855f7", "#ffffff"],
      });
    }
  };

  const swipe = (movie: Movie, action: SwipeAction) => {
    // Sound trigger
    if (action === "watched") sounds.playSwipeRight();
    else if (action === "watchlist") sounds.playSwipeLeft();
    else if (action === "pass") sounds.playSwipeDown();
    else if (action === "superlike") sounds.playSuperLike();

    // Remove from deck
    setDeck((prev) => prev.filter((m) => m.rank !== movie.rank));

    if (action === "superlike") {
      setSuperLikedRanks((prev) => new Set([...prev, movie.rank]));
      setWatched((prev) => {
        const updated = [movie, ...prev.filter((m) => m.rank !== movie.rank)];
        triggerMilestoneConfetti(updated.length);
        return updated;
      });
      // Superlike celebration confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#38bdf8", "#818cf8", "#f5c518"],
      });
    } else if (action === "watched") {
      setWatched((prev) => {
        const updated = [movie, ...prev.filter((m) => m.rank !== movie.rank)];
        triggerMilestoneConfetti(updated.length);
        return updated;
      });
    } else if (action === "watchlist") {
      setWatchlist((prev) => [movie, ...prev.filter((m) => m.rank !== movie.rank)]);
    } else if (action === "pass") {
      setPassed((prev) => [movie, ...prev.filter((m) => m.rank !== movie.rank)]);
    }

    setHistory((prev) => [{ movie, action, timestamp: Date.now() }, ...prev]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const [lastAction, ...restHistory] = history;
    const { movie, action } = lastAction;

    if (action === "watched" || action === "superlike") {
      setWatched((prev) => prev.filter((m) => m.rank !== movie.rank));
      if (action === "superlike") {
        setSuperLikedRanks((prev) => {
          const next = new Set(prev);
          next.delete(movie.rank);
          return next;
        });
      }
    } else if (action === "watchlist") {
      setWatchlist((prev) => prev.filter((m) => m.rank !== movie.rank));
    } else if (action === "pass") {
      setPassed((prev) => prev.filter((m) => m.rank !== movie.rank));
    }

    setDeck((prev) => [movie, ...prev.filter((m) => m.rank !== movie.rank)]);
    setHistory(restHistory);
  };

  const moveMovie = (movie: Movie, toAction: SwipeAction | "unswiped") => {
    setWatched((prev) => prev.filter((m) => m.rank !== movie.rank));
    setWatchlist((prev) => prev.filter((m) => m.rank !== movie.rank));
    setPassed((prev) => prev.filter((m) => m.rank !== movie.rank));
    setDeck((prev) => prev.filter((m) => m.rank !== movie.rank));

    if (toAction === "unswiped") {
      setDeck((prev) => [movie, ...prev]);
      setSuperLikedRanks((prev) => {
        const next = new Set(prev);
        next.delete(movie.rank);
        return next;
      });
    } else if (toAction === "watched") {
      setWatched((prev) => [movie, ...prev]);
    } else if (toAction === "superlike") {
      setSuperLikedRanks((prev) => new Set([...prev, movie.rank]));
      setWatched((prev) => [movie, ...prev]);
    } else if (toAction === "watchlist") {
      setWatchlist((prev) => [movie, ...prev]);
    } else if (toAction === "pass") {
      setPassed((prev) => [movie, ...prev]);
    }
  };

  const resetAll = () => {
    if (window.confirm("Are you sure you want to reset your swipe progress and start over?")) {
      setWatched([]);
      setWatchlist([]);
      setPassed([]);
      setHistory([]);
      setSuperLikedRanks(new Set());
      setDeck(allMovies);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const tasteProfile = useMemo(() => {
    return getTasteProfile(watched, superLikedRanks);
  }, [watched, superLikedRanks]);

  const completionPercentage = Math.round((watched.length / allMovies.length) * 100);

  const stats = {
    total: allMovies.length,
    watchedCount: watched.length,
    watchlistCount: watchlist.length,
    passedCount: passed.length,
    unswipedCount: deck.length,
    superLikeCount: superLikedRanks.size,
    completionPercentage,
  };

  return (
    <MovieContext.Provider
      value={{
        allMovies,
        deck,
        watched,
        watchlist,
        passed,
        history,
        superLikedRanks,
        tasteProfile,
        soundEnabled,
        toggleSound,
        activeTab,
        setActiveTab,
        selectedMovie,
        setSelectedMovie,
        swipe,
        undo,
        moveMovie,
        resetAll,
        stats,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error("useMovies must be used within a MovieProvider");
  }
  return context;
};
