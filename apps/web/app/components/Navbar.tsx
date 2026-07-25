"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./Brand";

export function Navbar() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    function syncSession() {
      const stored = localStorage.getItem("fixsi_user");
      setUser(stored ? JSON.parse(stored) : null);
    }
    syncSession();
    setOpen(false);
    window.addEventListener("serveo:auth-changed", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("serveo:auth-changed", syncSession);
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
        className="font-bold text-[#475467] hover:text-[#F97316]"
      >
        Como funciona
      </Link>
      <Link
        href="/services"
        className="font-bold text-[#475467] hover:text-[#F97316]"
      >
        Profissionais
      </Link>
      <Link
        href="/tools"
        className="font-bold text-[#475467] hover:text-[#F97316]"
      >
        Ferramentas
      </Link>
    </>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E2DA] bg-white/95 backdrop-blur-lg">
      <div className="page-shell flex h-[72px] items-center gap-5">
        <Link href="/" aria-label="Página inicial">
          <Brand />
        </Link>
        <nav className="ml-auto hidden items-center gap-7 lg:flex">{links}</nav>
        <form
          onSubmit={submit}
          className="relative hidden w-full max-w-[260px] md:block"
        >
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F97316]"
            size={17}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar serviço"
            className="field field-with-actions h-10 rounded-full py-2 text-sm"
          />
          <button
            aria-label="Pesquisar"
            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#F97316] text-white"
          >
            <Search size={14} />
          </button>
        </form>
        {user ? (
          <Link
            href="/dashboard"
            aria-label="Abrir dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1E8] text-[#F97316] hover:bg-[#FFE2C2]"
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
          className="rounded-lg p-2 text-[#17233B] lg:hidden"
          aria-label="Abrir menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="page-shell flex flex-col gap-4 border-t border-[#E7E2DA] py-4 lg:hidden">
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
