"use client";
/* eslint-disable @next/next/no-img-element -- o QR Code é uma imagem base64 retornada pelo provedor de pagamentos */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  Copy,
  FlaskConical,
  LockKeyhole,
  QrCode,
} from "lucide-react";
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
  const [environment, setEnvironment] = useState<
    "sandbox" | "production" | null
  >(null);
  const needsCpfCorrection = /cpf|cnpj/i.test(error);
  const isSandbox = environment === "sandbox";

  useEffect(() => {
    api
      .get("/payments/environment")
      .then(({ data }) => setEnvironment(data.environment))
      .catch(() => {
        // O checkout continuará exibindo erros normalmente caso a consulta
        // informativa do ambiente não esteja disponível.
      });
  }, []);

  async function createPayment() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/payments/checkout", { bookingId: id });
      setPayment(data.payment);
      setEnvironment(data.environment);
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

        {isSandbox && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <FlaskConical className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-extrabold">Ambiente de teste do Asaas</p>
              <p className="mt-1 leading-6">
                Este PIX não movimenta dinheiro e não deve ser pago pelo
                aplicativo do seu banco. Para simular o pagamento, abra a
                cobrança no painel Sandbox do Asaas e use a opção de confirmar
                pagamento.
              </p>
              <a
                href="https://sandbox.asaas.com/"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex font-extrabold text-amber-900 underline underline-offset-2"
              >
                Abrir painel Sandbox do Asaas
              </a>
            </div>
          </div>
        )}

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
              <div
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
              >
                <p>{error}</p>
                {needsCpfCorrection && (
                  <Link
                    href="/profile/edit"
                    className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-red-700 shadow-sm hover:bg-red-100"
                  >
                    Corrigir CPF no perfil
                  </Link>
                )}
              </div>
            )}
            <button
              onClick={createPayment}
              disabled={loading}
              className="btn-primary mt-6 w-full"
            >
              {loading
                ? "Gerando PIX..."
                : isSandbox
                  ? "Gerar QR Code de teste"
                  : "Gerar QR Code PIX"}
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
                {isSandbox
                  ? "Após confirmar a cobrança no painel Sandbox, a atualização pode levar alguns instantes."
                  : "Após o pagamento, a atualização pode levar alguns instantes."}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
