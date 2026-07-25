"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { name: string; email: string };
  service: { id: string; title: string } | null;
  tool: { id: string; title: string } | null;
}

const reasons: Record<string, string> = {
  FRAUD: "Possível fraude",
  INAPPROPRIATE_CONTENT: "Conteúdo impróprio",
  SCAM: "Golpe",
  SAFETY: "Risco de segurança",
  OTHER: "Outro motivo",
};

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setReports((await api.get("/admin/reports")).data.reports);
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

  return (
    <main className="page-shell max-w-5xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>
      <header className="mt-7 flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1E8] text-[#F97316]">
          <ShieldCheck size={25} />
        </span>
        <div>
          <p className="eyebrow">Moderação</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
            Painel administrativo
          </h1>
          <p className="mt-2 text-[#667085]">
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
      ) : reports.length === 0 && !error ? (
        <div className="surface-card mt-8 p-12 text-center">
          <CheckCircle2 className="mx-auto text-[#F97316]" size={44} />
          <h2 className="mt-4 text-xl font-extrabold text-[#17233B]">
            Tudo em ordem
          </h2>
          <p className="mt-2 text-[#667085]">
            Não há denúncias abertas no momento.
          </p>
        </div>
      ) : (
        <section className="mt-8 space-y-4">
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
        </section>
      )}
    </main>
  );
}
