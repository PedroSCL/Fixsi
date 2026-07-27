"use client";
/* eslint-disable @next/next/no-img-element -- imagens dos anúncios vêm de URLs cadastradas pelos usuários */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, MessageCircle, ShieldCheck } from "lucide-react";
import { api, apiErrorMessage, isUnauthorized } from "../../lib/api";
interface ToolDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  usageRules: string | null;
  images: string[];
  user: {
    id: string;
    name: string;
    reviewsReceived: { rating: number; comment: string }[];
  };
}
export default function ToolDetailPage() {
  const { id } = useParams(),
    router = useRouter();
  const [tool, setTool] = useState<ToolDetail | null>(null),
    [loading, setLoading] = useState(true),
    [startDate, setStartDate] = useState(""),
    [endDate, setEndDate] = useState(""),
    [sending, setSending] = useState(false),
    [success, setSuccess] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        setTool((await api.get(`/tools/${id}`)).data.tool);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  async function request() {
    if (!startDate || !endDate) {
      setError("Selecione retirada e devolução");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("A devolução deve ser depois da retirada");
      return;
    }
    setSending(true);
    setError("");
    try {
      await api.post("/bookings", { toolId: id, startDate, endDate });
      setSuccess(true);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        router.push("/login");
        return;
      }
      setError(apiErrorMessage(err, "Não foi possível solicitar o aluguel"));
    } finally {
      setSending(false);
    }
  }
  if (loading)
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando ferramenta...
      </div>
    );
  if (!tool)
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        Ferramenta não encontrada
        <Link href="/tools" className="btn-secondary">
          Voltar
        </Link>
      </div>
    );
  return (
    <main className="page-shell py-10">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar para ferramentas
      </Link>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_340px]">
        <article className="surface-card overflow-hidden">
          <div className="flex h-80 items-center justify-center bg-[#FFF9EA]">
            <img
              src={tool.images?.[0] || "/img/furadeira.png"}
              alt={tool.title}
              className="h-full w-full object-contain p-8"
            />
          </div>
          <div className="p-7 sm:p-9">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#984B00]">
              {tool.category}
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
              {tool.title}
            </h1>
            <p className="mt-4 leading-7 text-[#667085]">{tool.description}</p>
            {tool.usageRules && (
              <div className="mt-6 rounded-xl bg-[#F8F7F4] p-4">
                <h2 className="font-extrabold text-[#17233B]">Regras de uso</h2>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  {tool.usageRules}
                </p>
              </div>
            )}
          </div>
        </article>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F97316] font-extrabold text-white">
                {tool.user.name?.[0]?.toUpperCase() || "?"}
              </span>
              <span>
                <small className="block text-[#667085]">Locador</small>
                <strong className="text-[#17233B]">{tool.user.name}</strong>
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFF1E8] p-3 text-sm font-bold text-[#F97316]">
              <ShieldCheck size={18} /> Negocie dentro da Serveo
            </div>
          </section>
          <section className="surface-card p-6">
            <p className="text-sm font-semibold text-[#667085]">
              Valor da diária
            </p>
            <p className="mt-1 text-3xl font-extrabold text-[#17233B]">
              R$ {Number(tool.pricePerDay).toFixed(2)}
            </p>
            {success ? (
              <div className="mt-5 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Check />
                </span>
                <h2 className="mt-3 font-extrabold">Solicitação enviada</h2>
                <Link
                  href="/dashboard/messages"
                  className="btn-primary mt-4 w-full"
                >
                  <MessageCircle size={17} /> Abrir mensagens
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <label className="block text-sm font-extrabold">
                  Retirada
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="field mt-2"
                  />
                </label>
                <label className="block text-sm font-extrabold">
                  Devolução
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    className="field mt-2"
                  />
                </label>
                {error && (
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                )}
                <button
                  onClick={request}
                  disabled={sending}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {sending ? "Enviando..." : "Solicitar aluguel"}
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
