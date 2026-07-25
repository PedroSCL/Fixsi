"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../lib/api";

const CATEGORIES = [
  "Elétrica", "Hidráulica", "Marcenaria", "Pintura",
  "Limpeza", "Jardinagem", "Informática", "Reformas", "Outros"
];

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priceFrom: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
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
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao cadastrar serviço");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Voltar */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6"
      >
        <ArrowLeft size={18} />
        Voltar para o dashboard
      </Link>

      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#F97316" }}>
          Cadastrar Novo Serviço
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Preencha os detalhes do seu serviço para aparecer nas buscas
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Título */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Título
            </label>
            <input
              type="text"
              placeholder="Ex: Eletricista Residencial"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-gray-700"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Descrição
            </label>
            <textarea
              placeholder="Descreva o que você oferece, sua experiência e diferenciais..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-gray-700 resize-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Categoria
            </label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-gray-700 bg-white"
            >
              <option value="">Selecione uma categoria</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Preço de referência */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Preço de referência (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                R$
              </span>
              <input
                type="number"
                placeholder="0,00"
                value={form.priceFrom}
                onChange={(e) => update("priceFrom", e.target.value)}
                min="0"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-gray-700"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              O valor final será negociado com o cliente pelo chat
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full text-white font-medium text-lg hover:opacity-90 disabled:opacity-60 mt-2"
            style={{ backgroundColor: "#F97316" }}
          >
            {loading ? "Cadastrando..." : "Concluir"}
          </button>
        </form>
      </div>
    </div>
  );
}