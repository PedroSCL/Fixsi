"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  IdCard,
  Image as ImageIcon,
  LockKeyhole,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { api, clearLegacyAuthStorage, notifyAuthChanged } from "../../lib/api";
import { formatCpf, isValidCpf, normalizeCpf } from "../../lib/cpf";

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    avatarUrl: "",
    cpf: "",
    currentPassword: "",
  });
  const [email, setEmail] = useState("");
  const [cpfMasked, setCpfMasked] = useState("");
  const [cpfIsValid, setCpfIsValid] = useState(true);
  const [correctingCpf, setCorrectingCpf] = useState(false);
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
          cpf: "",
          currentPassword: "",
        });
        setEmail(data.user.email);
        setCpfMasked(data.user.cpfMasked);
        setCpfIsValid(data.user.cpfValid);
        setCorrectingCpf(!data.user.cpfValid);
      })
      .catch((caught: unknown) => {
        if (axios.isAxiosError(caught) && caught.response?.status === 401) {
          clearLegacyAuthStorage();
          notifyAuthChanged();
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
    if (correctingCpf && !isValidCpf(form.cpf)) {
      setError("Informe um CPF válido antes de salvar.");
      setSaving(false);
      return;
    }
    if (correctingCpf && !form.currentPassword) {
      setError("Informe sua senha atual para confirmar a alteração do CPF.");
      setSaving(false);
      return;
    }
    try {
      await api.patch("/auth/profile", {
        name: form.name,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
        ...(correctingCpf
          ? {
              cpf: normalizeCpf(form.cpf),
              currentPassword: form.currentPassword,
            }
          : {}),
      });
      notifyAuthChanged();
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
          <div className="rounded-2xl border border-[#E7E2DA] bg-[#FCFBF9] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#17233B]">CPF</p>
                <p className="mt-1 font-semibold text-[#667085]">{cpfMasked}</p>
                <p
                  className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${
                    cpfIsValid ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {!cpfIsValid && <ShieldAlert size={15} />}
                  {cpfIsValid
                    ? "Documento validado."
                    : "O CPF atual é inválido e precisa ser corrigido."}
                </p>
              </div>
              {cpfIsValid && (
                <button
                  type="button"
                  onClick={() => {
                    setCorrectingCpf((current) => !current);
                    setForm((current) => ({
                      ...current,
                      cpf: "",
                      currentPassword: "",
                    }));
                  }}
                  className="btn-secondary shrink-0"
                >
                  <IdCard size={17} />
                  {correctingCpf ? "Manter CPF atual" : "Alterar CPF"}
                </button>
              )}
            </div>

            {correctingCpf && (
              <div className="mt-5 grid gap-5 border-t border-[#E7E2DA] pt-5 sm:grid-cols-2">
                <Field icon={IdCard} label="Novo CPF">
                  <input
                    className={`field field-with-leading ${
                      normalizeCpf(form.cpf).length === 11
                        ? isValidCpf(form.cpf)
                          ? "border-emerald-500"
                          : "border-red-400"
                        : ""
                    }`}
                    value={formatCpf(form.cpf)}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        cpf: normalizeCpf(event.target.value),
                      })
                    }
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    maxLength={14}
                    required
                  />
                </Field>
                <Field icon={LockKeyhole} label="Senha atual">
                  <input
                    className="field field-with-leading"
                    type="password"
                    value={form.currentPassword}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        currentPassword: event.target.value,
                      })
                    }
                    placeholder="Confirme sua identidade"
                    autoComplete="current-password"
                    maxLength={128}
                    required
                  />
                </Field>
                <p className="text-xs leading-5 text-[#667085] sm:col-span-2">
                  Por segurança, o CPF só é alterado após validar sua senha.
                </p>
              </div>
            )}
          </div>
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
