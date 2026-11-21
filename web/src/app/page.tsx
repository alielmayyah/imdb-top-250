"use client";

import React from "react";
import { MovieProvider, useMovies } from "../context/MovieContext";
import { Navbar } from "../components/Navbar";
import { SwipeDeck } from "../components/SwipeDeck";
import { ListView } from "../components/ListView";
import { RecommendationsView } from "../components/RecommendationsView";
import { StatsView } from "../components/StatsView";
import { MovieDetailModal } from "../components/MovieDetailModal";

const AppContent: React.FC = () => {
  const { activeTab } = useMovies();

  return (
    <main className="flex-1 flex flex-col justify-start pb-10">
      <Navbar />

      <div className="flex-1 flex flex-col pt-2 sm:pt-4">
        {activeTab === "swipe" && <SwipeDeck />}
        {activeTab === "watchlist" && <ListView activeList="watchlist" />}
        {activeTab === "watched" && <ListView activeList="watched" />}
        {activeTab === "pass" && <ListView activeList="pass" />}
        {activeTab === "suggestions" && <RecommendationsView />}
        {activeTab === "stats" && <StatsView />}
      </div>

      <MovieDetailModal />
    </main>
  );
};

export default function Home() {
  return (
    <MovieProvider>
      <AppContent />
    </MovieProvider>
  );
}
