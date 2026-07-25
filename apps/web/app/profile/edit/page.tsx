"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Phone,
  UserRound,
} from "lucide-react";
import { api } from "../../lib/api";

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", avatarUrl: "" });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        setForm({
          name: data.user.name,
          phone: data.user.phone,
          avatarUrl: data.user.avatarUrl || "",
        });
        setEmail(data.user.email);
      })
      .catch((caught: unknown) => {
        if (axios.isAxiosError(caught) && caught.response?.status === 401) {
          localStorage.removeItem("fixsi_token");
          localStorage.removeItem("fixsi_user");
          window.dispatchEvent(new Event("serveo:auth-changed"));
          router.replace("/login");
          return;
        }
        setError(
          axios.isAxiosError(caught) && caught.response?.status === 404
            ? "A API conectada ainda não possui a nova rota de perfil. Use a API local atualizada ou publique a nova versão da API."
            : "Não foi possível carregar o perfil. Verifique se a API está disponível.",
        );
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch("/auth/profile", form);
      localStorage.setItem("fixsi_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("serveo:auth-changed"));
      router.push("/profile");
    } catch (caught) {
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.error || "Não foi possível salvar o perfil."
          : "Não foi possível salvar o perfil.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando perfil...
      </div>
    );

  if (!form.name && error) {
    return (
      <main className="page-shell max-w-3xl py-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
        >
          <ArrowLeft size={17} /> Voltar ao perfil
        </Link>
        <section className="surface-card mt-8 p-8 text-center">
          <p role="alert" className="font-bold text-red-700">
            {error}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell max-w-3xl py-10">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao perfil
      </Link>
      <section className="surface-card mt-8 p-6 sm:p-10">
        <p className="eyebrow">Dados pessoais</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
          Editar perfil
        </h1>
        <p className="mt-2 text-[#667085]">
          Mantenha seus dados atualizados para facilitar o contato.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field icon={UserRound} label="Nome completo">
            <input
              className="field field-with-leading"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              minLength={2}
              maxLength={100}
              required
            />
          </Field>
          <Field icon={Phone} label="Telefone">
            <input
              className="field field-with-leading"
              value={form.phone}
              onChange={(event) =>
                setForm({
                  ...form,
                  phone: event.target.value.replace(/[^\d()+\s-]/g, ""),
                })
              }
              minLength={10}
              maxLength={15}
              required
            />
          </Field>
          <Field icon={ImageIcon} label="URL da foto (opcional)">
            <input
              className="field field-with-leading"
              type="url"
              placeholder="https://..."
              value={form.avatarUrl}
              onChange={(event) =>
                setForm({ ...form, avatarUrl: event.target.value })
              }
            />
          </Field>
          <div>
            <label className="mb-2 block text-sm font-extrabold text-[#17233B]">
              E-mail
            </label>
            <input
              className="field bg-[#F1F6F5] text-[#667085]"
              value={email}
              disabled
            />
            <p className="mt-2 text-xs text-[#667085]">
              O e-mail não pode ser alterado nesta tela por segurança.
            </p>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link href="/profile" className="btn-secondary">
              Cancelar
            </Link>
            <button className="btn-primary" disabled={saving}>
              <Check size={18} /> {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof UserRound;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[#17233B]">
        {label}
      </span>
      <span className="relative block">
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#F97316]"
          size={18}
        />
        {children}
      </span>
    </label>
  );
}
