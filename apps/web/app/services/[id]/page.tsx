"use client";
/* eslint-disable @next/next/no-img-element -- imagens dos anúncios vêm de URLs cadastradas pelos usuários */
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { api, apiErrorMessage, isUnauthorized } from "../../lib/api";
import { AvailabilityCalendar } from "../../components/AvailabilityCalendar";
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
    reviewsReceived: { rating: number; comment: string; createdAt: string }[];
  };
}
export default function ServiceDetailPage() {
  const { id } = useParams(),
    router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [booking, setBooking] = useState(false),
    [startDate, setStartDate] = useState(""),
    [success, setSuccess] = useState(false),
    [error, setError] = useState("");
  const loadService = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setService((await api.get(`/services/${id}`)).data.service);
    } catch (err) {
      console.error(err);
      setService(null);
      setLoadError(
        axios.isAxiosError(err) && err.response?.status === 404
          ? "Serviço não encontrado"
          : apiErrorMessage(
              err,
              "Não foi possível carregar este serviço. Tente novamente.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    loadService();
  }, [loadService]);
  async function book() {
    if (!startDate) {
      setError("Selecione uma data para continuar");
      return;
    }
    setBooking(true);
    setError("");
    try {
      await api.post("/bookings", { serviceId: id, startDate });
      setSuccess(true);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        router.push("/login");
        return;
      }
      setError(apiErrorMessage(err, "Não foi possível enviar a solicitação"));
    } finally {
      setBooking(false);
    }
  }
  if (loading)
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando serviço...
      </div>
    );
  if (loadError)
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-extrabold">{loadError}</h1>
        <div className="flex flex-wrap justify-center gap-3">
          {loadError !== "Serviço não encontrado" && (
            <button type="button" onClick={loadService} className="btn-primary">
              <RefreshCw size={17} /> Tentar novamente
            </button>
          )}
          <Link href="/services" className="btn-secondary">
            Voltar para profissionais
          </Link>
        </div>
      </div>
    );
  if (!service) return null;
  const reviews = service.user.reviewsReceived,
    avg = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0,
    formatted = startDate
      ? startDate.split("-").reverse().join("/")
      : "Escolha uma data";
  return (
    <main className="page-shell py-10">
      <Link
        href="/services"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar para profissionais
      </Link>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_340px]">
        <div>
          <article className="overflow-hidden rounded-xl border-2 border-[#20365C] bg-white shadow-[7px_8px_0_rgba(32,54,92,.1)]">
            <div className="relative flex h-72 items-center justify-center overflow-hidden border-b-2 border-[#20365C] bg-[#FFF0DF] sm:h-96">
              {service.images?.[0] ? (
                <img
                  src={service.images[0]}
                  alt={service.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <img
                    src="/img/ferramentas.png"
                    alt=""
                    className="h-full w-full object-cover opacity-25"
                  />
                  <Wrench className="absolute text-[#F97316]" size={52} />
                </>
              )}
            </div>
            <div className="p-7 sm:p-9">
              <span className="rounded-full bg-[#FFF1E8] px-3 py-1.5 text-xs font-extrabold text-[#F97316]">
                {service.category}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
                {service.title}
              </h1>
              <p className="mt-4 leading-7 text-[#667085]">
                {service.description}
              </p>
            </div>
          </article>
          {reviews.length > 0 && (
            <section className="mt-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="eyebrow">Experiências reais</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#17233B]">
                    Avaliações
                  </h2>
                </div>
                <span className="text-sm font-bold text-[#667085]">
                  {reviews.length}{" "}
                  {reviews.length === 1 ? "avaliação" : "avaliações"}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {reviews.map((review, i) => (
                  <article key={i} className="surface-card p-5">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={15}
                          fill={j < review.rating ? "#FFB15A" : "none"}
                          stroke={j < review.rating ? "#FFB15A" : "#C6D5D2"}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-6 text-[#667085]">
                        “{review.comment}”
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border-2 border-[#20365C] bg-[#20365C] p-6 text-white shadow-[6px_7px_0_#F0C79E]">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F97316] text-xl font-extrabold text-white">
                {service.user.name?.[0]?.toUpperCase() || "?"}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Profissional
                </p>
                <h2 className="font-extrabold text-white">
                  {service.user.name}
                </h2>
                {avg > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-[#FFC56E]">
                    <Star size={14} fill="#FFB15A" stroke="#FFB15A" />{" "}
                    {avg.toFixed(1)} ({reviews.length})
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#FFF1E8] p-3 text-sm font-bold text-[#F97316]">
              <ShieldCheck size={18} /> Contrate e converse pela Fixsi
            </div>
          </section>
          <section className="surface-card p-6">
            {service.priceFrom && (
              <div className="mb-5 border-b border-[#EEEAE4] pb-5">
                <p className="text-sm font-semibold text-[#667085]">
                  Valores a partir de
                </p>
                <p className="mt-1 text-3xl font-extrabold text-[#17233B]">
                  R$ {Number(service.priceFrom).toFixed(2)}
                </p>
                <small className="text-[#667085]">
                  Valor final combinado por proposta
                </small>
              </div>
            )}
            {success ? (
              <div className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Check size={23} />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-[#17233B]">
                  Pedido enviado
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Agora converse com o profissional e combine os detalhes.
                </p>
                <Link
                  href="/dashboard/messages"
                  className="btn-primary mt-5 w-full"
                >
                  <MessageCircle size={17} /> Abrir mensagens
                </Link>
              </div>
            ) : (
              <>
                <label className="block text-sm font-extrabold text-[#17233B]">
                  Quando você precisa?
                </label>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-[#F97316]">
                  <CalendarDays size={18} />
                  {formatted}
                </div>
                <AvailabilityCalendar
                  professionalId={service.user.id}
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setError("");
                  }}
                />
                {error && (
                  <p
                    role="alert"
                    className="mt-3 text-center text-sm font-semibold text-red-700"
                  >
                    {error}
                  </p>
                )}
                <button
                  onClick={book}
                  disabled={booking}
                  className="btn-primary mt-5 w-full disabled:opacity-60"
                >
                  {booking ? "Enviando..." : "Pedir orçamento"}
                </button>
              </>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
