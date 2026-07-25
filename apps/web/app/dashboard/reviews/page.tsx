"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquareQuote, Star } from "lucide-react";
import { api } from "../../lib/api";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { name: string; avatarUrl: string | null };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => api.get(`/reviews/users/${data.user.id}/reviews`))
      .then(({ data }) => {
        setReviews(data.reviews);
        setAverage(data.average);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell max-w-4xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>
      <header className="mt-7">
        <p className="eyebrow">Reputação</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
          Suas avaliações
        </h1>
        <p className="mt-2 text-[#667085]">
          Comentários publicados depois que as duas partes avaliam.
        </p>
      </header>
      {loading ? (
        <div className="surface-card mt-8 p-10 text-center text-[#667085]">
          Carregando avaliações...
        </div>
      ) : reviews.length === 0 ? (
        <div className="surface-card mt-8 p-10 text-center">
          <MessageSquareQuote className="mx-auto text-[#F97316]" size={40} />
          <h2 className="mt-4 text-xl font-extrabold text-[#17233B]">
            Nenhuma avaliação publicada
          </h2>
          <p className="mt-2 text-[#667085]">
            Quando uma negociação for concluída e avaliada, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="surface-card mt-8 flex items-center gap-4 p-6">
            <span className="text-4xl font-extrabold text-[#17233B]">
              {average.toFixed(1)}
            </span>
            <div>
              <Stars value={Math.round(average)} />
              <p className="mt-1 text-sm text-[#667085]">
                {reviews.length}{" "}
                {reviews.length === 1 ? "avaliação" : "avaliações"}
              </p>
            </div>
          </div>
          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF1E8] font-extrabold text-[#F97316]">
                    {review.author.name[0]}
                  </span>
                  <div>
                    <h2 className="font-extrabold text-[#17233B]">
                      {review.author.name}
                    </h2>
                    <Stars value={review.rating} />
                  </div>
                </div>
                <p className="mt-5 leading-7 text-[#475467]">
                  {review.comment || "Avaliação sem comentário."}
                </p>
                <p className="mt-4 text-xs font-semibold text-[#667085]">
                  {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
          className={
            star <= value ? "fill-[#FFB15A] text-[#D99A08]" : "text-[#CAD8D5]"
          }
        />
      ))}
    </span>
  );
}
