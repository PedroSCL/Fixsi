"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Star } from "lucide-react";
import { api } from "../../lib/api";

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  service?: { id: string; title: string; category: string };
  tool?: { id: string; title: string; category: string };
  proposal?: { amount: number; status: string } | null;
  payment?: { status: string; amount: number } | null;
  conversation: { id: string };
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Aguardando profissional", color: "#92400E", bg: "#FEF3C7" },
  CONFIRMED: { label: "Confirmado", color: "#1D4ED8", bg: "#DBEAFE" },
  AWAITING_PAYMENT: { label: "Aguardando pagamento", color: "#C2410C", bg: "#FFEDD5" },
  PAID: { label: "Pago", color: "#15803D", bg: "#DCFCE7" },
  IN_PROGRESS: { label: "Em andamento", color: "#1D4ED8", bg: "#DBEAFE" },
  COMPLETED: { label: "Concluído", color: "#15803D", bg: "#DCFCE7" },
  CANCELLED: { label: "Cancelado", color: "#B91C1C", bg: "#FEE2E2" },
  DISPUTED: { label: "Em disputa", color: "#B91C1C", bg: "#FEE2E2" },
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("fixsi_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    fetchBookings();
  }, []);

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

  async function completeBooking(bookingId: string) {
    setCompleting(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/complete`);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao concluir");
    } finally {
      setCompleting(null);
    }
  }

  const getTitle = (booking: Booking) =>
    booking.service?.title || booking.tool?.title || "Serviço";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6"
      >
        <ArrowLeft size={18} />
        Voltar para o dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "#1E3A5F" }}>
        Meus Aluguéis e Serviços
      </h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-gray-300 text-5xl mb-4">📋</p>
          <p className="text-gray-400 mb-4">Você ainda não tem agendamentos</p>
          <Link
            href="/services"
            className="text-white px-6 py-3 rounded-full font-medium inline-block"
            style={{ backgroundColor: "#F97316" }}
          >
            Explorar serviços
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const status = STATUS_MAP[booking.status] || {
              label: booking.status,
              color: "#64748B",
              bg: "#F1F5F9",
            };

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4"
              >
                {/* Ícone */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: "#FFF7ED" }}
                >
                  {booking.service ? "🔧" : "🛠️"}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-bold" style={{ color: "#1E3A5F" }}>
                    {getTitle(booking)}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(booking.startDate).toLocaleDateString("pt-BR")}
                  </p>
                  {booking.proposal && (
                    <p className="text-sm mt-1" style={{ color: "#F97316" }}>
                      R$ {Number(booking.proposal.amount).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Status */}
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium shrink-0"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </span>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/dashboard/messages"
                    onClick={() => {}}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100"
                    title="Ver mensagens"
                  >
                    <MessageCircle size={18} style={{ color: "#F97316" }} />
                  </Link>

                  {booking.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => completeBooking(booking.id)}
                      disabled={completing === booking.id}
                      className="text-white text-xs px-4 py-2 rounded-full font-medium disabled:opacity-60"
                      style={{ backgroundColor: "#22C55E" }}
                    >
                      {completing === booking.id ? "..." : "Concluir"}
                    </button>
                  )}

                  {booking.status === "COMPLETED" && (
                    <Link
                      href={`/dashboard/bookings/${booking.id}/review`}
                      className="text-white text-xs px-4 py-2 rounded-full font-medium"
                      style={{ backgroundColor: "#F97316" }}
                    >
                      <Star size={14} className="inline mr-1" />
                      Avaliar
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}