"use client";
/* eslint-disable @next/next/no-img-element -- o QR Code é uma imagem base64 retornada pelo provedor de pagamentos */

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Check, Copy, LockKeyhole, QrCode } from "lucide-react";
import { api } from "../../../../lib/api";

interface Payment {
  id: string;
  amount: number;
  pixKey: string;
  pixQrCode: string;
  status: string;
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function createPayment() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/payments/checkout", { bookingId: id });
      setPayment(data.payment);
    } catch (caught) {
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.error || "Não foi possível gerar o PIX."
          : "Não foi possível gerar o PIX.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!payment?.pixKey) return;
    await navigator.clipboard.writeText(payment.pixKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="page-shell max-w-3xl py-10">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar aos agendamentos
      </Link>
      <section className="surface-card mt-8 p-6 sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1E8] text-[#F97316]">
          <QrCode size={28} />
        </div>
        <p className="eyebrow mt-6">Pagamento protegido</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
          Pague com PIX
        </h1>
        <p className="mt-3 max-w-xl text-[#667085]">
          A cobrança é criada pelo Asaas. O valor fica associado ao seu pedido e
          a Serveo confirma o pagamento automaticamente.
        </p>

        {!payment ? (
          <div className="mt-8 rounded-2xl border border-[#E7E2DA] bg-[#FCFBF9] p-6">
            <div className="flex items-start gap-3 text-sm text-[#475467]">
              <LockKeyhole
                className="mt-0.5 shrink-0 text-[#F97316]"
                size={19}
              />
              <p>
                Confira se você está no pedido correto. A cobrança só pode ser
                gerada pelo cliente responsável.
              </p>
            </div>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
              >
                {error}
              </p>
            )}
            <button
              onClick={createPayment}
              disabled={loading}
              className="btn-primary mt-6 w-full"
            >
              {loading ? "Gerando PIX..." : "Gerar QR Code PIX"}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
            <div className="rounded-2xl border border-[#E7E2DA] bg-white p-4">
              {payment.pixQrCode ? (
                <img
                  src={`data:image/png;base64,${payment.pixQrCode}`}
                  alt="QR Code para pagamento PIX"
                  className="aspect-square w-full"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-[#F1F6F5] text-[#667085]">
                  QR Code indisponível
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#667085]">
                Valor da cobrança
              </p>
              <p className="mt-1 text-3xl font-extrabold text-[#17233B]">
                {Number(payment.amount).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              <p className="mt-5 text-sm font-bold text-[#17233B]">
                PIX copia e cola
              </p>
              <div className="mt-2 rounded-xl border border-[#E7E2DA] bg-[#F8F7F4] p-3 text-xs text-[#475467] break-all">
                {payment.pixKey}
              </div>
              <button onClick={copyKey} className="btn-secondary mt-3 w-full">
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? "Código copiado" : "Copiar código PIX"}
              </button>
              <p className="mt-4 text-xs leading-5 text-[#667085]">
                Após o pagamento, a atualização pode levar alguns instantes.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
