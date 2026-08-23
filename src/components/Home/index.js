"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4">
      <div className="text-center animate-fadeIn">
        
        {/* Logo / Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg mb-6">
          Bravebison Image Resizer
        </h1>

        <p className="text-gray-300 text-lg md:text-xl max-w-lg mx-auto mb-10">
          Choose how you want to get started — login if you already have an account or register to create a new one.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/login"
            className="w-48 py-3 text-center rounded-xl bg-white text-black font-semibold shadow-lg hover:bg-gray-100 transition-all duration-200"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="w-48 py-3 text-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold shadow-lg hover:opacity-90 transition-all duration-200"
          >
            Register
          </Link>
        </div>
      </div>

      {/* Minimal background decoration */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-2xl animate-pulse" />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
