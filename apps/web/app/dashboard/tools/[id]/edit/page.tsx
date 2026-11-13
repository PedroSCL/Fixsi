"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleDollarSign,
  Drill,
  FileText,
  ImageIcon,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { api, apiErrorMessage } from "../../../../lib/api";
import { useRequireRole } from "../../../../lib/use-require-role";

const CATEGORIES = [
  "Furadeiras",
  "Serras",
  "Construção",
  "Jardinagem",
  "Pintura",
  "Escadas",
  "Outros",
];

export default function EditToolPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const allowed = useRequireRole(["PROFESSIONAL", "ADMIN"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    pricePerDay: "",
    usageRules: "",
    imageUrl: "",
  });

  const update = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    if (!allowed || !id) return;
    api
      .get(`/tools/${id}`)
      .then(({ data }) => {
        const tool = data.tool;
        setForm({
          title: tool.title ?? "",
          description: tool.description ?? "",
          category: tool.category ?? "",
          pricePerDay: tool.pricePerDay == null ? "" : String(tool.pricePerDay),
          usageRules: tool.usageRules ?? "",
          imageUrl: tool.images?.[0] ?? "",
        });
      })
      .catch((err: unknown) =>
        setError(apiErrorMessage(err, "Não foi possível carregar esta ferramenta.")),
      )
      .finally(() => setLoading(false));
  }, [allowed, id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`/tools/${id}`, {
        title: form.title,
        description: form.description,
        category: form.category,
        pricePerDay: Number(form.pricePerDay),
        usageRules: form.usageRules.trim() || undefined,
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
      });
      router.push("/dashboard/listings");
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  }

  if (!allowed || loading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        {error || "Carregando anúncio..."}
      </div>
    );
  }

  return (
    <main className="page-shell max-w-3xl py-10">
      <Link href="/dashboard/listings" className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]">
        <ArrowLeft size={17} /> Voltar aos meus anúncios
      </Link>
      <section className="mt-6 overflow-hidden rounded-xl border-2 border-[#20365C] bg-white shadow-[7px_8px_0_rgba(32,54,92,.1)]">
        <header className="border-b-2 border-[#20365C] bg-[#FFF0DF] p-7 sm:p-9">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB15A] text-[#17233B]"><Drill size={24} /></span>
            <div>
              <p className="eyebrow">Área profissional</p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#17233B]">Editar ferramenta</h1>
              <p className="mt-1 text-[#667085]">Atualize os dados da sua ferramenta anunciada.</p>
            </div>
          </div>
        </header>
        <form onSubmit={submit} className="space-y-6 p-7 sm:p-9">
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2"><Drill size={16} className="text-[#F97316]" /> Nome da ferramenta</span>
            <input value={form.title} onChange={(event) => update("title", event.target.value)} required className="field mt-2" />
          </label>
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2"><FileText size={16} className="text-[#F97316]" /> Descrição</span>
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} required rows={4} className="field mt-2 resize-none" />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-extrabold text-[#17233B]">
              <span className="flex items-center gap-2"><Tag size={16} className="text-[#F97316]" /> Categoria</span>
              <select value={form.category} onChange={(event) => update("category", event.target.value)} required className="field mt-2">
                <option value="">Selecione</option>
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="block text-sm font-extrabold text-[#17233B]">
              <span className="flex items-center gap-2"><CircleDollarSign size={16} className="text-[#F97316]" /> Valor por dia</span>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#667085]">R$</span>
                <input type="number" min="0.01" step="0.01" value={form.pricePerDay} onChange={(event) => update("pricePerDay", event.target.value)} required className="field field-with-leading" />
              </div>
            </label>
          </div>
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#F97316]" /> Regras de uso</span>
            <textarea value={form.usageRules} onChange={(event) => update("usageRules", event.target.value)} rows={3} className="field mt-2 resize-none" />
          </label>
          <label className="block text-sm font-extrabold text-[#17233B]">
            <span className="flex items-center gap-2"><ImageIcon size={16} className="text-[#F97316]" /> Imagem do anúncio <span className="font-semibold text-[#667085]">(opcional)</span></span>
            <input type="url" value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} className="field mt-2" placeholder="https://exemplo.com/minha-imagem.jpg" />
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EEEAE4] pt-6 sm:flex-row sm:justify-end">
            <Link href="/dashboard/listings" className="btn-secondary">Cancelar</Link>
            <button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
