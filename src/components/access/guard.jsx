import React from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { ROLE, normalizeRole, hasRole } from "./role";

export function useRequireRoles(allowedRoles = [ROLE.EMPLOYEE], fallbackPage = "Assessment") {
  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          const next = window.location.pathname + window.location.search;
          await base44.auth.redirectToLogin(next);
          return;
        }
        const me = await base44.auth.me();
        if (!mounted) return;
        const role = normalizeRole(me);
        if (!hasRole(role, allowedRoles)) {
          window.location.href = createPageUrl(fallbackPage);
        }
      } catch (_) {
        // On error, be safe and redirect to login
        const next = window.location.pathname + window.location.search;
        await base44.auth.redirectToLogin(next);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [allowedRoles, fallbackPage]);
}

export { ROLE };