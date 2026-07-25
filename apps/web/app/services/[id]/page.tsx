"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Star, MessageCircle, ArrowLeft } from "lucide-react";
import { api } from "../../lib/api";

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  priceFrom: number | null;
  images: string[];
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    reviewsReceived: {
      rating: number;
      comment: string;
      createdAt: string;
    }[];
  };
}

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await api.get(`/services/${id}`);
        setService(res.data.service);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id]);

  async function handleBooking() {
    const token = localStorage.getItem("fixsi_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!startDate) {
      setError("Selecione uma data para o serviço");
      return;
    }

    setBooking(true);
    setError("");

    try {
      await api.post("/bookings", {
        serviceId: id,
        startDate,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao solicitar serviço");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <p className="text-gray-400">Serviço não encontrado</p>
        <Link href="/services" className="text-orange-500">
          Voltar para serviços
        </Link>
      </div>
    );
  }

  const avgRating =
    service.user.reviewsReceived.length > 0
      ? service.user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
        service.user.reviewsReceived.length
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Voltar */}
      <Link
        href="/services"
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6"
      >
        <ArrowLeft size={18} />
        Voltar para serviços
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Imagem */}
          <div
            className="w-full h-64 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: "#F5F0E8" }}
          >
            {service.images?.[0] ? (
              <img
                src={service.images[0]}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl">🔧</span>
            )}
          </div>

          {/* Info do serviço */}
          <div>
            <span
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{ backgroundColor: "#FEF3C7", color: "#F97316" }}
            >
              {service.category}
            </span>
            <h1
              className="text-3xl font-bold mt-3 mb-2"
              style={{ color: "#1E3A5F" }}
            >
              {service.title}
            </h1>
            <p className="text-gray-500 leading-relaxed">{service.description}</p>
          </div>

          {/* Avaliações */}
          {service.user.reviewsReceived.length > 0 && (
            <div>
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "#1E3A5F" }}
              >
                Avaliações ({service.user.reviewsReceived.length})
              </h3>
              <div className="flex flex-col gap-3">
                {service.user.reviewsReceived.map((review, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={14}
                          fill={j < review.rating ? "#F97316" : "none"}
                          stroke={j < review.rating ? "#F97316" : "#ccc"}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — profissional + contratar */}
        <div className="flex flex-col gap-4">
          {/* Card do profissional */}
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: "#F97316" }}
            >
              {service.user.name[0].toUpperCase()}
            </div>
            <div className="text-center">
              <h3 className="font-bold" style={{ color: "#1E3A5F" }}>
                {service.user.name}
              </h3>
              {avgRating > 0 && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.round(avgRating) ? "#F97316" : "none"}
                      stroke={i < Math.round(avgRating) ? "#F97316" : "#ccc"}
                    />
                  ))}
                  <span className="text-sm text-gray-400">
                    ({avgRating.toFixed(1)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card de contratação */}
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            {service.priceFrom && (
              <div>
                <p className="text-sm text-gray-400">A partir de</p>
                <p className="text-2xl font-bold" style={{ color: "#F97316" }}>
                  R$ {Number(service.priceFrom).toFixed(2)}
                </p>
              </div>
            )}

            {success ? (
              <div className="text-center">
                <p className="text-green-600 font-medium mb-2">
                  ✅ Solicitação enviada!
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Acesse suas mensagens para negociar com o profissional.
                </p>
                <Link
                  href="/dashboard/messages"
                  className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-full font-medium"
                  style={{ backgroundColor: "#F97316" }}
                >
                  <MessageCircle size={18} />
                  Ver mensagens
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">
                    Data do serviço
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none text-gray-700"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full py-3 rounded-full text-white font-medium hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#F97316" }}
                >
                  {booking ? "Solicitando..." : "Solicitar Orçamento"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}