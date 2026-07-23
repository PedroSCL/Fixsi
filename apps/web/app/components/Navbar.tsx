"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("fixsi_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/services?search=${encodeURIComponent(search)}`);
    }
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold" style={{ color: "#1E3A5F" }}>
            🏠 Fixsi
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#como-funciona" className="font-medium hover:opacity-80" style={{ color: "#1E3A5F" }}>
            Como funciona
          </Link>
          <Link href="/services" className="font-medium hover:opacity-80" style={{ color: "#1E3A5F" }}>
            Serviços
          </Link>
        </div>

        {/* Busca */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden md:flex">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Pesquisar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full bg-gray-100 text-sm focus:outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* Usuário */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: "#F97316" }}>
                {user?.name[0].toUpperCase()}
              </div>
            </Link>
          ) : (
            <Link href="/login">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
                <User size={20} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}