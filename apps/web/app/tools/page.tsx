"use client";
/* eslint-disable @next/next/no-img-element -- imagens dos anúncios vêm de URLs cadastradas pelos usuários */
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Drill, Search } from "lucide-react";
import { api, Tool } from "../lib/api";
const FALLBACK = [
  "/img/furadeira.png",
  "/img/serra.png",
  "/img/escada.png",
  "/img/betoneira.png",
];
function ToolsContent() {
  const params = useSearchParams();
  const [tools, setTools] = useState<Tool[]>([]),
    [search, setSearch] = useState(params.get("search") || ""),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      setTools((await api.get(`/tools?${query}`)).data.tools);
    } catch (err) {
      console.error(err);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }
  // A busca inicial é executada uma vez; novas buscas são enviadas pelo formulário.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <main>
      <section className="relative overflow-hidden border-b-2 border-[#20365C] bg-[#FFF0DF] py-12">
        <span className="absolute -right-12 -top-24 h-64 w-64 rotate-12 border-[28px] border-[#FFC56E]/25" />
        <div className="page-shell grid gap-6 lg:grid-cols-[1fr_480px] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#984B00]">
              Aluguel de ferramentas
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-[-.04em] text-[#17233B]">
              Use o equipamento certo sem precisar comprar
            </h1>
            <p className="mt-3 max-w-xl text-[#667085]">
              Encontre ferramentas disponíveis e combine o aluguel direto com o
              locador.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="relative flex rounded-xl border-2 border-[#20365C] bg-white p-2 shadow-[4px_5px_0_#F0C79E]"
          >
            <label className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#984B00]"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ferramenta"
                className="h-11 w-full pl-10 pr-3 font-semibold outline-none"
              />
            </label>
            <button className="rounded-lg bg-[#20365C] px-5 font-extrabold text-white hover:bg-[#152746]">
              Buscar
            </button>
          </form>
        </div>
      </section>
      <div className="page-shell py-10">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-[#EEEAE4]"
              />
            ))}
          </div>
        ) : tools.length === 0 ? (
          <section className="surface-card p-12 text-center">
            <Drill className="mx-auto text-[#F97316]" size={38} />
            <h2 className="mt-4 text-xl font-extrabold">
              Nenhuma ferramenta encontrada
            </h2>
            <p className="mt-2 text-[#667085]">
              Tente buscar outro equipamento.
            </p>
          </section>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <article
                key={tool.id}
                className="group overflow-hidden rounded-xl border-2 border-[#DED9D1] bg-white shadow-[4px_5px_0_rgba(32,54,92,.07)] hover:-translate-y-1 hover:border-[#F47A00]"
              >
                <div className="h-44 bg-[#FFF9EA]">
                  <img
                    src={tool.images?.[0] || FALLBACK[i % FALLBACK.length]}
                    alt={tool.title}
                    className="h-full w-full object-contain p-5 transition group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#984B00]">
                    {tool.category}
                  </span>
                  <h2 className="mt-2 text-lg font-extrabold text-[#17233B]">
                    {tool.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#667085]">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex items-end justify-between border-t border-[#EEEAE4] pt-4">
                    <span>
                      <small className="block text-[#667085]">Diária</small>
                      <strong className="text-xl text-[#17233B]">
                        R$ {Number(tool.pricePerDay).toFixed(2)}
                      </strong>
                    </span>
                    <Link
                      href={`/tools/${tool.id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17233B] text-white"
                      aria-label={`Ver ${tool.title}`}
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
export default function ToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-96 items-center justify-center">
          Carregando...
        </div>
      }
    >
      <ToolsContent />
    </Suspense>
  );
}
