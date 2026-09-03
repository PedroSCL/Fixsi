"use client";
/* eslint-disable @next/next/no-img-element -- a foto de perfil aceita uma URL externa cadastrada pelo usuário */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { api, clearLegacyAuthStorage, notifyAuthChanged } from "../lib/api";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  createdAt: string;
  roles: string[];
}

const roleNames: Record<string, string> = {
  CLIENT: "Cliente",
  PROFESSIONAL: "Profissional",
  LOCADOR: "Locador",
  ADMIN: "Administrador",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setProfile(data.user))
      .catch((caught: unknown) => {
        if (axios.isAxiosError(caught) && caught.response?.status === 401) {
          clearLegacyAuthStorage();
          notifyAuthChanged();
          router.replace("/login");
          return;
        }
        setError(
          axios.isAxiosError(caught) && caught.response?.status === 404
            ? "A API conectada ainda não possui a nova rota de perfil. Use a API local atualizada ou publique a nova versão da API."
            : "Não foi possível carregar seu perfil. Verifique se a API está disponível.",
        );
      });
  }, [router]);

  return (
    <main className="page-shell max-w-4xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>

      {!profile ? (
        <div className="surface-card mt-8 p-10 text-center text-[#667085]">
          {error || "Carregando perfil..."}
        </div>
      ) : (
        <section className="mt-8 overflow-hidden rounded-xl border-2 border-[#20365C] bg-white shadow-[7px_8px_0_rgba(32,54,92,.1)]">
          <div className="relative overflow-hidden bg-[#20365C] px-6 py-8 text-white sm:px-10">
            <span className="absolute -right-14 -top-24 h-56 w-56 rounded-full border-[34px] border-[#F47A00]/40" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-24 w-24 rounded-full border-4 border-white/30 object-cover"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-extrabold text-[#F97316]">
                  {profile.name[0]?.toUpperCase()}
                </span>
              )}
              <div className="flex-1">
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#FFC56E]">
                  Meu perfil
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em]">
                  {profile.name}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold"
                    >
                      {roleNames[role] || role}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-[#F97316]"
              >
                <Pencil size={17} /> Editar perfil
              </Link>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-10">
            <Info icon={Mail} label="E-mail" value={profile.email} />
            <Info icon={Phone} label="Telefone" value={profile.phone} />
            <Info
              icon={CalendarDays}
              label="Na Fixsi desde"
              value={new Date(profile.createdAt).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            />
            <Info
              icon={ShieldCheck}
              label="Conta"
              value="Dados protegidos e acesso autenticado"
            />
          </div>
        </section>
      )}
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E7E2DA] bg-[#FCFBF9] p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316]">
        <Icon size={19} />
      </span>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-[.13em] text-[#667085]">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-[#17233B]">{value}</p>
    </div>
  );
}
