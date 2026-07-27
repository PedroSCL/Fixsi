"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import {
  api,
  apiErrorMessage,
  clearLegacyAuthStorage,
  notifyAuthChanged,
} from "../lib/api";
import { Brand } from "../components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/login", { email, password });
      clearLegacyAuthStorage();
      notifyAuthChanged();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        apiErrorMessage(err, "Não foi possível entrar. Tente novamente."),
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#F5F2ED] px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[1.75rem] border border-[#E7E2DA] bg-white shadow-[var(--serveo-shadow)] lg:grid-cols-[.9fr_1.1fr]">
        <aside className="hidden flex-col bg-[#17233B] p-10 text-white lg:flex">
          <Brand inverse />
          <div className="my-auto py-16">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#FFB15A]">
              <ShieldCheck size={25} />
            </span>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-[#FFD2A3]">
              Bem-vindo de volta
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-[-.04em]">
              Tudo o que você precisa, em um só lugar.
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-[#E7EAF0]">
              Acompanhe conversas, propostas, agendamentos e pagamentos com
              segurança.
            </p>
          </div>
          <p className="text-sm font-semibold text-[#A8C8C4]">
            Serveo — serviços com confiança.
          </p>
        </aside>
        <section className="p-7 sm:p-10 lg:p-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
          >
            <ArrowLeft size={17} /> Voltar para o início
          </Link>
          <div className="mx-auto mt-10 max-w-sm">
            <p className="eyebrow">Acesse sua conta</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
              Entrar na Serveo
            </h2>
            <p className="mt-2 text-[#667085]">
              Use seus dados para continuar.
            </p>
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <label className="block text-sm font-extrabold text-[#17233B]">
                E-mail
                <div className="relative mt-2">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]"
                    size={18}
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="field field-with-leading"
                  />
                </div>
              </label>
              <label className="block text-sm font-extrabold text-[#17233B]">
                Senha
                <div className="relative mt-2">
                  <LockKeyhole
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]"
                    size={18}
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="field field-with-leading"
                  />
                </div>
              </label>
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-[#F97316]"
                >
                  Esqueci minha senha
                </Link>
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
                >
                  {error}
                </p>
              )}
              <button
                disabled={loading}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
            <p className="mt-7 text-center text-sm font-semibold text-[#667085]">
              Ainda não tem conta?{" "}
              <Link href="/register" className="font-extrabold text-[#F97316]">
                Cadastre-se gratuitamente
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
