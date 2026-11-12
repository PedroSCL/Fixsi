"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  BadgeDollarSign,
  Check,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { api, apiErrorMessage, isUnauthorized } from "../../lib/api";
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
    materialsIncluded: boolean;
    estimatedDuration?: string | null;
    expiresAt?: string | null;
    round: number;
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
    [proposalDuration, setProposalDuration] = useState(""),
    [proposalExpiresAt, setProposalExpiresAt] = useState(""),
    [materialsIncluded, setMaterialsIncluded] = useState(false),
    [proposalSending, setProposalSending] = useState(false),
    [proposalError, setProposalError] = useState(""),
    [proposalSuccess, setProposalSuccess] = useState(""),
    [acceptingProposalId, setAcceptingProposalId] = useState(""),
    [rejectingProposalId, setRejectingProposalId] = useState(""),
    [userId, setUserId] = useState(""),
    [realtimeConnected, setRealtimeConnected] = useState(false),
    [loadError, setLoadError] = useState(""),
    [loading, setLoading] = useState(true);
  const end = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    let socket: Socket | null = null;
    let disposed = false;

    void (async () => {
      try {
        // O cookie HttpOnly autentica a chamada via proxy. Em seguida, um token
        // de 90 segundos abre o WebSocket direto à API, evitando a espera do
        // polling quando a conexão passa pela Vercel.
        const configResponse = await fetch("/api/socket-config");
        if (!configResponse.ok) return;
        const { apiUrl } = (await configResponse.json()) as { apiUrl: string };
        if (disposed || !apiUrl) return;

        socket = io(apiUrl, {
          // Busca um token novo em toda reconexão; ele nunca é persistido no
          // navegador e a sessão continua protegida pelo cookie HttpOnly.
          auth: (callback) => {
            void api
              .get("/auth/socket-token")
              .then(({ data }) => callback({ token: data.token }))
              .catch(() => callback({}));
          },
          transports: ["websocket"],
        });
        socketRef.current = socket;
        socket.on("connect", () => setRealtimeConnected(true));
        socket.on("disconnect", () => setRealtimeConnected(false));
        socket.on("connect_error", () => setRealtimeConnected(false));

        socket.on(
          "new_message",
          (incoming: Message & { conversationId: string }) => {
            setSelected((current) => {
              if (!current || current.id !== incoming.conversationId) return current;
              if (current.messages.some((message) => message.id === incoming.id)) {
                return current;
              }
              return { ...current, messages: [...current.messages, incoming] };
            });
          },
        );

        socket.on(
          "proposal_updated",
          ({ conversationId }: { conversationId: string }) => {
            if (selected?.id !== conversationId) return;

            void api
              .get(`/conversations/${conversationId}`)
              .then(({ data }) => {
                if (!disposed) {
                  setSelected((current) =>
                    current?.id === conversationId ? data.conversation : current,
                  );
                }
              })
              .catch(() => {
                // A alteração local continua visível; a próxima abertura do
                // chat fará uma nova sincronização caso esta consulta falhe.
              });
          },
        );

        if (selected?.id) socket.emit("join_conversation", selected.id);
      } catch {
        // O envio HTTP continua funcionando como alternativa se a conexão
        // em tempo real estiver indisponível.
      }
    })();

    return () => {
      disposed = true;
      socket?.disconnect();
      socketRef.current = null;
      setRealtimeConnected(false);
    };
  }, [userId, selected?.id]);

  useEffect(() => {
    if (selected?.id) socketRef.current?.emit("join_conversation", selected.id);
  }, [selected?.id]);

  useEffect(() => {
    const conversationId = new URLSearchParams(window.location.search).get(
      "conversation",
    );
    api
      .get("/auth/me")
      .then(async ({ data }) => {
        setUserId(data.user.id);
        await load();
        if (conversationId) await open(conversationId);
      })
      .catch((error: unknown) => {
        if (isUnauthorized(error)) {
          router.replace("/login");
          return;
        }
        setLoadError(
          apiErrorMessage(error, "Não foi possível validar sua sessão."),
        );
        setLoading(false);
      });
  }, [router]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);
  async function load() {
    try {
      setLoadError("");
      setBookings((await api.get("/bookings")).data.bookings);
    } catch (err) {
      console.error(err);
      setLoadError(apiErrorMessage(err, "Não foi possível carregar suas conversas."));
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
      setProposalDuration("");
      setProposalExpiresAt("");
      setMaterialsIncluded(false);
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
      // A mesma mensagem também pode chegar pelo WebSocket antes da resposta
      // HTTP. Mantemos uma única cópia pelo identificador persistido.
      setSelected((current) => {
        if (!current || current.messages.some((item) => item.id === sent.id)) {
          return current;
        }
        return { ...current, messages: [...current.messages, sent] };
      });
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
    const isCounter = selected.proposals.some(
      (item) => item.status === "PENDING" && item.senderId !== userId,
    );
    if (!isCounter && proposalDescription.trim().length < 3) {
      setProposalError("Descreva o que está incluso na proposta.");
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
          description: proposalDescription.trim(),
          materialsIncluded,
          estimatedDuration: proposalDuration.trim() || undefined,
          expiresAt: proposalExpiresAt || undefined,
        },
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              proposals: [
                data.proposal,
                ...current.proposals.map((item) =>
                  item.status === "PENDING" ? { ...item, status: "SUPERSEDED" } : item,
                ),
              ],
            }
          : current,
      );
      setProposalAmount("");
      setProposalDescription("");
      setProposalDuration("");
      setProposalExpiresAt("");
      setMaterialsIncluded(false);
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

  function openProposalForm() {
    const active = selected?.proposals.find((item) => item.status === "PENDING");
    // Em uma contraproposta, o destinatário informa só o novo valor. Os
    // detalhes da proposta recebida continuam valendo para evitar ambiguidade.
    setProposalAmount("");
    setProposalDescription(active?.description || "");
    setProposalDuration(active?.estimatedDuration || "");
    setMaterialsIncluded(active?.materialsIncluded || false);
    setProposalExpiresAt(active?.expiresAt?.slice(0, 10) || "");
    setProposalError("");
    setProposalSuccess("");
    setProposalOpen(true);
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
              booking: { ...current.booking, status: "CONFIRMED" },
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
            ? { ...booking, status: "CONFIRMED" }
            : booking,
        ),
      );
      setProposalSuccess("Proposta aceita. O serviço está confirmado.");

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
  async function reject(id: string) {
    if (!selected) return;
    setRejectingProposalId(id);
    setProposalError("");
    try {
      await api.patch(`/bookings/${selected.booking.id}/proposals/${id}/reject`);
      setSelected((current) => current ? {
        ...current,
        proposals: current.proposals.map((item) => item.id === id ? { ...item, status: "REJECTED" } : item),
      } : current);
      setProposalSuccess("Proposta recusada.");
      void load();
    } catch (err: unknown) {
      setProposalError(apiErrorMessage(err, "Não foi possível recusar a proposta."));
    } finally {
      setRejectingProposalId("");
    }
  }
  const title = (b: Booking) => b.service?.title || b.tool?.title || "Conversa";
  const status = (value: string) =>
    ({
      PENDING: "Pendente",
      CONFIRMED: "Confirmado",
      IN_PROGRESS: "Em andamento",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
    })[value] || value;
  const isProvider =
    selected?.booking.service?.userId === userId ||
    selected?.booking.tool?.userId === userId;
  const activeProposal = selected?.proposals.find((proposal) => proposal.status === "PENDING");
  const isCounterProposal = Boolean(
    activeProposal && activeProposal.senderId !== userId,
  );
  const canCreateProposal = Boolean(
    selected?.booking.status === "PENDING" &&
      ((!activeProposal && isProvider) ||
        (activeProposal && activeProposal.senderId !== userId)),
  );
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
      <section className="mt-7 flex min-h-[540px] h-[calc(100dvh-11rem)] overflow-hidden rounded-xl border-2 border-[#20365C] bg-white shadow-[7px_8px_0_rgba(32,54,92,.1)] md:h-[640px]">
        <aside
          className={`${selected ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-[#E7E2DA] md:w-80`}
        >
          <div className="border-b-2 border-[#20365C] bg-[#20365C] p-5 text-white">
            <h2 className="font-extrabold text-white">Suas conversas</h2>
            <div className="mt-1 flex items-center justify-between gap-2 text-sm text-white/80">
              <p>
                {bookings.length} {bookings.length === 1 ? "conversa" : "conversas"}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${realtimeConnected ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/70"}`}>
                {realtimeConnected ? "● Ao vivo" : "Conectando..."}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadError && (
              <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-2 font-extrabold underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}
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
            <header className="flex flex-col items-stretch gap-3 border-b border-[#E7E2DA] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
              {activeProposal && (
                <div className="flex w-full flex-wrap items-center gap-3 rounded-xl bg-[#FFF9EA] px-3 py-2 sm:w-auto sm:px-4">
                  <span className="min-w-0 flex-1 sm:flex-none">
                    <small className="block text-[#667085]">
                      {activeProposal.round === 1 ? "Proposta" : `Contraproposta · rodada ${activeProposal.round} de 6`}
                    </small>
                    <strong className="text-[#984B00]">R$ {Number(activeProposal.amount).toFixed(2).replace(".", ",")}</strong>
                  </span>
                  {activeProposal.senderId === userId ? (
                    <span className="text-xs font-bold text-[#667085]">Aguardando resposta</span>
                  ) : (
                    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
                      <button onClick={() => accept(activeProposal.id)} disabled={Boolean(acceptingProposalId) || Boolean(rejectingProposalId)} className="rounded-lg bg-[#F97316] px-2 py-2 text-xs font-extrabold text-white sm:px-3 sm:py-1.5">
                        {acceptingProposalId === activeProposal.id ? "Aceitando..." : "Aceitar"}
                      </button>
                      <button onClick={openProposalForm} disabled={Boolean(acceptingProposalId) || Boolean(rejectingProposalId)} className="rounded-lg border border-[#EFB67D] bg-white px-2 py-2 text-xs font-extrabold text-[#D96500] sm:px-3 sm:py-1.5">Contrapropor</button>
                      <button onClick={() => reject(activeProposal.id)} disabled={Boolean(acceptingProposalId) || Boolean(rejectingProposalId)} className="rounded-lg px-2 py-2 text-xs font-bold text-[#B42318] hover:bg-[#FEF0EE] sm:py-1.5">{rejectingProposalId === activeProposal.id ? "Recusando..." : "Recusar"}</button>
                    </div>
                  )}
                </div>
              )}
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#EEF2F7] p-4 sm:p-5">
              {selected.proposals.length > 0 && (
                <section className="rounded-xl border border-[#E7E2DA] bg-white p-4 text-sm">
                  <p className="font-extrabold text-[#17233B]">Histórico de propostas</p>
                  <div className="mt-2 space-y-2">
                    {[...selected.proposals].reverse().map((item) => (
                      <div key={item.id} className="border-t border-[#EEEAE4] pt-2 text-[#667085]">
                        <span className="font-bold text-[#17233B]">{item.senderId === userId ? "Você" : "Outra pessoa"} · R$ {Number(item.amount).toFixed(2).replace(".", ",")}</span>
                        <span className="ml-2">{({ PENDING: "Pendente", ACCEPTED: "Aceita", REJECTED: "Recusada", SUPERSEDED: "Substituída", EXPIRED: "Expirada" } as Record<string, string>)[item.status] || item.status}</span>
                        <p className="mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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
              {proposalOpen && canCreateProposal && (
                <form
                  onSubmit={proposal}
                  className="mb-3 rounded-2xl border border-[#F4C99F] bg-[#FFF9F3] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-extrabold text-[#17233B]">
                        <BadgeDollarSign size={18} className="text-[#F97316]" />
                        {isCounterProposal ? "Enviar contraproposta" : "Nova proposta"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#667085]">
                        {isCounterProposal ? "Informe apenas o novo valor. Os demais detalhes da proposta atual serão mantidos." : "Detalhe o valor, o prazo e o que está incluso."}
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
                  <div className={`mt-4 grid gap-3 ${isCounterProposal ? "max-w-xs" : "sm:grid-cols-[180px_1fr]"}`}>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[#344054]">
                        {isCounterProposal ? "Novo valor" : "Valor"}
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
                    {!isCounterProposal && <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[#344054]">
                        Escopo e observações
                      </span>
                      <textarea
                        value={proposalDescription}
                        onChange={(event) =>
                          setProposalDescription(event.target.value)
                        }
                        maxLength={1000}
                        required
                        placeholder="Ex.: troca da resistência, revisão do disjuntor e condições do serviço"
                        className="field min-h-11 w-full resize-y"
                      />
                    </label>}
                  </div>
                  {!isCounterProposal && <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-bold text-[#344054]">Prazo estimado
                      <input value={proposalDuration} onChange={(event) => setProposalDuration(event.target.value)} maxLength={120} placeholder="Ex.: 2 horas" className="field mt-1.5 w-full" />
                    </label>
                    <label className="block text-xs font-bold text-[#344054]">Válida até
                      <input type="date" value={proposalExpiresAt} onChange={(event) => setProposalExpiresAt(event.target.value)} className="field mt-1.5 w-full" />
                    </label>
                  </div>}
                  {!isCounterProposal && <label className="mt-3 flex items-center gap-2 text-sm font-bold text-[#344054]">
                    <input type="checkbox" checked={materialsIncluded} onChange={(event) => setMaterialsIncluded(event.target.checked)} />
                    Materiais inclusos neste valor
                  </label>}
                  <button
                    disabled={proposalSending || !proposalAmount.trim() || (!isCounterProposal && proposalDescription.trim().length < 3)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#E8660C] disabled:cursor-not-allowed disabled:opacity-55 sm:ml-auto sm:w-auto"
                  >
                    <Send size={16} />
                    {proposalSending ? "Enviando..." : isCounterProposal ? "Enviar contraproposta" : "Enviar proposta"}
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
                !activeProposal &&
                isProvider &&
                !proposalOpen && (
                  <button
                    onClick={openProposalForm}
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
