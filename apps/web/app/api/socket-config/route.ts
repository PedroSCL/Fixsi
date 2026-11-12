import { NextResponse } from "next/server";

// Mantém a configuração no servidor da Vercel. O navegador recebe apenas o
// endereço público necessário para a conexão em tempo real, nunca segredos.
export function GET() {
  const apiUrl = (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");

  if (!apiUrl) {
    return NextResponse.json(
      { error: "API de mensagens não configurada" },
      { status: 503 },
    );
  }

  return NextResponse.json({ apiUrl });
}
