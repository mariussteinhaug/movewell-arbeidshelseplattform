import React from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { ROLE, normalizeRole, hasRole, accessScopeFromUser, canAccessDepartment, canAccessEmployee } from "./role";

/**
 * Hook to enforce role-based access on a page.
 * Redirects to login if not authenticated.
 * Redirects to fallbackPage if user doesn't have required role.
 * Returns { user, role, isLoading, scope } for convenience.
 */
export function useRequireRoles(allowedRoles = [ROLE.EMPLOYEE], fallbackPage = "Assessment") {
  const [state, setState] = React.useState({
    user: null,
    role: null,
    isLoading: true,
    scope: null,
  });

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
        
        const userRole = normalizeRole(me);
        const userScope = accessScopeFromUser(me);
        
        if (!hasRole(userRole, allowedRoles)) {
          window.location.href = createPageUrl(fallbackPage);
          return;
        }
        
        setState({
          user: me,
          role: userRole,
          isLoading: false,
          scope: userScope,
        });
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
  }, []);

  return state;
}

/**
 * Hook for pages accessible by all authenticated users.
 * Returns { user, role, isLoading, scope }.
 */
export function useAuth() {
  const [state, setState] = React.useState({
    user: null,
    role: null,
    isLoading: true,
    scope: null,
  });

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
        
        const userRole = normalizeRole(me);
        const userScope = accessScopeFromUser(me);
        
        setState({
          user: me,
          role: userRole,
          isLoading: false,
          scope: userScope,
        });
      } catch (_) {
        const next = window.location.pathname + window.location.search;
        await base44.auth.redirectToLogin(next);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

export { ROLE, normalizeRole, hasRole, accessScopeFromUser, canAccessDepartment, canAccessEmployee };