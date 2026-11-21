import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h2 className="text-3xl font-bold text-white mb-2">404 - Page Not Found</h2>
      <p className="text-gray-400 mb-6">Could not find requested resource</p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#f5c518] text-black font-semibold rounded-lg hover:bg-[#e0b415] transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
