"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageCircle,
  Package,
  Star,
} from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
interface Booking {
  id: string;
  clientId: string;
  status: string;
  startDate: string;
  providerCompletedAt?: string | null;
  service?: { id: string; title: string; category: string; userId: string };
  tool?: { id: string; title: string; category: string; userId: string };
  proposal?: { amount: number; status: string } | null;
  conversation: { id: string };
  client?: { id: string; name: string; avatarUrl?: string | null };
  provider?: { id: string; name: string; avatarUrl?: string | null };
}
const STATUS: Record<string, { label: string; classes: string }> = {
  PENDING: {
    label: "Aguardando profissional",
    classes: "bg-amber-50 text-amber-800",
  },
  CONFIRMED: { label: "Confirmado", classes: "bg-blue-50 text-blue-700" },
  IN_PROGRESS: { label: "Em andamento", classes: "bg-blue-50 text-blue-700" },
  COMPLETED: { label: "Concluído", classes: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Cancelado", classes: "bg-red-50 text-red-700" },
  DISPUTED: { label: "Em disputa", classes: "bg-red-50 text-red-700" },
};
export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true),
    [professional, setProfessional] = useState(false),
    [view, setView] = useState<"all" | "client" | "provider">("all"),
    [calendarMonth, setCalendarMonth] = useState(() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }),
    [completing, setCompleting] = useState<string | null>(null),
    [actionError, setActionError] = useState<string | null>(null);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUserId(data.user.id);
        setProfessional(data.user.roles?.includes("PROFESSIONAL"));
        return load();
      })
      .catch(() => router.replace("/login"));
  }, [router]);
  async function load() {
    try {
      setBookings((await api.get("/bookings")).data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function finish(id: string) {
    setCompleting(id);
    setActionError(null);
    try {
      await api.patch(`/bookings/${id}/finish`);
      await load();
    } catch (err: unknown) {
      setActionError(apiErrorMessage(err, "Não foi possível finalizar"));
    } finally {
      setCompleting(null);
    }
  }
  async function start(id: string) {
    setCompleting(id);
    setActionError(null);
    try {
      await api.patch(`/bookings/${id}/start`);
      await load();
    } catch (err: unknown) {
      setActionError(
        apiErrorMessage(err, "Não foi possível iniciar o serviço"),
      );
    } finally {
      setCompleting(null);
    }
  }
  async function confirmCompletion(id: string) {
    setCompleting(id);
    setActionError(null);
    try {
      await api.patch(`/bookings/${id}/complete`);
      await load();
    } catch (err: unknown) {
      setActionError(
        apiErrorMessage(err, "Não foi possível confirmar a conclusão"),
      );
    } finally {
      setCompleting(null);
    }
  }
  const title = (b: Booking) => b.service?.title || b.tool?.title || "Pedido";
  const visibleBookings = bookings.filter((booking) => {
    if (view === "client") return booking.clientId === userId;
    if (view === "provider") {
      return (
        booking.service?.userId === userId || booking.tool?.userId === userId
      );
    }
    return true;
  });
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarDays = new Date(
    calendarYear,
    calendarMonthIndex + 1,
    0,
  ).getDate();
  const leadingDays = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const calendarCells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: calendarDays }, (_, index) => index + 1),
  ];
  const bookingsByDay = visibleBookings.reduce<Record<number, Booking[]>>(
    (grouped, booking) => {
      const date = new Date(booking.startDate);
      if (
        date.getUTCFullYear() === calendarYear &&
        date.getUTCMonth() === calendarMonthIndex &&
        booking.status !== "CANCELLED"
      ) {
        const day = date.getUTCDate();
        grouped[day] = [...(grouped[day] || []), booking];
      }
      return grouped;
    },
    {},
  );
  if (loading)
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando agendamentos...
      </div>
    );
  return (
    <main className="page-shell max-w-5xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>
      <header className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Seus pedidos</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
            Agendamentos
          </h1>
          <p className="mt-2 text-[#667085]">
            Acompanhe serviços e aluguéis em um só lugar.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#FFF1E8] px-4 py-2 text-sm font-extrabold text-[#F97316]">
          <CalendarDays size={17} />
          {bookings.length} {bookings.length === 1 ? "pedido" : "pedidos"}
        </span>
      </header>
      {professional && (
        <div className="mt-6 inline-flex rounded-xl border border-[#DED9D1] bg-white p-1">
          {(
            [
              ["all", "Todos"],
              ["client", "Como cliente"],
              ["provider", "Como profissional"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`rounded-lg px-4 py-2 text-sm font-extrabold ${
                view === value
                  ? "bg-[#F47A00] text-white"
                  : "text-[#667085] hover:bg-[#FFF1E8]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          {actionError}
        </div>
      )}
      {visibleBookings.length === 0 ? (
        <section className="surface-card mt-8 p-12 text-center">
          <Package className="mx-auto text-[#F97316]" size={38} />
          <h2 className="mt-4 text-xl font-extrabold text-[#17233B]">
            Você ainda não tem pedidos
          </h2>
          <p className="mt-2 text-[#667085]">
            Encontre um profissional e solicite seu primeiro orçamento.
          </p>
          <Link href="/services" className="btn-primary mt-6">
            Ver profissionais
          </Link>
        </section>
      ) : (
        <>
          <section className="surface-card mt-8 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarYear, calendarMonthIndex - 1, 1),
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#FFF1E8]"
              >
                <ChevronLeft size={19} />
              </button>
              <h2 className="capitalize font-extrabold text-[#17233B]">
                {calendarMonth.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarYear, calendarMonthIndex + 1, 1),
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#FFF1E8]"
              >
                <ChevronRight size={19} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 text-center text-xs font-bold text-[#7B8290]">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <span key={day} className="py-2">
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} />;
                const events = bookingsByDay[day] || [];
                return (
                  <div
                    key={day}
                    className={`min-h-14 rounded-lg border p-1.5 sm:min-h-20 sm:p-2 ${
                      events.length
                        ? "border-[#F0C79E] bg-[#FFF8F0]"
                        : "border-[#EEEAE4] bg-white"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#667085]">
                      {day}
                    </span>
                    {events.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        title={title(event)}
                        className="mt-1 block truncate rounded bg-[#F47A00] px-1.5 py-1 text-[9px] font-bold text-white sm:text-[11px]"
                      >
                        {title(event)}
                      </span>
                    ))}
                    {events.length > 2 && (
                      <small className="mt-1 block text-[9px] font-bold text-[#D96500]">
                        +{events.length - 2}
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8 space-y-4">
            {visibleBookings.map((b) => {
              const isClient = b.clientId === userId;
              const isProvider =
                b.service?.userId === userId || b.tool?.userId === userId;
              const status = STATUS[b.status] || {
                label: b.status,
                classes: "bg-slate-100 text-slate-700",
              };
              return (
                <article
                  key={b.id}
                  className="surface-card relative flex flex-col gap-5 overflow-hidden p-5 pl-7 sm:flex-row sm:items-center"
                >
                  <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#F47A00]" />
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1E8] text-[#F97316]">
                    <Package size={24} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-extrabold text-[#17233B]">
                        {title(b)}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#667085]">
                      Agendado para{" "}
                      {new Date(b.startDate).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-[#667085]">
                      {isClient
                        ? `Profissional: ${b.provider?.name || "não informado"}`
                        : `Cliente: ${b.client?.name || "não informado"}`}
                    </p>
                    {b.proposal && (
                      <p className="mt-1 text-sm font-extrabold text-[#F97316]">
                        Proposta: R$ {Number(b.proposal.amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/messages"
                      className="btn-secondary min-h-10 px-3 py-2"
                      title="Abrir conversa"
                    >
                      <MessageCircle size={18} />
                      <span className="hidden xl:inline">Mensagem</span>
                    </Link>
                    {b.status === "CONFIRMED" && isProvider && (
                      <button
                        onClick={() => start(b.id)}
                        disabled={completing === b.id}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#20365C] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                      >
                        <Clock3 size={17} />
                        {completing === b.id
                          ? "Iniciando..."
                          : "Iniciar serviço"}
                      </button>
                    )}
                    {b.status === "CONFIRMED" && isClient && (
                      <span className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                        Serviço confirmado
                      </span>
                    )}
                    {b.status === "IN_PROGRESS" &&
                      isProvider &&
                      !b.providerCompletedAt && (
                        <button
                          onClick={() => finish(b.id)}
                          disabled={completing === b.id}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                        >
                          <CheckCircle2 size={17} />
                          {completing === b.id
                            ? "Finalizando..."
                            : "Finalizar serviço"}
                        </button>
                      )}
                    {b.status === "IN_PROGRESS" &&
                      isProvider &&
                      b.providerCompletedAt && (
                        <span className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                          Aguardando confirmação do cliente
                        </span>
                      )}
                    {b.status === "IN_PROGRESS" &&
                      isClient &&
                      b.providerCompletedAt && (
                        <button
                          onClick={() => confirmCompletion(b.id)}
                          disabled={completing === b.id}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                        >
                          <CheckCircle2 size={17} />
                          {completing === b.id
                            ? "Confirmando..."
                            : "Confirmar conclusão"}
                        </button>
                      )}
                    {b.status === "IN_PROGRESS" &&
                      isClient &&
                      !b.providerCompletedAt && (
                        <span className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                          Serviço em andamento
                        </span>
                      )}
                    {b.status === "COMPLETED" && (
                      <Link
                        href={`/dashboard/bookings/${b.id}/review`}
                        className="btn-primary min-h-10 px-4 py-2 text-sm"
                      >
                        <Star size={16} /> Avaliar
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
