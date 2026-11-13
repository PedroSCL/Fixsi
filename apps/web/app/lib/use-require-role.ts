"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  clearLegacyAuthStorage,
  isUnauthorized,
  notifyAuthChanged,
} from "./api";

export function useRequireRole(role: string | string[]) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const rolesKey = Array.isArray(role) ? role.join(",") : role;

  useEffect(() => {
    const requiredRoles = rolesKey.split(",");
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (requiredRoles.some((item) => data.user.roles?.includes(item))) {
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
  }, [rolesKey, router]);

  return allowed;
}
