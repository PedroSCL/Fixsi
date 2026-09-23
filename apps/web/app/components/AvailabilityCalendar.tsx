"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";

interface Props {
  professionalId: string;
  selected: string;
  onSelect: (date: string) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const now = new Date();
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function AvailabilityCalendar({
  professionalId,
  selected,
  onSelect,
}: Props) {
  const now = new Date();
  const [month, setMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [available, setAvailable] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const firstAllowedMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthStart = dateKey(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const monthEnd = dateKey(year, monthIndex, lastDay);
  const from = monthStart < todayKey() ? todayKey() : monthStart;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(`/availability/${professionalId}`, {
        params: { from, to: monthEnd },
      })
      .then(({ data }) => {
        if (active) setAvailable(new Set(data.availableDates));
      })
      .catch((requestError: unknown) => {
        if (active) {
          setAvailable(new Set());
          setError(
            apiErrorMessage(requestError, "Não foi possível carregar a agenda"),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [professionalId, from, monthEnd]);

  const days = useMemo(() => {
    const leading = new Date(year, monthIndex, 1).getDay();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: lastDay }, (_, index) => index + 1),
    ];
  }, [year, monthIndex, lastDay]);

  const canGoBack = month > firstAllowedMonth;
  const label = month.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-3 rounded-xl border border-[#DED9D1] bg-[#FFFCF8] p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          disabled={!canGoBack}
          onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#17233B] hover:bg-[#FFF1E8] disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ChevronLeft size={18} />
        </button>
        <strong className="capitalize text-sm text-[#17233B]">{label}</strong>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#17233B] hover:bg-[#FFF1E8]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-bold text-[#7B8290]">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="relative grid min-h-48 grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const key = dateKey(year, monthIndex, day);
          const enabled = available.has(key);
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!enabled || loading}
              onClick={() => onSelect(key)}
              aria-label={`${day} de ${label}`}
              aria-pressed={active}
              className={`aspect-square rounded-lg text-sm font-bold transition ${
                active
                  ? "bg-[#F47A00] text-white shadow-sm"
                  : enabled
                    ? "bg-[#FFF1E8] text-[#D96500] hover:bg-[#FBD9BC]"
                    : "cursor-not-allowed text-[#C7C2BA] line-through"
              }`}
            >
              {day}
            </button>
          );
        })}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/75 text-[#F47A00]">
            <LoaderCircle className="animate-spin" size={24} />
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-[#667085]">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-[#FFF1E8]" /> Disponível
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-[#E8E5E0]" /> Indisponível
          </span>
        </div>
      )}
    </div>
  );
}
