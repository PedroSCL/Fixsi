"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarX2,
  Check,
  Trash2,
} from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { useRequireRole } from "../../lib/use-require-role";

const DAYS = [
  { value: 0, short: "Dom", label: "Domingo" },
  { value: 1, short: "Seg", label: "Segunda" },
  { value: 2, short: "Ter", label: "Terça" },
  { value: 3, short: "Qua", label: "Quarta" },
  { value: 4, short: "Qui", label: "Quinta" },
  { value: 5, short: "Sex", label: "Sexta" },
  { value: 6, short: "Sáb", label: "Sábado" },
];

interface Exception {
  date: string;
  available: boolean;
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function AvailabilityPage() {
  const allowed = useRequireRole("PROFESSIONAL");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/availability/me/settings");
      setWeekdays(data.weekdays);
      setExceptions(data.exceptions);
    } catch (requestError) {
      setError(
        apiErrorMessage(requestError, "Não foi possível carregar sua agenda"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort(),
    );
    setMessage("");
  }

  async function saveWeekdays() {
    if (!weekdays.length) {
      setError("Selecione pelo menos um dia de atendimento");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put("/availability/me/weekdays", { weekdays });
      setMessage("Dias de atendimento atualizados.");
    } catch (requestError) {
      setError(
        apiErrorMessage(requestError, "Não foi possível salvar os dias"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function addBlockedDate() {
    if (!date) {
      setError("Escolha a data que deseja bloquear");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put("/availability/me/exceptions", {
        date,
        available: false,
      });
      setDate("");
      setMessage("Data bloqueada na sua agenda.");
      await load();
    } catch (requestError) {
      setError(
        apiErrorMessage(requestError, "Não foi possível bloquear a data"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeException(item: Exception) {
    setSaving(true);
    setError("");
    try {
      await api.delete(`/availability/me/exceptions/${item.date}`);
      setExceptions((current) =>
        current.filter((exception) => exception.date !== item.date),
      );
      setMessage("A data voltou a seguir sua agenda semanal.");
    } catch (requestError) {
      setError(
        apiErrorMessage(requestError, "Não foi possível liberar a data"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!allowed || loading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Carregando disponibilidade...
      </div>
    );
  }

  return (
    <main className="page-shell max-w-4xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>

      <header className="mt-7">
        <p className="eyebrow">Agenda profissional</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
          Minha disponibilidade
        </h1>
        <p className="mt-2 max-w-2xl text-[#667085]">
          Defina os dias em que você trabalha e bloqueie folgas específicas. Os
          clientes verão somente as datas disponíveis.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <Check size={17} /> {message}
        </div>
      )}

      <section className="surface-card mt-8 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316]">
            <CalendarCheck size={22} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-[#17233B]">
              Semana padrão
            </h2>
            <p className="mt-1 text-sm text-[#667085]">
              Selecione os dias em que normalmente aceita serviços.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((day) => {
            const active = weekdays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                title={day.label}
                aria-pressed={active}
                onClick={() => toggleWeekday(day.value)}
                className={`rounded-xl border-2 px-2 py-3 text-sm font-extrabold transition ${
                  active
                    ? "border-[#F47A00] bg-[#FFF1E8] text-[#D96500]"
                    : "border-[#DED9D1] bg-white text-[#7B8290]"
                }`}
              >
                {day.short}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={saveWeekdays}
          disabled={saving}
          className="btn-primary mt-6 disabled:opacity-60"
        >
          Salvar dias de atendimento
        </button>
      </section>

      <section className="surface-card mt-6 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316]">
            <CalendarX2 size={22} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-[#17233B]">
              Folgas e bloqueios
            </h2>
            <p className="mt-1 text-sm text-[#667085]">
              Bloqueie uma data sem alterar os demais dias da semana.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="date"
            min={localToday()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="field flex-1"
          />
          <button
            type="button"
            onClick={addBlockedDate}
            disabled={saving}
            className="btn-secondary disabled:opacity-60"
          >
            Bloquear data
          </button>
        </div>

        {exceptions.filter((item) => !item.available).length > 0 && (
          <div className="mt-6 divide-y divide-[#EEEAE4] rounded-xl border border-[#EEEAE4] px-4">
            {exceptions
              .filter((item) => !item.available)
              .map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="font-bold text-[#17233B]">
                    {item.date.split("-").reverse().join("/")}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeException(item)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 text-sm font-bold text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={16} /> Remover bloqueio
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}
