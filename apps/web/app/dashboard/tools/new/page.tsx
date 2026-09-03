"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleDollarSign,
  Drill,
  FileText,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { api, apiErrorMessage } from "../../../lib/api";
import { useRequireRole } from "../../../lib/use-require-role";
const CATEGORIES = [
  "Furadeiras",
  "Serras",
  "Construção",
  "Jardinagem",
  "Pintura",
  "Escadas",
  "Outros",
];
export default function NewToolPage() {
  const router = useRouter();
  const allowed = useRequireRole("LOCADOR");
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    pricePerDay: "",
    usageRules: "",
  });
  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/tools", {
        ...form,
        pricePerDay: Number(form.pricePerDay),
      });
      router.push("/dashboard?success=tool");
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Não foi possível anunciar a ferramenta"));
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
      <section className="mt-6 overflow-hidden rounded-xl border-2 border-[#20365C] bg-white shadow-[7px_8px_0_rgba(32,54,92,.1)]">
        <header className="border-b-2 border-[#20365C] bg-[#FFF0DF] p-7 sm:p-9">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB15A] text-[#17233B]">
              <Drill size={24} />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#984B00]">
                Área do locador
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#17233B]">
                Anunciar ferramenta
              </h1>
              <p className="mt-1 text-[#667085]">
                Informe o estado, a diária e as regras de uso.
              </p>
            </div>
          </div>
        </header>
        <form onSubmit={submit} className="space-y-6 p-7 sm:p-9">
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2">
              <Drill size={16} className="text-[#F97316]" /> Nome da ferramenta
            </span>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              className="field mt-2"
              placeholder="Ex.: Furadeira de impacto"
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
              rows={4}
              className="field mt-2 resize-none"
              placeholder="Marca, modelo, estado de conservação e itens inclusos"
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
                por dia
              </span>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#667085]">
                  R$
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.pricePerDay}
                  onChange={(e) => update("pricePerDay", e.target.value)}
                  required
                  className="field field-with-leading"
                  placeholder="0,00"
                />
              </div>
            </label>
          </div>
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#F97316]" /> Regras de uso
            </span>
            <textarea
              value={form.usageRules}
              onChange={(e) => update("usageRules", e.target.value)}
              rows={3}
              className="field mt-2 resize-none"
              placeholder="Cuidados, documentos ou caução, se aplicável"
            />
          </label>
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
              {loading ? "Publicando..." : "Anunciar ferramenta"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
