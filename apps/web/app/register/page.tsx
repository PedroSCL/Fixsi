"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  CircleCheck,
  UserRound,
} from "lucide-react";
import {
  api,
  apiErrorMessage,
  clearLegacyAuthStorage,
  notifyAuthChanged,
} from "../lib/api";
import { formatCpf, isValidCpf, normalizeCpf } from "../lib/cpf";
import {
  formatPhone,
  isValidBrazilianPhone,
  normalizePhone,
} from "../lib/phone";
import { Brand } from "../components/Brand";

const roles = [
  {
    value: "CLIENT",
    label: "Quero contratar",
    text: "Encontre profissionais",
    icon: UserRound,
  },
  {
    value: "PROFESSIONAL",
    label: "Quero anunciar",
    text: "Publique serviços e ferramentas",
    icon: BriefcaseBusiness,
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
    role: "CLIENT" as "CLIENT" | "PROFESSIONAL",
  });
  const update = (field: string, value: string) => {
    setError("");
    setForm((p) => ({ ...p, [field]: value }));
  };
  const cpfValid = isValidCpf(form.cpf);
  const cpfComplete = normalizeCpf(form.cpf).length === 11;
  const phoneDigits = normalizePhone(form.phone);
  const phoneComplete = phoneDigits.length >= 10;
  const phoneValid = isValidBrazilianPhone(phoneDigits);
  const passwordValid =
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[0-9]/.test(form.password) &&
    /[^a-zA-Z0-9]/.test(form.password);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const firstStepValid =
    form.name.trim().length >= 2 && emailValid && passwordValid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cpfValid) {
      setError("Informe um CPF válido para criar sua conta.");
      return;
    }
    if (!phoneValid) {
      setError("Informe um telefone brasileiro válido com DDD.");
      return;
    }
    setLoading(true);
    try {
      const credentials = {
        email: form.email.trim(),
        password: form.password,
      };

      await api.post("/auth/register", {
        ...form,
        name: form.name.trim(),
        email: credentials.email,
        phone: phoneDigits,
      });

      try {
        await api.get("/auth/me");
      } catch {
        // Alguns proxies podem atrasar a disponibilização dos cookies de uma
        // resposta de criação. O login imediato garante que o usuário recém-
        // cadastrado chegue ao dashboard com uma sessão válida.
        await api.post("/auth/login", credentials);
        await api.get("/auth/me");
      }

      clearLegacyAuthStorage();
      notifyAuthChanged();
      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Não foi possível criar sua conta."));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="min-h-[calc(100vh-84px)] bg-[#EEF2F7] px-4 py-10 sm:px-6">
      <section className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border-2 border-[#20365C] bg-white shadow-[9px_11px_0_rgba(32,54,92,.13)] lg:grid-cols-[300px_1fr]">
        <aside className="relative hidden overflow-hidden bg-[#F47A00] p-9 text-white lg:flex lg:flex-col">
          <span className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full border-[38px] border-white/10" />
          <div className="relative flex w-fit rounded-xl border-2 border-[#20365C] bg-white px-4 py-2 shadow-[4px_5px_0_rgba(32,54,92,.25)]">
            <Brand />
          </div>
          <div className="relative mt-14">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/80">
              Seu cadastro
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight">
              Tudo pronto para começar na Fixsi.
            </h2>
            <ol className="mt-10 space-y-5">
              {["Conta e perfil", "Dados de contato"].map((label, index) => (
                <li key={label} className="flex items-center gap-3 font-bold">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 ${step >= index + 1 ? "border-white bg-white text-[#F47A00]" : "border-white/50 text-white/70"}`}
                  >
                    {step > index + 1 ? <Check size={17} /> : index + 1}
                  </span>
                  <span
                    className={
                      step === index + 1 ? "text-white" : "text-white/70"
                    }
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="relative mt-auto pt-12 text-sm leading-6 text-white/75">
            Clientes e profissionais em um só lugar.
          </p>
        </aside>
        <div>
          <header className="border-b border-[#DED9D1] bg-[#FFFCF8] px-7 py-7 sm:px-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
            >
              <ArrowLeft size={17} /> Voltar
            </Link>
            <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Comece na Fixsi</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
                  Crie sua conta
                </h1>
                <p className="mt-2 text-[#667085]">
                  Leva apenas alguns minutos.
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-extrabold text-[#F97316]">
                Etapa {step} de 2
              </span>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-sm bg-[#E8EAF0]">
              <span
                className={`block h-full bg-[#F47A00] transition-all ${step === 1 ? "w-1/2" : "w-full"}`}
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
                      minLength={8}
                      maxLength={128}
                    />
                    <span
                      className={`mt-2 block text-xs font-semibold ${
                        form.password && !passwordValid
                          ? "text-red-600"
                          : "text-[#667085]"
                      }`}
                    >
                      Use 8 caracteres, uma maiúscula, um número e um símbolo.
                    </span>
                  </label>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#17233B]">
                    Como você quer usar a Fixsi?
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {roles.map(({ value, label, text, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update("role", value)}
                        className={`relative rounded-xl border-2 p-4 text-left ${form.role === value ? "border-[#F47A00] bg-[#FFF0DF] shadow-[3px_4px_0_rgba(244,122,0,.14)]" : "border-[#DED9D1] bg-white hover:border-[#F0B878]"}`}
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
                  disabled={!firstStepValid}
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
                      value={formatPhone(form.phone)}
                      onChange={(e) =>
                        update("phone", normalizePhone(e.target.value))
                      }
                      required
                      maxLength={15}
                      className={`field mt-2 ${
                        phoneComplete
                          ? phoneValid
                            ? "border-emerald-500"
                            : "border-red-400"
                          : ""
                      }`}
                      placeholder="(61) 99999-0000"
                      inputMode="tel"
                      autoComplete="tel"
                      aria-invalid={phoneComplete && !phoneValid}
                    />
                    <span
                      className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                        phoneComplete && !phoneValid
                          ? "text-red-600"
                          : phoneValid
                            ? "text-emerald-700"
                            : "text-[#667085]"
                      }`}
                    >
                      {phoneValid && <CircleCheck size={14} />}
                      {phoneComplete && !phoneValid
                        ? "Informe um DDD e um número de telefone válidos."
                        : phoneValid
                          ? "Telefone válido."
                          : "Informe o DDD e o número do telefone."}
                    </span>
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
                    disabled={loading || !cpfValid || !phoneValid}
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
        </div>
      </section>
    </main>
  );
}
