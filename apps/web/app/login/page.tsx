"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("fixsi_token", res.data.token);
      localStorage.setItem("fixsi_user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Botão Voltar */}
      <Link
        href="/"
        className="fixed top-6 right-6 text-white px-6 py-2 rounded-lg font-medium"
        style={{ backgroundColor: "#F97316" }}
      >
        Voltar
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-100 rounded-3xl p-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏠</span>
          <span className="text-2xl font-bold" style={{ color: "#1E3A5F" }}>
            Fixsi
          </span>
        </div>

        {/* Ícone usuário */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-3xl">👤</span>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-full bg-gray-200 text-gray-700 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#F97316" } as any}
          />
          <div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3 rounded-full bg-gray-200 text-gray-700 focus:outline-none"
            />
            <div className="text-right mt-1">
              <Link href="/forgot-password" className="text-sm" style={{ color: "#F97316" }}>
                Esqueci minha senha!
              </Link>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-white font-medium hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#F97316" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-gray-500 text-sm">
          Não possui senha?{" "}
          <Link href="/register" style={{ color: "#F97316" }} className="font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>

      {/* Barra laranja */}
      <div className="fixed bottom-0 left-0 right-0 h-2" style={{ backgroundColor: "#F97316" }} />
    </div>
  );
}