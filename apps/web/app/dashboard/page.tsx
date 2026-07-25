"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Clock, Mail, Package, Star } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; roles: string[] } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("fixsi_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  function logout() {
    localStorage.removeItem("fixsi_token");
    localStorage.removeItem("fixsi_user");
    router.push("/");
  }

  if (!user) return null;

  const isProfessional = user.roles?.includes("PROFESSIONAL");
  const isLocador = user.roles?.includes("LOCADOR");

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6 items-start lg:flex-row">
      {/* Sidebar */}
      <aside className="flex flex-col items-center gap-3 w-full rounded-3xl border border-orange-100 bg-white p-6 shadow-sm lg:w-56 shrink-0">
        <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold" style={{ backgroundColor: "#F97316" }}>
          {user.name?.[0]?.toUpperCase() || "U"}
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#1E3A5F" }}>
          {user.name.split(" ")[0]}
        </h2>

        <Link href="/profile" className="w-full text-center text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm" style={{ backgroundColor: "#F97316" }}>
          👁 Ver perfil
        </Link>
        <Link href="/profile/edit" className="w-full text-center text-white py-2.5 px-4 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#F97316" }}>
          ✏️ Editar perfil
        </Link>
        <button onClick={logout} className="w-full text-center text-white py-2.5 px-4 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#F97316" }}>
          Sair ➡
        </button>

        <Link href="/" className="w-full text-center text-slate-600 py-2 px-4 rounded-xl text-sm font-semibold mt-2 bg-slate-100 hover:bg-slate-200">
          Início
        </Link>
      </aside>

      {/* Card principal */}
      <section className="flex-1 w-full rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
        {/* Serviços */}
        {(isProfessional || isLocador) && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-center mb-6" style={{ color: "#F97316" }}>
              Serviços
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/dashboard/services/new" className="rounded-2xl border border-slate-100 bg-orange-50/40 p-6 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all">
                <Plus size={36} />
                <span className="text-sm font-medium text-center">Novo Serviço</span>
              </Link>
              <Link href="/dashboard/bookings" className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all">
                <Clock size={36} />
                <span className="text-sm font-medium">Agendados</span>
              </Link>
              <Link href="/dashboard/messages" className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all">
                <Mail size={36} />
                <span className="text-sm font-medium">Mensagens</span>
              </Link>
            </div>
          </div>
        )}

        {/* Histórico */}
        <div>
          <h3 className="text-xl font-bold text-center mb-6" style={{ color: "#F97316" }}>
            Histórico
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/bookings" className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all">
              <Package size={36} />
              <span className="text-sm font-medium text-center">Aluguéis e serviços</span>
            </Link>
            <Link href="/dashboard/reviews" className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all">
              <Star size={36} />
              <span className="text-sm font-medium">Avaliações</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
