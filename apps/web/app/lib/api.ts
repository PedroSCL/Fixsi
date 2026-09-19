import axios, { InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  // A Vercel encaminha /api para o backend. Manter a chamada na mesma origem
  // evita bloqueios de cookies e de rede comuns em navegadores móveis.
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("fixsi_token");
  localStorage.removeItem("fixsi_user");
}

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("fixsi:auth-changed"));
  localStorage.setItem("fixsi_auth_event", Date.now().toString());
}

export function apiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  const fields = data?.fields;

  if (fields && typeof fields === "object") {
    for (const messages of Object.values(fields)) {
      if (Array.isArray(messages)) {
        const message = messages.find(
          (item): item is string => typeof item === "string" && item.length > 0,
        );
        if (message) return message;
      }
    }
  }

  return data?.error || fallback;
}

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

type RetryableRequest = InternalAxiosRequestConfig & {
  _fixsiRetried?: boolean;
};

let refreshRequest: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const request = error.config as RetryableRequest;
    const url = request.url || "";
    const isAuthenticationRequest = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
    ].some((path) => url.includes(path));

    if (
      error.response?.status !== 401 ||
      request._fixsiRetried ||
      isAuthenticationRequest
    ) {
      return Promise.reject(error);
    }

    request._fixsiRetried = true;

    try {
      refreshRequest ??= api
        .post("/auth/refresh")
        .then(() => undefined)
        .finally(() => {
          refreshRequest = null;
        });
      await refreshRequest;
      return api(request);
    } catch {
      clearLegacyAuthStorage();
      notifyAuthChanged();
      return Promise.reject(error);
    }
  },
);

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  roles: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  priceFrom: number | null;
  images: string[];
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  usageRules: string | null;
  images: string[];
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}
