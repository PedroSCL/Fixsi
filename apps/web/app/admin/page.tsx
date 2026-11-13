"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  CheckCircle2,
  Drill,
  type LucideIcon,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { api } from "../lib/api";
import { useRequireRole } from "../lib/use-require-role";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { name: string; email: string };
  service: { id: string; title: string } | null;
  tool: { id: string; title: string } | null;
}

interface AdminListing {
  id: string;
  title: string;
  category: string;
  user: { name: string; email: string };
}

const reasons: Record<string, string> = {
  FRAUD: "Possível fraude",
  INAPPROPRIATE_CONTENT: "Conteúdo impróprio",
  SCAM: "Golpe",
  SAFETY: "Risco de segurança",
  OTHER: "Outro motivo",
};

export default function AdminPage() {
  const allowed = useRequireRole("ADMIN");
  const [reports, setReports] = useState<Report[]>([]);
  const [services, setServices] = useState<AdminListing[]>([]);
  const [tools, setTools] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");

  useEffect(() => {
    if (allowed) void load();
  }, [allowed]);

  async function load() {
    try {
      const [{ data: reportsData }, { data: listingsData }] = await Promise.all([
        api.get("/admin/reports"),
        api.get("/admin/listings"),
      ]);
      setReports(reportsData.reports);
      setServices(listingsData.services);
      setTools(listingsData.tools);
    } catch (caught) {
      setError(
        axios.isAxiosError(caught) && caught.response?.status === 403
          ? "Esta área é exclusiva para administradores."
          : "Não foi possível carregar as denúncias.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeListing(type: "service" | "tool", id: string, title: string) {
    if (
      !window.confirm(
        `Excluir o anúncio “${title}”? Ele deixará de ser exibido, mas o histórico será preservado.`,
      )
    ) {
      return;
    }

    setWorking(`${type}-${id}`);
    setError("");
    try {
      await api.delete(type === "service" ? `/services/${id}` : `/tools/${id}`);
      if (type === "service") {
        setServices((current) => current.filter((listing) => listing.id !== id));
      } else {
        setTools((current) => current.filter((listing) => listing.id !== id));
      }
    } catch (caught) {
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.error || "Não foi possível excluir o anúncio."
          : "Não foi possível excluir o anúncio.",
      );
    } finally {
      setWorking("");
    }
  }

  async function action(id: string, path: string) {
    setWorking(id);
    try {
      await api.patch(path);
      setReports((current) => current.filter((report) => report.id !== id));
    } catch (caught) {
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.error || "Não foi possível concluir a ação."
          : "Não foi possível concluir a ação.",
      );
    } finally {
      setWorking("");
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
    <main className="page-shell max-w-5xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>
      <header className="relative mt-7 flex items-start gap-4 overflow-hidden rounded-xl border-2 border-[#20365C] bg-[#20365C] p-7 text-white shadow-[6px_7px_0_#F0C79E]">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47A00] text-white">
          <ShieldCheck size={25} />
        </span>
        <div>
          <p className="eyebrow">Moderação</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-white">
            Painel administrativo
          </h1>
          <p className="mt-2 text-white/70">
            Analise denúncias abertas e proteja a comunidade.
          </p>
        </div>
      </header>
      {error && (
        <p
          role="alert"
          className="mt-7 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          {error}
        </p>
      )}
      {loading ? (
        <div className="surface-card mt-8 p-10 text-center text-[#667085]">
          Carregando denúncias...
        </div>
      ) : (
        <>
          <section className="surface-card mt-8 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316]">
                <BriefcaseBusiness size={21} />
              </span>
              <div>
                <p className="eyebrow">Gerenciamento</p>
                <h2 className="text-xl font-extrabold text-[#17233B]">
                  Todos os anúncios
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <AdminListingsGroup
                title="Serviços"
                icon={BriefcaseBusiness}
                listings={services}
                editPath="services"
                working={working}
                onRemove={(id, title) => void removeListing("service", id, title)}
              />
              <AdminListingsGroup
                title="Ferramentas"
                icon={Drill}
                listings={tools}
                editPath="tools"
                working={working}
                onRemove={(id, title) => void removeListing("tool", id, title)}
              />
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle size={20} />
              </span>
              <div>
                <p className="eyebrow">Moderação</p>
                <h2 className="text-xl font-extrabold text-[#17233B]">
                  Denúncias abertas
                </h2>
              </div>
            </div>
            {reports.length === 0 && !error ? (
              <div className="surface-card p-9 text-center">
                <CheckCircle2 className="mx-auto text-[#F97316]" size={38} />
                <h3 className="mt-3 font-extrabold text-[#17233B]">Tudo em ordem</h3>
                <p className="mt-1 text-sm text-[#667085]">Não há denúncias abertas no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
            <article key={report.id} className="surface-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <AlertTriangle size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-extrabold text-[#17233B]">
                      {report.service?.title ||
                        report.tool?.title ||
                        "Conteúdo não identificado"}
                    </h2>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">
                      {reasons[report.reason] || report.reason}
                    </span>
                  </div>
                  <p className="mt-3 leading-6 text-[#475467]">
                    {report.details || "O usuário não adicionou detalhes."}
                  </p>
                  <p className="mt-3 text-xs text-[#667085]">
                    Enviado por {report.reporter.name} ({report.reporter.email})
                    em {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {report.service && (
                      <button
                        disabled={working === report.id}
                        onClick={() =>
                          action(
                            report.id,
                            `/admin/services/${report.service!.id}/deactivate`,
                          )
                        }
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                      >
                        <Ban size={16} /> Desativar serviço
                      </button>
                    )}
                    {report.tool && (
                      <button
                        disabled={working === report.id}
                        onClick={() =>
                          action(
                            report.id,
                            `/admin/tools/${report.tool!.id}/deactivate`,
                          )
                        }
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                      >
                        <Ban size={16} /> Desativar ferramenta
                      </button>
                    )}
                    <button
                      disabled={working === report.id}
                      onClick={() =>
                        action(report.id, `/admin/reports/${report.id}/dismiss`)
                      }
                      className="btn-secondary min-h-10 px-4 py-2 text-sm"
                    >
                      Dispensar denúncia
                    </button>
                  </div>
                </div>
              </div>
            </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function AdminListingsGroup({
  title,
  icon: Icon,
  listings,
  editPath,
  working,
  onRemove,
}: {
  title: string;
  icon: LucideIcon;
  listings: AdminListing[];
  editPath: "services" | "tools";
  working: string;
  onRemove: (id: string, title: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[#DED9D1] bg-[#FFFCF8] p-4">
      <h3 className="flex items-center gap-2 font-extrabold text-[#17233B]">
        <Icon size={18} className="text-[#F97316]" /> {title}
      </h3>
      {listings.length === 0 ? (
        <p className="mt-4 text-sm text-[#667085]">Nenhum anúncio publicado.</p>
      ) : (
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {listings.map((listing) => (
            <article key={listing.id} className="rounded-lg border border-[#E7E2DA] bg-white p-3">
              <p className="font-extrabold text-[#17233B]">{listing.title}</p>
              <p className="mt-1 text-xs text-[#667085]">
                {listing.category} · {listing.user.name}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/dashboard/${editPath}/${listing.id}/edit`}
                  className="btn-secondary flex-1 px-3 py-2 text-xs"
                >
                  <Pencil size={14} /> Editar
                </Link>
                <button
                  type="button"
                  onClick={() => onRemove(listing.id, listing.title)}
                  disabled={working === `${editPath === "services" ? "service" : "tool"}-${listing.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
