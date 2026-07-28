"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  Tag,
} from "lucide-react";
import { api, apiErrorMessage } from "../../../lib/api";
import { useRequireRole } from "../../../lib/use-require-role";
const CATEGORIES = [
  "Elétrica",
  "Hidráulica",
  "Marcenaria",
  "Pintura",
  "Limpeza",
  "Jardinagem",
  "Informática",
  "Reformas",
  "Outros",
];
export default function NewServicePage() {
  const router = useRouter();
  const allowed = useRequireRole("PROFESSIONAL");
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priceFrom: "",
  });
  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/services", {
        title: form.title,
        description: form.description,
        category: form.category,
        priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
      });
      router.push("/dashboard?success=service");
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Não foi possível publicar o serviço"));
    } finally {
      setLoading(false);
    }
  }
  if (!allowed) {
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Verificando acesso...
      </div>
    );
  }
  return (
    <main className="page-shell max-w-3xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>
      <section className="surface-card mt-6 overflow-hidden">
        <header className="border-b border-[#E7E2DA] bg-[#F5F2ED] p-7 sm:p-9">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F97316] text-white">
              <BriefcaseBusiness size={24} />
            </span>
            <div>
              <p className="eyebrow">Área profissional</p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#17233B]">
                Publicar serviço
              </h1>
              <p className="mt-1 text-[#667085]">
                Apresente seu trabalho de forma clara para novos clientes.
              </p>
            </div>
          </div>
        </header>
        <form onSubmit={submit} className="space-y-6 p-7 sm:p-9">
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2">
              <BriefcaseBusiness size={16} className="text-[#F97316]" /> Título
            </span>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              className="field mt-2"
              placeholder="Ex.: Instalação elétrica residencial"
            />
          </label>
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2">
              <FileText size={16} className="text-[#F97316]" /> Descrição
            </span>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
              rows={5}
              className="field mt-2 resize-none"
              placeholder="Explique o serviço, sua experiência e diferenciais"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-extrabold text-[#17233B]">
              <span className="flex items-center gap-2">
                <Tag size={16} className="text-[#F97316]" /> Categoria
              </span>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                required
                className="field mt-2"
              >
                <option value="">Selecione</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-extrabold text-[#17233B]">
              <span className="flex items-center gap-2">
                <CircleDollarSign size={16} className="text-[#F97316]" /> Valor
                inicial
              </span>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#667085]">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceFrom}
                  onChange={(e) => update("priceFrom", e.target.value)}
                  className="field field-with-leading"
                  placeholder="0,00"
                />
              </div>
            </label>
          </div>
          <p className="text-xs font-semibold text-[#667085]">
            O valor final poderá ser negociado pelo chat.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EEEAE4] pt-6 sm:flex-row sm:justify-end">
            <Link href="/dashboard" className="btn-secondary">
              Cancelar
            </Link>
            <button
              disabled={loading}
              className="btn-primary disabled:opacity-60"
            >
              {loading ? "Publicando..." : "Publicar serviço"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
