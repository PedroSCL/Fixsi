"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
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
    <main className="min-h-[calc(100vh-84px)] bg-[#EEF2F7] px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border-2 border-[#20365C] bg-white shadow-[9px_11px_0_rgba(32,54,92,.13)] lg:grid-cols-[.9fr_1.1fr]">
        <aside className="relative hidden flex-col overflow-hidden bg-[#F47A00] p-10 text-white lg:flex">
          <span className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full border-[42px] border-white/10" />
          <span className="relative flex w-fit rounded-xl border-2 border-[#20365C] bg-white px-4 py-2 shadow-[4px_5px_0_rgba(32,54,92,.25)]">
            <Brand />
          </span>
          <div className="relative my-auto py-16">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-white/85">
              Bem-vindo de volta
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-[-.05em]">
              Seu próximo serviço começa aqui.
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-white/90">
              Acompanhe conversas, propostas e agendamentos com segurança.
            </p>
          </div>
          <p className="relative text-sm font-semibold text-white/85">
            Prático, confiável e do seu jeito.
          </p>
        </aside>
        <section className="bg-[#FFFCF8] p-7 sm:p-10 lg:p-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
          >
            <ArrowLeft size={17} /> Voltar para o início
          </Link>
          <div className="mx-auto mt-10 max-w-sm">
            <p className="eyebrow">Acesse sua conta</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
              Entrar na Fixsi
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
