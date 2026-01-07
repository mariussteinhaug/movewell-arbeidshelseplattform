// Centralized role and access helpers (simple, robust for MVP)

export const ROLE = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  HR: "hr",
  ADMIN: "admin", // built-in fallback (treated as HR)
};

// Normalize from either a user object or a raw role string
export function normalizeRole(input) {
  if (!input) return ROLE.EMPLOYEE;

  // If user object passed
  if (typeof input === "object") {
    const appRole = String(input.app_role || "").toLowerCase();
    if (appRole === "owner") return ROLE.HR; // owner treated as HR-level access
    if ([ROLE.HR, ROLE.MANAGER, ROLE.EMPLOYEE].includes(appRole)) return appRole;

    // fallback to built-in role
    const raw = String(input.role || "").toLowerCase();
    if (raw === "admin") return ROLE.HR; // admin ≈ HR in this app
    if (["manager", "leader", "leder"].includes(raw)) return ROLE.MANAGER;
    if (raw === "hr") return ROLE.HR;
    return ROLE.EMPLOYEE;
  }

  // If string passed
  const r = String(input).toLowerCase();
  if (r === "hr") return ROLE.HR;
  if (["manager", "leader", "leder"].includes(r)) return ROLE.MANAGER;
  if (r === "admin") return ROLE.HR;
  return ROLE.EMPLOYEE;
}

// Accepts either normalized role string, raw role string, or user object
export function hasRole(subject, allowedRoles = []) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const role = typeof subject === "string" ? normalizeRole(subject) : normalizeRole(subject);
  return allowedRoles.includes(role);
}

// Derive access scope for queries
export function accessScopeFromUser(user) {
  const role = normalizeRole(user);
  const organization_id = user?.organization_id || "default";
  if (role === ROLE.MANAGER) {
    return { organization_id, department_id: user?.department_id || null };
  }
  return { organization_id };
}