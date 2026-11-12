"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("Este link de recuperação é inválido.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
      window.setTimeout(() => router.push("/login"), 1800);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Não foi possível alterar a senha."));
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
        <p className="eyebrow mt-10">Proteção da sua conta</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">Crie uma nova senha</h1>
        <p className="mt-2 leading-6 text-[#667085]">Use pelo menos 8 caracteres, incluindo letra maiúscula, número e símbolo.</p>
        {success ? (
          <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Senha alterada. Você será direcionado para entrar.</div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <PasswordField label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
            <PasswordField label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
            <button disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Salvando..." : "Salvar nova senha"}</button>
          </form>
        )}
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return <label className="block text-sm font-extrabold text-[#17233B]">{label}<div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]" size={18} /><input type="password" autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} required className="field field-with-leading" /></div></label>;
}
