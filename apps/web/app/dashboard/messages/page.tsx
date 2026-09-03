"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  Check,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
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
    clientId: string;
    service?: { title: string; userId: string };
    tool?: { title: string; userId: string };
  };
  messages: Message[];
  proposals: {
    id: string;
    amount: number;
    description?: string;
    status: string;
    senderId: string;
  }[];
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
    [proposalOpen, setProposalOpen] = useState(false),
    [proposalAmount, setProposalAmount] = useState(""),
    [proposalDescription, setProposalDescription] = useState(""),
    [proposalSending, setProposalSending] = useState(false),
    [proposalError, setProposalError] = useState(""),
    [proposalSuccess, setProposalSuccess] = useState(""),
    [acceptingProposalId, setAcceptingProposalId] = useState(""),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUserId(data.user.id);
        return load();
      })
      .catch(() => router.replace("/login"));
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
      setProposalOpen(false);
      setProposalAmount("");
      setProposalDescription("");
      setProposalError("");
      setProposalSuccess("");
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
  async function proposal(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;

    const amount = Number(proposalAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setProposalError("Informe um valor maior que zero.");
      return;
    }

    setProposalSending(true);
    setProposalError("");
    setProposalSuccess("");
    try {
      const { data } = await api.post(
        `/bookings/${selected.booking.id}/proposals`,
        {
          amount,
          description: proposalDescription.trim() || "Proposta de orçamento",
        },
      );

      setSelected((current) =>
        current
          ? { ...current, proposals: [data.proposal, ...current.proposals] }
          : current,
      );
      setProposalAmount("");
      setProposalDescription("");
      setProposalOpen(false);
      setProposalSuccess("Proposta enviada com sucesso.");
    } catch (err: unknown) {
      setProposalError(
        apiErrorMessage(err, "Não foi possível enviar a proposta."),
      );
    } finally {
      setProposalSending(false);
    }
  }

  async function accept(id: string) {
    if (!selected) return;

    setAcceptingProposalId(id);
    setProposalError("");
    setProposalSuccess("");
    try {
      await api.patch(
        `/bookings/${selected.booking.id}/proposals/${id}/accept`,
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              booking: { ...current.booking, status: "IN_PROGRESS" },
              proposals: current.proposals.map((item) => ({
                ...item,
                status:
                  item.id === id
                    ? "ACCEPTED"
                    : item.status === "PENDING"
                      ? "REJECTED"
                      : item.status,
              })),
            }
          : current,
      );
      setBookings((current) =>
        current.map((booking) =>
          booking.id === selected.booking.id
            ? { ...booking, status: "IN_PROGRESS" }
            : booking,
        ),
      );
      setProposalSuccess("Proposta aceita. O serviço está em andamento.");

      // A mutação já foi concluída. Uma eventual falha de sincronização não
      // deve ser apresentada como falha ao aceitar a proposta.
      void load();
    } catch (err: unknown) {
      setProposalError(
        apiErrorMessage(err, "Não foi possível aceitar a proposta."),
      );
    } finally {
      setAcceptingProposalId("");
    }
  }
  const title = (b: Booking) => b.service?.title || b.tool?.title || "Conversa";
  const status = (value: string) =>
    ({
      PENDING: "Pendente",
      IN_PROGRESS: "Em andamento",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
    })[value] || value;
  const isProvider =
    selected?.booking.service?.userId === userId ||
    selected?.booking.tool?.userId === userId;
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
      <section className="mt-7 flex h-[640px] overflow-hidden rounded-xl border-2 border-[#20365C] bg-white shadow-[7px_8px_0_rgba(32,54,92,.1)]">
        <aside
          className={`${selected ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-[#E7E2DA] md:w-80`}
        >
          <div className="border-b-2 border-[#20365C] bg-[#20365C] p-5 text-white">
            <h2 className="font-extrabold text-white">Suas conversas</h2>
            <p className="mt-1 text-sm text-white/80">
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
                        disabled={Boolean(acceptingProposalId)}
                        className="rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-extrabold text-white"
                      >
                        {acceptingProposalId === p.id
                          ? "Aceitando..."
                          : "Aceitar"}
                      </button>
                    )}
                  </div>
                ))}
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#EEF2F7] p-4 sm:p-5">
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
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-sm ${mine ? "rounded-br-md bg-[#20365C] text-white" : "rounded-bl-md border border-[#E7E2DA] bg-white text-[#17233B]"}`}
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
              {(proposalError || proposalSuccess) && (
                <div
                  role={proposalError ? "alert" : "status"}
                  className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    proposalError
                      ? "bg-[#FEF0EE] text-[#B42318]"
                      : "bg-[#ECFDF3] text-[#027A48]"
                  }`}
                >
                  {proposalError ? (
                    <X className="mt-0.5 shrink-0" size={16} />
                  ) : (
                    <Check className="mt-0.5 shrink-0" size={16} />
                  )}
                  <span>{proposalError || proposalSuccess}</span>
                </div>
              )}
              {proposalOpen && isProvider && (
                <form
                  onSubmit={proposal}
                  className="mb-3 rounded-2xl border border-[#F4C99F] bg-[#FFF9F3] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-extrabold text-[#17233B]">
                        <BadgeDollarSign size={18} className="text-[#F97316]" />
                        Nova proposta
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#667085]">
                        Informe o valor combinado com o cliente.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProposalOpen(false);
                        setProposalError("");
                      }}
                      className="rounded-lg p-1.5 text-[#667085] hover:bg-white hover:text-[#17233B]"
                      aria-label="Fechar proposta"
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[#344054]">
                        Valor
                      </span>
                      <div className="field flex items-center gap-2 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/15">
                        <span className="font-bold text-[#667085]">R$</span>
                        <input
                          value={proposalAmount}
                          onChange={(event) =>
                            setProposalAmount(event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="0,00"
                          className="min-w-0 flex-1 bg-transparent outline-none"
                          autoFocus
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[#344054]">
                        Detalhes (opcional)
                      </span>
                      <input
                        value={proposalDescription}
                        onChange={(event) =>
                          setProposalDescription(event.target.value)
                        }
                        maxLength={240}
                        placeholder="Ex.: material incluso e prazo de 2 dias"
                        className="field w-full"
                      />
                    </label>
                  </div>
                  <button
                    disabled={proposalSending || !proposalAmount.trim()}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#E8660C] disabled:cursor-not-allowed disabled:opacity-55 sm:ml-auto sm:w-auto"
                  >
                    <Send size={16} />
                    {proposalSending ? "Enviando..." : "Enviar proposta"}
                  </button>
                </form>
              )}
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
              {selected.booking.status === "PENDING" &&
                isProvider &&
                !proposalOpen && (
                  <button
                    onClick={() => {
                      setProposalOpen(true);
                      setProposalError("");
                      setProposalSuccess("");
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#EFB67D] py-2.5 text-sm font-extrabold text-[#F97316] hover:bg-[#FFF1E8]"
                  >
                    <BadgeDollarSign size={18} />
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
