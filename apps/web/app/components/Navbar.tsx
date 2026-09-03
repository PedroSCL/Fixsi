"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./Brand";
import { api, User } from "../lib/api";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    function syncSession() {
      api
        .get("/auth/me")
        .then(({ data }) => setUser(data.user))
        .catch(() => setUser(null));
    }
    syncSession();
    setOpen(false);
    window.addEventListener("fixsi:auth-changed", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("fixsi:auth-changed", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [pathname]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim())
      router.push(`/services?search=${encodeURIComponent(search.trim())}`);
  }
  const links = (
    <>
      <Link
        href="/#como-funciona"
        className={`nav-link ${pathname === "/" ? "nav-link-active" : ""}`}
      >
        Como funciona
      </Link>
      <Link
        href="/services"
        className={`nav-link ${pathname.startsWith("/services") ? "nav-link-active" : ""}`}
      >
        Serviços
      </Link>
      <Link
        href="/tools"
        className={`nav-link ${pathname.startsWith("/tools") ? "nav-link-active" : ""}`}
      >
        Ferramentas
      </Link>
    </>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-[#DED9D1] border-t-[3px] border-t-[#F47A00] bg-white/95 backdrop-blur-lg">
      <div className="page-shell flex h-[82px] items-center gap-5">
        <Link
          href="/"
          aria-label="Página inicial"
          className="shrink-0 rounded-lg px-1"
        >
          <Brand />
        </Link>
        <nav className="ml-auto hidden items-center gap-1 lg:flex">{links}</nav>
        <form
          onSubmit={submit}
          className="relative hidden w-full max-w-[285px] md:block lg:ml-3"
        >
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F97316]"
            size={17}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar serviço"
            className="field field-with-actions h-11 rounded-lg border-[#F0B878] bg-[#FFF9F1] py-2 text-sm"
          />
          <button
            aria-label="Pesquisar"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-[#F47A00] text-white"
          >
            <Search size={14} />
          </button>
        </form>
        {user ? (
          <Link
            href="/dashboard"
            aria-label="Abrir dashboard"
            className="relative flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#20365C] bg-white text-[#20365C] hover:border-[#F47A00] hover:text-[#F47A00] after:absolute after:-right-1 after:-top-1 after:h-3 after:w-3 after:rounded-full after:border-2 after:border-white after:bg-[#F47A00]"
          >
            <UserRound size={24} />
          </Link>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="btn-secondary min-h-10 px-4 py-2 text-sm"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="btn-primary min-h-10 px-4 py-2 text-sm"
            >
              Criar conta
            </Link>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="ml-auto rounded-lg border border-[#DED9D1] p-2 text-[#17233B] lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="page-shell mb-3 flex flex-col gap-4 rounded-xl border border-[#DED9D1] bg-white p-4 shadow-[4px_5px_0_rgba(32,54,92,.08)] lg:hidden">
          <form onSubmit={submit} className="relative md:hidden">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F97316]"
              size={17}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar serviço"
              className="field field-with-leading"
            />
          </form>
          {links}
          {!user && (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login" className="btn-secondary">
                Entrar
              </Link>
              <Link href="/register" className="btn-primary">
                Criar conta
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
