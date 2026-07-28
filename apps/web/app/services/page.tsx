"use client";
/* eslint-disable @next/next/no-img-element -- imagens dos anúncios vêm de URLs cadastradas pelos usuários */
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import axios from "axios";
import { api, apiErrorMessage, Service } from "../lib/api";

const CATEGORIES = [
  "Todos",
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
const FALLBACK: Record<string, string> = {
  Elétrica: "/img/eletricista.png",
  Hidráulica: "/img/encanador.png",
  Marcenaria: "/img/marceneiro.png",
  Pintura: "/img/pintor.png",
  Reformas: "/img/pedreiro.png",
};
function ServicesContent() {
  const params = useSearchParams();
  const [services, setServices] = useState<Service[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState<string | null>(null),
    [search, setSearch] = useState(params.get("search") || ""),
    [category, setCategory] = useState(params.get("category") || "");
  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (category) query.set("category", category);
      setServices((await api.get(`/services?${query}`)).data.services);
    } catch (err) {
      console.error(err);
      setServices([]);
      setLoadError(
        axios.isAxiosError(err) && err.response?.status === 429
          ? "Muitas consultas foram realizadas em pouco tempo. Aguarde alguns segundos e tente novamente."
          : apiErrorMessage(
              err,
              "Não foi possível carregar os serviços. Verifique sua conexão e tente novamente.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }
  // A troca de categoria atualiza a listagem; a busca é enviada pelo formulário.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }
  return (
    <main>
      <section className="border-b border-[#E7E2DA] bg-[#F5F2ED] py-12">
        <div className="page-shell">
          <p className="eyebrow">Profissionais e serviços</p>
          <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-extrabold tracking-[-.04em] text-[#17233B]">
                Encontre quem pode ajudar
              </h1>
              <p className="mt-3 max-w-xl text-[#667085]">
                Pesquise, compare e escolha com base em experiência e
                avaliações.
              </p>
            </div>
            <form
              onSubmit={submit}
              className="flex w-full max-w-lg gap-2 rounded-2xl border border-[#F0C79E] bg-white p-2 shadow-sm"
            >
              <label className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F97316]"
                  size={19}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ex.: eletricista"
                  className="h-11 w-full pl-10 pr-3 font-semibold outline-none"
                />
              </label>
              <button className="btn-primary h-11 px-5">Buscar</button>
            </form>
          </div>
        </div>
      </section>
      <div className="page-shell py-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="mr-2 inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-[#17233B]">
            <SlidersHorizontal size={17} /> Categorias
          </span>
          {CATEGORIES.map((item) => {
            const value = item === "Todos" ? "" : item,
              active = category === value;
            return (
              <button
                key={item}
                onClick={() => setCategory(value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${active ? "border-[#F97316] bg-[#F97316] text-white" : "border-[#E7E2DA] bg-white text-[#475467] hover:border-[#EFB67D]"}`}
              >
                {item}
              </button>
            );
          })}
        </div>
        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-[#EEEAE4]"
              />
            ))}
          </div>
        ) : loadError ? (
          <section
            className="surface-card mt-8 p-12 text-center"
            role="alert"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1E8] text-[#F97316]">
              <RefreshCw size={27} />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-[#17233B]">
              Não foi possível carregar os serviços
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-[#667085]">
              {loadError}
            </p>
            <button
              type="button"
              onClick={load}
              className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3"
            >
              <RefreshCw size={17} />
              Tentar novamente
            </button>
          </section>
        ) : services.length === 0 ? (
          <section className="surface-card mt-8 p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1E8] text-[#F97316]">
              <Search size={27} />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-[#17233B]">
              Nenhum resultado encontrado
            </h2>
            <p className="mt-2 text-[#667085]">
              Tente buscar outro termo ou selecionar uma categoria diferente.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between">
              <p className="font-bold text-[#667085]">
                {services.length}{" "}
                {services.length === 1 ? "resultado" : "resultados"}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#667085]">
                <Filter size={15} /> Mais recentes
              </span>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="group overflow-hidden rounded-2xl border border-[#E7E2DA] bg-white shadow-[0_8px_28px_rgba(23,35,59,.05)] hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-44 overflow-hidden bg-[#FFF1E8]">
                    <img
                      src={
                        service.images?.[0] ||
                        FALLBACK[service.category] ||
                        "/img/ferramentas.png"
                      }
                      alt={service.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#F97316] shadow-sm">
                      {service.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-extrabold text-[#17233B]">
                        {service.title}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-[#984B00]">
                        <Star size={14} fill="#FFB15A" stroke="#FFB15A" /> Novo
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#667085]">
                      {service.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-[#EEEAE4] pt-4">
                      <span>
                        <small className="block text-[#7B918D]">
                          Profissional
                        </small>
                        <strong className="text-sm text-[#17233B]">
                          {service.user.name}
                        </strong>
                      </span>
                      <Link
                        href={`/services/${service.id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316] hover:bg-[#F97316] hover:text-white"
                        aria-label={`Ver ${service.title}`}
                      >
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-96 items-center justify-center text-[#667085]">
          Carregando...
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
