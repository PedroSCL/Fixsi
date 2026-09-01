"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
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
    [completing, setCompleting] = useState<string | null>(null),
    [actionError, setActionError] = useState<string | null>(null);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUserId(data.user.id);
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
      {actionError && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          {actionError}
        </div>
      )}
      {bookings.length === 0 ? (
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
        <section className="mt-8 space-y-4">
          {bookings.map((b) => {
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
                className="surface-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
              >
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
                    {new Date(b.startDate).toLocaleDateString("pt-BR")}
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
      )}
    </main>
  );
}
