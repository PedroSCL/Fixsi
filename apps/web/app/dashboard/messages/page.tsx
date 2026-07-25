"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
}
interface Conversation {
  id: string;
  booking: {
    id: string;
    status: string;
    service?: { title: string };
    tool?: { title: string };
  };
  messages: Message[];
  proposals: { id: string; amount: number; status: string; senderId: string }[];
}
interface Booking {
  id: string;
  status: string;
  service?: { id: string; title: string; category: string };
  tool?: { id: string; title: string; category: string };
  conversation: { id: string };
}
export default function MessagesPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]),
    [selected, setSelected] = useState<Conversation | null>(null),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stored = localStorage.getItem("fixsi_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUserId(JSON.parse(stored).id);
    load();
  }, [router]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);
  async function load() {
    try {
      setBookings((await api.get("/bookings")).data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function open(id: string) {
    try {
      setSelected((await api.get(`/conversations/${id}`)).data.conversation);
    } catch (err) {
      console.error(err);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !selected) return;
    setSending(true);
    try {
      const sent = (
        await api.post(`/conversations/${selected.id}/messages`, {
          content: message.trim(),
        })
      ).data.message;
      setSelected((p) => (p ? { ...p, messages: [...p.messages, sent] } : p));
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }
  async function proposal(amount: number) {
    if (!selected) return;
    try {
      await api.post(`/bookings/${selected.booking.id}/proposals`, {
        amount,
        description: "Proposta de orçamento",
      });
      await open(selected.id);
    } catch (err: unknown) {
      alert(apiErrorMessage(err, "Não foi possível enviar a proposta"));
    }
  }
  async function accept(id: string) {
    if (!selected) return;
    try {
      await api.patch(
        `/bookings/${selected.booking.id}/proposals/${id}/accept`,
      );
      await open(selected.id);
      await load();
    } catch (err: unknown) {
      alert(apiErrorMessage(err, "Não foi possível aceitar a proposta"));
    }
  }
  const title = (b: Booking) => b.service?.title || b.tool?.title || "Conversa";
  const status = (value: string) =>
    ({
      PENDING: "Pendente",
      AWAITING_PAYMENT: "Aguardando pagamento",
      PAID: "Pago",
      IN_PROGRESS: "Em andamento",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
    })[value] || value;
  if (loading)
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando mensagens...
      </div>
    );
  return (
    <main className="page-shell py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>
      <header className="mt-7">
        <p className="eyebrow">Conversas e propostas</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
          Mensagens
        </h1>
      </header>
      <section className="surface-card mt-7 flex h-[640px] overflow-hidden">
        <aside
          className={`${selected ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-[#E7E2DA] md:w-80`}
        >
          <div className="border-b border-[#E7E2DA] bg-[#F5F2ED] p-5">
            <h2 className="font-extrabold text-[#17233B]">Suas conversas</h2>
            <p className="mt-1 text-sm text-[#667085]">
              {bookings.length}{" "}
              {bookings.length === 1 ? "conversa" : "conversas"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="p-7 text-center">
                <MessageCircle className="mx-auto text-[#F97316]" size={28} />
                <p className="mt-3 text-sm text-[#667085]">
                  Nenhuma conversa ainda.
                </p>
                <Link
                  href="/services"
                  className="mt-2 inline-block text-sm font-extrabold text-[#F97316]"
                >
                  Ver profissionais
                </Link>
              </div>
            ) : (
              bookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => open(b.conversation.id)}
                  className={`w-full border-b border-[#EEEAE4] p-4 text-left ${selected?.booking.id === b.id ? "bg-[#FFF1E8]" : "hover:bg-[#F8F7F4]"}`}
                >
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F97316] font-extrabold text-white">
                      {title(b)[0]?.toUpperCase() || "?"}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-[#17233B]">
                        {title(b)}
                      </strong>
                      <small className="mt-1 block font-bold text-[#F97316]">
                        {status(b.status)}
                      </small>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
        {selected ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E2DA] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-2 text-[#667085] md:hidden"
                >
                  <ArrowLeft size={19} />
                </button>
                <div>
                  <h2 className="font-extrabold text-[#17233B]">
                    {selected.booking.service?.title ||
                      selected.booking.tool?.title}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-[#F97316]">
                    {status(selected.booking.status)}
                  </p>
                </div>
              </div>
              {selected.proposals
                .filter((p) => p.status === "PENDING")
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl bg-[#FFF9EA] px-4 py-2"
                  >
                    <span>
                      <small className="block text-[#667085]">Proposta</small>
                      <strong className="text-[#984B00]">
                        R$ {Number(p.amount).toFixed(2)}
                      </strong>
                    </span>
                    {p.senderId !== userId && (
                      <button
                        onClick={() => accept(p.id)}
                        className="rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-extrabold text-white"
                      >
                        Aceitar
                      </button>
                    )}
                  </div>
                ))}
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F8F7F4] p-4 sm:p-5">
              {selected.messages.length === 0 ? (
                <div className="m-auto text-center">
                  <MessageCircle className="mx-auto text-[#9DB1AE]" size={28} />
                  <p className="mt-2 text-sm text-[#667085]">
                    Diga olá para começar a conversa.
                  </p>
                </div>
              ) : (
                selected.messages.map((item) => {
                  const mine = item.sender.id === userId;
                  return (
                    <div
                      key={item.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-sm ${mine ? "rounded-br-md bg-[#F97316] text-white" : "rounded-bl-md border border-[#E7E2DA] bg-white text-[#17233B]"}`}
                      >
                        {!mine && (
                          <strong className="mb-1 block text-xs text-[#F97316]">
                            {item.sender.name}
                          </strong>
                        )}
                        {item.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={end} />
            </div>
            <footer className="border-t border-[#E7E2DA] bg-white p-4">
              <form onSubmit={send} className="flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem"
                  className="field min-w-0 flex-1"
                />
                <button
                  disabled={sending || !message.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F97316] text-white disabled:opacity-50"
                  aria-label="Enviar"
                >
                  <Send size={18} />
                </button>
              </form>
              {selected.booking.status === "PENDING" && (
                <button
                  onClick={() => {
                    const value = prompt("Valor da proposta (R$):");
                    if (value && !isNaN(Number(value))) proposal(Number(value));
                  }}
                  className="mt-3 w-full rounded-xl border border-[#EFB67D] py-2.5 text-sm font-extrabold text-[#F97316] hover:bg-[#FFF1E8]"
                >
                  Enviar proposta de orçamento
                </button>
              )}
            </footer>
          </div>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center bg-[#F8F7F4] text-center md:flex">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1E8] text-[#F97316]">
              <MessageCircle size={28} />
            </span>
            <h2 className="mt-4 font-extrabold text-[#17233B]">
              Selecione uma conversa
            </h2>
            <p className="mt-1 text-sm text-[#667085]">
              As mensagens aparecerão aqui.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
