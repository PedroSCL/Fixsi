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
    <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8 items-start">
      {/* Sidebar */}
      <div className="flex flex-col items-center gap-3 w-44 shrink-0">
        <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold" style={{ backgroundColor: "#F97316" }}>
          {user.name[0].toUpperCase()}
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#1E3A5F" }}>
          {user.name.split(" ")[0]}
        </h2>

        <Link href="/profile" className="w-full text-center text-white py-2 px-4 rounded-full text-sm font-medium" style={{ backgroundColor: "#F97316" }}>
          👁 Ver perfil
        </Link>
        <Link href="/profile/edit" className="w-full text-center text-white py-2 px-4 rounded-full text-sm font-medium" style={{ backgroundColor: "#F97316" }}>
          ✏️ Editar perfil
        </Link>
        <button onClick={logout} className="w-full text-center text-white py-2 px-4 rounded-full text-sm font-medium" style={{ backgroundColor: "#F97316" }}>
          Sair ➡
        </button>

        <Link href="/" className="w-full text-center text-white py-2 px-4 rounded-lg text-sm font-medium mt-2" style={{ backgroundColor: "#555" }}>
          Início
        </Link>
      </div>

      {/* Card principal */}
      <div className="flex-1 bg-gray-100 rounded-3xl p-8">
        {/* Serviços */}
        {(isProfessional || isLocador) && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-center mb-6" style={{ color: "#F97316" }}>
              Serviços
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Link href="/dashboard/services/new" className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                <Plus size={36} />
                <span className="text-sm font-medium text-center">Novo Serviço</span>
              </Link>
              <Link href="/dashboard/bookings" className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                <Clock size={36} />
                <span className="text-sm font-medium">Agendados</span>
              </Link>
              <Link href="/dashboard/messages" className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
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
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/bookings" className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
              <Package size={36} />
              <span className="text-sm font-medium text-center">Aluguéis e serviços</span>
            </Link>
            <Link href="/dashboard/reviews" className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
              <Star size={36} />
              <span className="text-sm font-medium">Avaliações</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}