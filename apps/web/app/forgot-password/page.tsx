"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Não foi possível enviar a solicitação."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-84px)] bg-[#EEF2F7] px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-lg rounded-2xl border-2 border-[#20365C] bg-[#FFFCF8] p-7 shadow-[9px_11px_0_rgba(32,54,92,.13)] sm:p-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]">
          <ArrowLeft size={17} /> Voltar para entrar
        </Link>
        <p className="eyebrow mt-10">Recupere seu acesso</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">Esqueci minha senha</h1>
        <p className="mt-2 leading-6 text-[#667085]">Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.</p>
        {sent ? (
          <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
            Se houver uma conta com este e-mail, você receberá as instruções em alguns minutos. Verifique também a caixa de spam.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-extrabold text-[#17233B]">
              E-mail
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]" size={18} />
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" required className="field field-with-leading" />
              </div>
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
            <button disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Enviando..." : "Enviar link de recuperação"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
