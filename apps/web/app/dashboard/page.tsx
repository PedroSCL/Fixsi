"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Drill,
  Eye,
  Home,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; roles: string[] } | null>(
    null,
  );
  useEffect(() => {
    const stored = localStorage.getItem("fixsi_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);
  function logout() {
    localStorage.removeItem("fixsi_token");
    localStorage.removeItem("fixsi_user");
    window.dispatchEvent(new Event("serveo:auth-changed"));
    router.push("/");
  }
  if (!user)
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando...
      </div>
    );
  const professional = user.roles?.includes("PROFESSIONAL"),
    locador = user.roles?.includes("LOCADOR"),
    admin = user.roles?.includes("ADMIN");
  const tiles = [
    ...(professional
      ? [
          {
            href: "/dashboard/services/new",
            label: "Publicar serviço",
            text: "Crie um novo anúncio",
            icon: Plus,
          },
        ]
      : []),
    ...(locador
      ? [
          {
            href: "/dashboard/tools/new",
            label: "Anunciar ferramenta",
            text: "Disponibilize um equipamento",
            icon: Drill,
          },
        ]
      : []),
    ...(admin
      ? [
          {
            href: "/admin",
            label: "Administração",
            text: "Modere denúncias abertas",
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      href: "/dashboard/bookings",
      label: "Agendamentos",
      text: "Acompanhe seus pedidos",
      icon: CalendarDays,
    },
    {
      href: "/dashboard/messages",
      label: "Mensagens",
      text: "Converse e negocie",
      icon: MessageCircle,
    },
  ];
  return (
    <main className="page-shell py-10">
      <header>
        <p className="eyebrow">Sua conta</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
          Olá, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-[#667085]">Gerencie sua atividade na Serveo.</p>
      </header>
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="surface-card p-6">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F97316] text-3xl font-extrabold text-white">
              {user.name?.[0]?.toUpperCase() || "U"}
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-[#17233B]">
              {user.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#667085]">
              {professional ? "Profissional" : locador ? "Locador" : "Cliente"}
            </p>
          </div>
          <nav className="mt-6 space-y-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl bg-[#FFF1E8] px-4 py-3 font-bold text-[#F97316]"
            >
              <Eye size={18} /> Ver perfil
            </Link>
            <Link
              href="/profile/edit"
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-[#475467] hover:bg-[#F1F6F5]"
            >
              <Pencil size={18} /> Editar perfil
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-[#475467] hover:bg-[#F1F6F5]"
            >
              <Home size={18} /> Página inicial
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-red-700 hover:bg-red-50"
            >
              <LogOut size={18} /> Sair
            </button>
          </nav>
        </aside>
        <div className="space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Acesso rápido</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#17233B]">
                  O que você quer fazer?
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tiles.map(({ href, label, text, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-2xl border border-[#E7E2DA] bg-[#FCFBF9] p-5 hover:-translate-y-1 hover:border-[#EFB67D] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316]">
                      <Icon size={22} />
                    </span>
                    <ChevronRight
                      size={19}
                      className="text-[#98A2B3] transition group-hover:translate-x-1 group-hover:text-[#F97316]"
                    />
                  </div>
                  <h3 className="mt-5 font-extrabold text-[#17233B]">
                    {label}
                  </h3>
                  <p className="mt-1 text-sm text-[#667085]">{text}</p>
                </Link>
              ))}
            </div>
          </section>
          <section className="surface-card p-6 sm:p-8">
            <p className="eyebrow">Histórico</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#17233B]">
              Sua jornada
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/bookings"
                className="flex items-center gap-4 rounded-2xl border border-[#E7E2DA] p-5 hover:bg-[#F8F7F4]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316]">
                  <Package size={23} />
                </span>
                <span className="flex-1">
                  <strong className="block text-[#17233B]">
                    Aluguéis e serviços
                  </strong>
                  <small className="text-[#667085]">
                    Veja todos os pedidos
                  </small>
                </span>
                <ChevronRight size={18} />
              </Link>
              <Link
                href="/dashboard/reviews"
                className="flex items-center gap-4 rounded-2xl border border-[#E7E2DA] p-5 hover:bg-[#F8F7F4]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF4D6] text-[#984B00]">
                  <Star size={23} />
                </span>
                <span className="flex-1">
                  <strong className="block text-[#17233B]">Avaliações</strong>
                  <small className="text-[#667085]">
                    Confira sua reputação
                  </small>
                </span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
