// Centralized role and access helpers (simple, robust for MVP)

export const ROLE = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  HR: "hr",
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
    const deptIds = Array.isArray(user?.managed_department_ids) 
      ? user.managed_department_ids 
      : [];
    if (user?.department_id && !deptIds.includes(user.department_id)) {
      deptIds.push(user.department_id);
    }
    return { organization_id, department_ids: deptIds, department_id: user?.department_id || null };
  }
  return { organization_id };
}

// Check if user can access a specific department
export function canAccessDepartment(user, departmentId) {
  const role = normalizeRole(user);
  if (role === ROLE.HR) return true;
  if (role === ROLE.MANAGER) {
    const scope = accessScopeFromUser(user);
    return scope.department_ids?.includes(departmentId) || scope.department_id === departmentId;
  }
  return user?.department_id === departmentId;
}

// Check if user can access employee data
export function canAccessEmployee(user, employeeDepartmentId) {
  const role = normalizeRole(user);
  if (role === ROLE.HR) return true;
  if (role === ROLE.MANAGER) {
    return canAccessDepartment(user, employeeDepartmentId);
  }
  return false; // Employees cannot access other employees
}