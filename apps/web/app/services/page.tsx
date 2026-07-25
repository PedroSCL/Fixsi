"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { api, Service } from "../lib/api";
import { Suspense } from "react";

const CATEGORIES = [
  "Todos", "Elétrica", "Hidráulica", "Marcenaria", "Pintura",
  "Limpeza", "Jardinagem", "Informática", "Reformas", "Outros"
];

function ServicesContent() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("");

  async function fetchServices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "Todos") params.set("category", category);

      const res = await api.get(`/services?${params.toString()}`);
      setServices(res.data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, [category]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchServices();
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-bold tracking-[.15em] text-orange-500">ENCONTRE O QUE PRECISA</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1E3A5F]">Profissionais para facilitar seu dia.</h1>
        <p className="mt-2 text-slate-500">Busque por especialidade ou explore as categorias abaixo.</p>
      </div>
      {/* Barra de busca */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="O que você precisa? (ex: Eletricista, Marceneiro)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-5 pr-12 text-gray-700 shadow-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#F97316" } as any}
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#F97316" }}>
            <Search size={20} />
          </button>
        </div>
      </form>

      {/* Categorias */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === "Todos" ? "" : cat)}
            className="px-4 py-2 rounded-full text-sm font-semibold border transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: category === cat || (cat === "Todos" && !category) ? "#F97316" : "transparent",
              borderColor: "#F97316",
              color: category === cat || (cat === "Todos" && !category) ? "white" : "#F97316",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de serviços */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">Nenhum serviço encontrado</p>
          <p className="text-gray-300 text-sm">Tente outra busca ou categoria</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all">
              {/* Foto */}
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {service.images?.[0] ? (
                  <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🔧</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-bold text-lg" style={{ color: "#1E3A5F" }}>
                  {service.title}
                </h3>
                <p className="text-gray-400 text-sm">{service.description.slice(0, 80)}...</p>
                <p className="text-sm mt-1" style={{ color: "#F97316" }}>
                  por {service.user.name}
                </p>
              </div>

              {/* Botão */}
              <Link
                href={`/services/${service.id}`}
                className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold shrink-0 hover:opacity-90"
                style={{ backgroundColor: "#F97316" }}
              >
                Detalhes
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">Carregando...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
