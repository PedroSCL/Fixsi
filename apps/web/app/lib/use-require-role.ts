"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  clearLegacyAuthStorage,
  isUnauthorized,
  notifyAuthChanged,
} from "./api";

export function useRequireRole(role: string) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (data.user.roles?.includes(role)) {
          setAllowed(true);
          return;
        }
        router.replace("/dashboard");
      })
      .catch((error: unknown) => {
        if (isUnauthorized(error)) {
          clearLegacyAuthStorage();
          notifyAuthChanged();
          router.replace("/login");
          return;
        }
        router.replace("/dashboard");
      });
  }, [role, router]);

  return allowed;
}
