import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function apiErrorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError(error)
    ? error.response?.data?.error || fallback
    : fallback;
}

// Interceptor — adiciona o token JWT em toda requisição automaticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("fixsi_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Tipos que vamos usar no frontend
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  token: string;
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
