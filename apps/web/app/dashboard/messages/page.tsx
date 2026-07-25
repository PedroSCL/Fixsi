"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "../../lib/api";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
}

interface Conversation {
  id: string;
  booking: {
    id: string;
    status: string;
    service?: { title: string };
    tool?: { title: string };
    client: { id: string; name: string };
  };
  messages: Message[];
  proposals: {
    id: string;
    amount: number;
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("fixsi_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(stored);
    setUserId(user.id);
    fetchBookings();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  async function fetchBookings() {
    try {
      const res = await api.get("/bookings");
      setBookings(res.data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(conversationId: string) {
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      setSelected(res.data.conversation);
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !selected) return;

    setSending(true);
    try {
      const res = await api.post(
        `/conversations/${selected.id}/messages`,
        { content: message }
      );
      setSelected((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, res.data.message] }
          : prev
      );
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function sendProposal(amount: number) {
    if (!selected) return;
    try {
      await api.post(`/bookings/${selected.booking.id}/proposals`, {
        amount,
        description: "Proposta de orçamento",
      });
      const res = await api.get(`/conversations/${selected.id}`);
      setSelected(res.data.conversation);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao enviar proposta");
    }
  }

  async function acceptProposal(proposalId: string) {
    if (!selected) return;
    try {
      await api.patch(
        `/bookings/${selected.booking.id}/proposals/${proposalId}/accept`
      );
      const res = await api.get(`/conversations/${selected.id}`);
      setSelected(res.data.conversation);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao aceitar proposta");
    }
  }

  const getTitle = (booking: Booking) =>
    booking.service?.title || booking.tool?.title || "Conversa";

  const getStatus = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Pendente", color: "#94A3B8" },
      AWAITING_PAYMENT: { label: "Aguardando pagamento", color: "#F97316" },
      PAID: { label: "Pago", color: "#22C55E" },
      IN_PROGRESS: { label: "Em andamento", color: "#3B82F6" },
      COMPLETED: { label: "Concluído", color: "#22C55E" },
      CANCELLED: { label: "Cancelado", color: "#EF4444" },
    };
    return map[status] || { label: status, color: "#94A3B8" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6"
      >
        <ArrowLeft size={18} />
        Voltar para o dashboard
      </Link>

      <div className="flex gap-4 h-[600px] bg-white rounded-3xl shadow-sm overflow-hidden">
        {/* Lista de conversas */}
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold" style={{ color: "#1E3A5F" }}>
              Mensagens
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-sm">Nenhuma conversa ainda</p>
                <Link
                  href="/services"
                  className="text-sm mt-2 inline-block"
                  style={{ color: "#F97316" }}
                >
                  Explorar serviços
                </Link>
              </div>
            ) : (
              bookings.map((booking) => {
                const status = getStatus(booking.status);
                return (
                  <button
                    key={booking.id}
                    onClick={() => openConversation(booking.conversation.id)}
                    className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors"
                    style={{
                      backgroundColor:
                        selected?.booking.id === booking.id
                          ? "#FFF7ED"
                          : "white",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: "#F97316" }}
                      >
                        {getTitle(booking)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm truncate"
                          style={{ color: "#1E3A5F" }}
                        >
                          {getTitle(booking)}
                        </p>
                        <span
                          className="text-xs"
                          style={{ color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Área do chat */}
        {selected ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold" style={{ color: "#1E3A5F" }}>
                  {selected.booking.service?.title ||
                    selected.booking.tool?.title}
                </h3>
                <span
                  className="text-xs"
                  style={{ color: getStatus(selected.booking.status).color }}
                >
                  {getStatus(selected.booking.status).label}
                </span>
              </div>

              {/* Propostas pendentes */}
              {selected.proposals
                .filter((p) => p.status === "PENDING")
                .map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-2"
                  >
                    <div>
                      <p className="text-xs text-gray-500">Proposta</p>
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#F97316" }}
                      >
                        R$ {Number(proposal.amount).toFixed(2)}
                      </p>
                    </div>
                    {proposal.senderId !== userId && (
                      <button
                        onClick={() => acceptProposal(proposal.id)}
                        className="text-white text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: "#22C55E" }}
                      >
                        Aceitar
                      </button>
                    )}
                  </div>
                ))}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {selected.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-300 text-sm">
                    Nenhuma mensagem ainda. Diga olá!
                  </p>
                </div>
              ) : (
                selected.messages.map((msg) => {
                  const isMe = msg.sender.id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-xs px-4 py-2 rounded-2xl text-sm"
                        style={{
                          backgroundColor: isMe ? "#F97316" : "#F3F4F6",
                          color: isMe ? "white" : "#1E3A5F",
                        }}
                      >
                        {!isMe && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {msg.sender.name}
                          </p>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <div className="p-4 border-t border-gray-100">
              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-sm focus:outline-none text-gray-700"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50"
                  style={{ backgroundColor: "#F97316" }}
                >
                  <Send size={16} />
                </button>
              </form>

              {/* Botão enviar proposta (só para profissional) */}
              {selected.booking.status === "PENDING" && (
                <button
                  onClick={() => {
                    const amount = prompt("Valor da proposta (R$):");
                    if (amount && !isNaN(Number(amount))) {
                      sendProposal(Number(amount));
                    }
                  }}
                  className="mt-2 w-full py-2 rounded-full text-sm font-medium border-2"
                  style={{ borderColor: "#F97316", color: "#F97316" }}
                >
                  Enviar Proposta de Orçamento
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-300 text-4xl mb-4">💬</p>
              <p className="text-gray-400">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}