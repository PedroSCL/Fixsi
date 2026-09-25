"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";
import {
  api,
  apiErrorMessage,
  clearLegacyAuthStorage,
  isUnauthorized,
  notifyAuthChanged,
} from "../../lib/api";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setName(data.user.name))
      .catch((caught: unknown) => {
        if (isUnauthorized(caught)) {
          clearLegacyAuthStorage();
          notifyAuthChanged();
          router.replace("/login");
          return;
        }
        setError(apiErrorMessage(caught, "Não foi possível carregar sua conta."));
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleting || confirmation !== "EXCLUIR" || !password) return;

    setDeleting(true);
    setError("");
    try {
      await api.delete("/auth/me", { data: { password, confirmation } });
      clearLegacyAuthStorage();
      notifyAuthChanged();
      router.replace("/");
    } catch (caught: unknown) {
      setError(apiErrorMessage(caught, "Não foi possível excluir a conta."));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando conta...
      </div>
    );
  }

  return (
    <main className="page-shell max-w-2xl py-10">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao perfil
      </Link>

      <section className="surface-card mt-8 overflow-hidden">
        <div className="border-b border-[#E7E2DA] bg-[#FFF7F4] p-6 sm:p-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <ShieldAlert size={24} />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
            Excluir minha conta
          </h1>
          <p className="mt-2 text-[#667085]">
            {name ? `${name}, ` : ""}confira o que acontecerá antes de confirmar.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-[#6B2525]">
            <p className="font-extrabold">Esta ação não pode ser desfeita.</p>
            <p className="mt-2">
              Seu cadastro, dados pessoais, sessões, anúncios, agenda,
              mensagens, propostas, avaliações e denúncias serão removidos do
              banco ativo. Pedidos e conversas compartilhados com outras pessoas
              também desaparecerão das contas delas.
            </p>
            <p className="mt-2">
              Cópias de segurança do provedor podem permanecer por um período
              limitado conforme sua política de retenção.
            </p>
          </div>

          {name && (
            <form onSubmit={submit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="delete-confirmation"
                  className="block text-sm font-extrabold text-[#17233B]"
                >
                  Digite EXCLUIR para confirmar
                </label>
                <input
                  id="delete-confirmation"
                  className="field mt-2"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="delete-password"
                  className="block text-sm font-extrabold text-[#17233B]"
                >
                  Senha atual
                </label>
                <input
                  id="delete-password"
                  type="password"
                  className="field mt-2"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                >
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Link href="/profile" className="btn-secondary">
                  Manter minha conta
                </Link>
                <button
                  type="submit"
                  disabled={deleting || confirmation !== "EXCLUIR" || !password}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  {deleting ? "Excluindo..." : "Excluir conta permanentemente"}
                </button>
              </div>
            </form>
          )}
          {!name && error && (
            <p role="alert" className="mt-6 text-sm font-bold text-red-700">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
