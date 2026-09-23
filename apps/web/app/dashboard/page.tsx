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
import {
  api,
  clearLegacyAuthStorage,
  notifyAuthChanged,
  User,
} from "../lib/api";
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => router.replace("/login"));
  }, [router]);
  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearLegacyAuthStorage();
      notifyAuthChanged();
      router.push("/");
    }
  }
  if (!user)
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando...
      </div>
    );
  const professional = user.roles?.includes("PROFESSIONAL"),
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
    ...(professional
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
      <header className="relative overflow-hidden rounded-xl border-2 border-[#20365C] bg-[#20365C] px-7 py-8 text-white shadow-[7px_8px_0_#F0C79E] sm:px-9">
        <span className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-[34px] border-white/5" />
        <p className="eyebrow">Sua conta</p>
        <h1 className="relative mt-2 text-3xl font-extrabold tracking-[-.035em] text-white">
          Olá, {user.name.split(" ")[0]}
        </h1>
        <p className="relative mt-2 text-white/70">
          Gerencie sua atividade na Fixsi.
        </p>
      </header>
      <div className="mt-8 grid gap-7 lg:grid-cols-[280px_1fr]">
        <aside className="overflow-hidden rounded-xl border-2 border-[#20365C] bg-white shadow-[6px_7px_0_rgba(32,54,92,.1)]">
          <div className="border-b-2 border-[#20365C] bg-[#FFF0DF] p-5 lg:p-6">
            <div className="grid grid-cols-[64px_1fr] items-center gap-x-4 lg:flex lg:flex-col lg:text-center">
              <span className="row-span-2 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[#20365C] bg-[#F47A00] text-2xl font-extrabold text-white shadow-[4px_5px_0_rgba(32,54,92,.18)] lg:h-24 lg:w-24 lg:text-3xl">
                {user.name?.[0]?.toUpperCase() || "U"}
              </span>
              <h2 className="self-end break-words text-lg font-extrabold text-[#17233B] lg:mt-4 lg:self-auto lg:text-xl">
                {user.name}
              </h2>
              <p className="mt-1 self-start text-sm font-semibold text-[#667085] lg:self-auto">
                {professional ? "Profissional" : "Cliente"}
              </p>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-1 p-3 text-sm lg:block lg:space-y-1 lg:p-4 lg:text-base">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-lg border-l-4 border-[#F47A00] bg-[#FFF0DF] px-4 py-3 font-bold text-[#D96500]"
            >
              <Eye size={18} /> Ver perfil
            </Link>
            <Link
              href="/profile/edit"
              className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-[#475467] hover:bg-[#EEF2F7]"
            >
              <Pencil size={18} /> Editar perfil
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-[#475467] hover:bg-[#EEF2F7]"
            >
              <Home size={18} /> Página inicial
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-bold text-red-700 hover:bg-red-50"
            >
              <LogOut size={18} /> Sair
            </button>
          </nav>
        </aside>
        <div className="space-y-6">
          <section className="surface-card relative overflow-hidden p-6 sm:p-8">
            <span className="absolute left-0 top-0 h-full w-1.5 bg-[#F47A00]" />
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
                  className="group rounded-xl border-2 border-[#DED9D1] bg-[#FFFCF8] p-5 hover:-translate-y-1 hover:border-[#F47A00] hover:shadow-[4px_5px_0_rgba(244,122,0,.12)]"
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
