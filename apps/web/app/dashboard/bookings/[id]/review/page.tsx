"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { api } from "../../../../lib/api";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post(`/reviews/bookings/${id}/review`, {
        rating,
        comment: comment.trim() || undefined,
      });
      setSuccess(data.message);
    } catch (caught) {
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.error ||
              "Não foi possível registrar a avaliação."
          : "Não foi possível registrar a avaliação.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell max-w-2xl py-10">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar aos agendamentos
      </Link>
      <section className="surface-card mt-8 p-6 sm:p-10">
        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto text-[#F97316]" size={52} />
            <h1 className="mt-5 text-2xl font-extrabold text-[#17233B]">
              Avaliação registrada
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[#667085]">{success}</p>
            <button
              onClick={() => router.push("/dashboard/bookings")}
              className="btn-primary mt-7"
            >
              Voltar aos pedidos
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow">Sua experiência</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
              Como foi o atendimento?
            </h1>
            <p className="mt-3 text-[#667085]">
              Sua avaliação ajuda outras pessoas a contratar com mais confiança.
            </p>
            <form onSubmit={submit} className="mt-8">
              <fieldset>
                <legend className="text-sm font-extrabold text-[#17233B]">
                  Nota de 1 a 5
                </legend>
                <div
                  className="mt-3 flex gap-2"
                  aria-label={`${rating} de 5 estrelas`}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`${value} estrelas`}
                      className="rounded-xl p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
                    >
                      <Star
                        size={32}
                        className={
                          value <= rating
                            ? "fill-[#FFB15A] text-[#D99A08]"
                            : "text-[#CAD8D5]"
                        }
                      />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-extrabold text-[#17233B]">
                  Conte um pouco mais (opcional)
                </span>
                <textarea
                  className="field min-h-32 resize-y"
                  maxLength={500}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Pontualidade, qualidade, comunicação..."
                />
                <span className="mt-1 block text-right text-xs text-[#667085]">
                  {comment.length}/500
                </span>
              </label>
              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                >
                  {error}
                </p>
              )}
              <button className="btn-primary mt-6 w-full" disabled={saving}>
                {saving ? "Enviando..." : "Enviar avaliação"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
