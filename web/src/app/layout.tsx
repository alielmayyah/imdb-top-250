import type { Metadata } from "next";
import "../styles/globals.scss";

export const metadata: Metadata = {
  title: "IMDb Top 250 Tinder — Swipe & Discover Classics",
  description: "Swipe right for watched, swipe left for haven't watched, swipe down for not interested. Get smart movie suggestions and manage your Top 250 watchlist.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0c0e] text-[#f3f4f6] min-h-screen antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
