"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  CircleCheck,
  Drill,
  UserRound,
} from "lucide-react";
import {
  api,
  apiErrorMessage,
  clearLegacyAuthStorage,
  notifyAuthChanged,
} from "../lib/api";
import { formatCpf, isValidCpf, normalizeCpf } from "../lib/cpf";

const roles = [
  {
    value: "CLIENT",
    label: "Quero contratar",
    text: "Encontre profissionais",
    icon: UserRound,
  },
  {
    value: "PROFESSIONAL",
    label: "Quero trabalhar",
    text: "Publique seus serviços",
    icon: BriefcaseBusiness,
  },
  {
    value: "LOCADOR",
    label: "Quero alugar",
    text: "Anuncie ferramentas",
    icon: Drill,
  },
] as const;
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    role: "CLIENT" as "CLIENT" | "PROFESSIONAL" | "LOCADOR",
  });
  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));
  const cpfValid = isValidCpf(form.cpf);
  const cpfComplete = normalizeCpf(form.cpf).length === 11;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cpfValid) {
      setError("Informe um CPF válido para criar sua conta.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      clearLegacyAuthStorage();
      notifyAuthChanged();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Não foi possível criar sua conta."));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#F5F2ED] px-4 py-10 sm:px-6">
      <section className="surface-card mx-auto max-w-2xl overflow-hidden">
        <header className="border-b border-[#E7E2DA] bg-white px-7 py-7 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
          >
            <ArrowLeft size={17} /> Voltar
          </Link>
          <div className="mt-7 flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Comece na Fixsi</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
                Crie sua conta
              </h1>
              <p className="mt-2 text-[#667085]">Leva apenas alguns minutos.</p>
            </div>
            <span className="text-sm font-extrabold text-[#F97316]">
              Etapa {step} de 2
            </span>
          </div>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#F2E7DA]">
            <span
              className={`block h-full rounded-full bg-[#F97316] transition-all ${step === 1 ? "w-1/2" : "w-full"}`}
            />
          </div>
        </header>
        <form onSubmit={submit} className="space-y-5 p-7 sm:p-10">
          {step === 1 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-extrabold text-[#17233B] sm:col-span-2">
                  Nome completo
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                    className="field mt-2"
                    placeholder="Seu nome"
                    autoComplete="name"
                  />
                </label>
                <label className="block text-sm font-extrabold text-[#17233B]">
                  E-mail
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                    className="field mt-2"
                    placeholder="voce@email.com"
                    autoComplete="email"
                  />
                </label>
                <label className="block text-sm font-extrabold text-[#17233B]">
                  Senha
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                    className="field mt-2"
                    placeholder="Mínimo de 8 caracteres"
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#17233B]">
                  Como você quer usar a Fixsi?
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {roles.map(({ value, label, text, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("role", value)}
                      className={`relative rounded-2xl border p-4 text-left ${form.role === value ? "border-[#F97316] bg-[#FFF1E8]" : "border-[#E7E2DA] bg-white hover:border-[#EFB67D]"}`}
                    >
                      <Icon size={22} className="text-[#F97316]" />
                      <strong className="mt-3 block text-sm text-[#17233B]">
                        {label}
                      </strong>
                      <small className="mt-1 block text-[#667085]">
                        {text}
                      </small>
                      {form.role === value && (
                        <Check
                          className="absolute right-3 top-3 text-[#F97316]"
                          size={17}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.name || !form.email || !form.password}
                className="btn-primary w-full disabled:opacity-50"
              >
                Continuar
              </button>
            </>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-extrabold text-[#17233B]">
                  CPF
                  <input
                    value={formatCpf(form.cpf)}
                    onChange={(e) =>
                      update("cpf", normalizeCpf(e.target.value))
                    }
                    maxLength={14}
                    required
                    className={`field mt-2 ${
                      cpfComplete
                        ? cpfValid
                          ? "border-emerald-500"
                          : "border-red-400"
                        : ""
                    }`}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-invalid={cpfComplete && !cpfValid}
                  />
                  <span
                    className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                      cpfComplete && !cpfValid
                        ? "text-red-600"
                        : cpfValid
                          ? "text-emerald-700"
                          : "text-[#667085]"
                    }`}
                  >
                    {cpfValid && <CircleCheck size={14} />}
                    {cpfComplete && !cpfValid
                      ? "Os dígitos verificadores não correspondem a um CPF válido."
                      : cpfValid
                        ? "CPF válido."
                        : "Informe os 11 dígitos do CPF."}
                  </span>
                </label>
                <label className="block text-sm font-extrabold text-[#17233B]">
                  Telefone
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      update("phone", e.target.value.replace(/\D/g, ""))
                    }
                    required
                    className="field mt-2"
                    placeholder="DDD + número"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </label>
              </div>
              <div className="rounded-xl bg-[#F8F7F4] p-4 text-sm leading-6 text-[#667085]">
                Ao concluir, você declara que os dados informados são
                verdadeiros e concorda com as regras da plataforma.
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
                >
                  {error}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Voltar
                </button>
                <button
                  disabled={
                    loading ||
                    !cpfValid ||
                    form.phone.replace(/\D/g, "").length < 10
                  }
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </div>
            </>
          )}
        </form>
        <p className="px-7 pb-8 text-center text-sm font-semibold text-[#667085]">
          Já possui conta?{" "}
          <Link href="/login" className="font-extrabold text-[#F97316]">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
