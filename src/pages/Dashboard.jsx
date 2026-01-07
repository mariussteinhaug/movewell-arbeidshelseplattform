import React, { useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Lazy load heavy charts for performance
const DepartmentRiskChart = lazy(() =>
  import("../components/dashboard/DepartmentRiskChart")
);
const TrendChart = lazy(() => import("../components/dashboard/TrendChart"));
const AlertList = lazy(() => import("../components/dashboard/AlertList"));

/* ---------------------------
   Roles (MoveWell)
--------------------------- */
const ROLE = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  HR: "hr",
  ADMIN: "admin",
};

function normalizeRole(rawRole) {
  if (!rawRole) return ROLE.EMPLOYEE;
  const r = String(rawRole).toLowerCase();
  if (r === "hr") return ROLE.HR;
  if (["manager", "leader", "leder"].includes(r)) return ROLE.MANAGER;
  if (r === "admin") return ROLE.ADMIN;
  return ROLE.EMPLOYEE;
}

function getManagedDepartmentKeys(user) {
  const ids = Array.isArray(user?.managed_department_ids)
    ? user.managed_department_ids
    : [];
  const singleId = user?.department_id ? [user.department_id] : [];
  const singleName = user?.department ? [user.department] : [];
  return {
    ids: Array.from(new Set([...ids, ...singleId])),
    names: Array.from(new Set([...singleName])),
  };
}

/* ---------------------------
   Time ranges
--------------------------- */
const RANGE = {
  TODAY: "today",
  D7: "7d",
  D14: "14d",
  D30: "30d",
  M6: "6m",
  Y1: "1y",
  Y3: "3y",
  ALL: "all",
};

const RANGE_LABEL = {
  [RANGE.TODAY]: "I dag",
  [RANGE.D7]: "Siste 7 dager",
  [RANGE.D14]: "Siste 14 dager",
  [RANGE.D30]: "Siste 30 dager",
  [RANGE.M6]: "Siste 6 mnd",
  [RANGE.Y1]: "Siste 1 år",
  [RANGE.Y3]: "Siste 3 år",
  [RANGE.ALL]: "All tid",
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => new Date(new Date(d).setDate(d.getDate() + n));
const addMonths = (d, n) => new Date(new Date(d).setMonth(d.getMonth() + n));
const addYears = (d, n) => new Date(new Date(d).setFullYear(d.getFullYear() + n));

function getRangeStart(rangeKey) {
  const today = startOfDay(new Date());
  switch (rangeKey) {
    case RANGE.TODAY:
      return today;
    case RANGE.D7:
      return addDays(today, -7);
    case RANGE.D14:
      return addDays(today, -14);
    case RANGE.D30:
      return addDays(today, -30);
    case RANGE.M6:
      return addMonths(today, -6);
    case RANGE.Y1:
      return addYears(today, -1);
    case RANGE.Y3:
      return addYears(today, -3);
    default:
      return null;
  }
}

/* ---------------------------
   Utils
--------------------------- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const avg = (nums) => (nums?.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const to10From5 = (v) => clamp(Number(v) * 2 || 0, 0, 10);
const riskBand10 = (s) => (s >= 7.5 ? "good" : s >= 5 ? "warn" : "bad");
const bandLabel = (s) =>
  riskBand10(s) === "good" ? "God" : riskBand10(s) === "warn" ? "Moderat" : "Høy risiko";

/* ---------------------------
   Segmented Control
--------------------------- */
function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-white/70 backdrop-blur px-1 py-1 border border-slate-200 shadow-sm">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-300",
              active
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------
   Panel & StatCard
--------------------------- */
function Panel({ title, subtitle, icon: Icon, right, children, className }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white/80 backdrop-blur shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden",
        className
      )}
    >
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <span
                className="h-8 w-8 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-sm"
                aria-label={`${title} ikon`}
              >
                <Icon className="h-4 w-4" />
              </span>
            )}
            <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
          </div>
          {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, chip }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-semibold text-slate-900">{value}</span>
            {chip && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {chip}
              </span>
            )}
          </div>
          {hint && <p className="text-sm text-slate-500 mt-2">{hint}</p>}
        </div>
        {Icon && (
          <span
            className="h-10 w-10 rounded-2xl bg-slate-100 grid place-items-center"
            aria-label={`${label} ikon`}
          >
            <Icon className="h-5 w-5 text-slate-700" />
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------------------------
   Main Dashboard
--------------------------- */
export default function Dashboard() {
  const [range, setRange] = useState(RANGE.D30);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const role = normalizeRole(currentUser?.role);
  const canSeeDashboard = role === ROLE.HR || role === ROLE.MANAGER || role === ROLE.ADMIN;
  const scope = useMemo(() => getManagedDepartmentKeys(currentUser), [currentUser?.id]);

  const { data: assessmentsRaw = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => base44.entities.HealthAssessment.filter({ organization_id: currentUser?.organization_id }, "-created_date", 500),
    enabled: !!currentUser && canSeeDashboard,
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => base44.entities.Department.filter({ organization_id: currentUser?.organization_id }),
    enabled: !!currentUser && canSeeDashboard,
  });

  const { data: sessionsAll = [] } = useQuery({
    queryKey: ["assessment-sessions"],
    queryFn: () => base44.entities.AssessmentSession.filter({ organization_id: currentUser?.organization_id }, "-created_date", 500),
    enabled: !!currentUser && canSeeDashboard,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () =>
      base44.entities.ActionRecommendation.filter(
        { status: "ny", organization_id: currentUser?.organization_id },
        "-created_date",
        10
      ),
    enabled: !!currentUser && canSeeDashboard,
  });

  // Meldinger (for varsler i dag)
  const { data: messagesAll = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.Message.filter({ organization_id: currentUser?.organization_id }, "-sent_at", 200),
    enabled: !!currentUser && canSeeDashboard,
  });

  const scopedAssessments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR || role === ROLE.ADMIN) return assessmentsRaw;
    return assessmentsRaw.filter(
      (a) =>
        scope.ids.includes(a.department_id) ||
        scope.names.includes(a.department)
    );
  }, [assessmentsRaw, role, scope]);

  const scopedDepartments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR || role === ROLE.ADMIN) return departments;
    return departments.filter(
      (d) => scope.ids.includes(d.id) || scope.names.includes(d.name)
    );
  }, [departments, role, scope]);

  const scopedRecommendations = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR || role === ROLE.ADMIN) return recommendations;
    return recommendations.filter(
      (r) =>
        scope.ids.includes(r.department_id) || scope.names.includes(r.department)
    );
  }, [recommendations, role, scope]);

  const scopedSessions = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR || role === ROLE.ADMIN) return sessionsAll;
    return sessionsAll.filter(
      (s) =>
        scope.ids.includes(s.department_id) ||
        scope.names.includes(s.department || s.department_name)
    );
  }, [sessionsAll, role, scope]);

  const start = useMemo(() => getRangeStart(range), [range]);

  const alertsToday = useMemo(() => {
    const startMs = startOfDay(new Date()).getTime();
    const msgs = messagesAll || [];
    return msgs.filter((m) => {
      if (m.type !== "broadcast") return false;
      const ts = m.sent_at ? new Date(m.sent_at).getTime() : 0;
      if (ts < startMs) return false;
      if (role === ROLE.HR || role === ROLE.ADMIN) return true;
      return scope.ids.includes(m.recipient_department_id);
    }).length;
  }, [messagesAll, role, scope]);
  const timeFilteredAssessments = useMemo(() => {
    if (!start) return scopedAssessments;
    const startMs = start.getTime();
    return scopedAssessments.filter((a) => {
      const cd = new Date(a.created_date);
      return cd && cd.getTime() >= startMs;
    });
  }, [scopedAssessments, start]);

  const timeFilteredSessions = useMemo(() => {
    if (!start) return scopedSessions;
    const startMs = start.getTime();
    return scopedSessions.filter((s) => {
      const ts = new Date(s.created_at || s.completed_at || s.created_date).getTime();
      return ts >= startMs;
    });
  }, [scopedSessions, start]);

  const stats10 = useMemo(() => {
    if (!timeFilteredAssessments.length) return null;
    const physical10 = avg(timeFilteredAssessments.map((a) => to10From5(a.physical_load)));
    const mental10 = avg(timeFilteredAssessments.map((a) => to10From5(a.mental_wellbeing)));
    const work10 = avg(timeFilteredAssessments.map((a) => to10From5(a.work_environment)));
    return { physical10, mental10, work10, responses: timeFilteredAssessments.length };
  }, [timeFilteredAssessments]);

  const healthIndex10 =
    (stats10?.physical10 + stats10?.mental10 + stats10?.work10) / 3 || 0;

  const departmentChartData = useMemo(() => {
    const map = new Map();

    // HealthAssessment (nye skjema)
    (timeFilteredAssessments || []).forEach((a) => {
      const name = a.department || a.department_name || "Ikke oppgitt";
      const overall5 = avg([
        a.physical_load,
        a.mental_wellbeing,
        a.work_environment,
      ]);
      if (!map.has(name)) {
        map.set(name, { name, scores: [], respondent_count: 0 });
      }
      const entry = map.get(name);
      entry.scores.push(Number(overall5) || 0);
      entry.respondent_count += 1;
    });

    // AssessmentSession (gamle kartleggingstester)
    const riskToScore = (lvl) => (lvl === "low" ? 4 : lvl === "high" ? 2 : 3);
    (timeFilteredSessions || []).forEach((s) => {
      const name = s.department_name || s.department || "Ikke oppgitt";
      const overall5 = riskToScore(String(s.risk_level || "moderate"));
      if (!map.has(name)) {
        map.set(name, { name, scores: [], respondent_count: 0 });
      }
      const entry = map.get(name);
      entry.scores.push(Number(overall5) || 0);
      entry.respondent_count += 1;
    });

    return Array.from(map.values()).map((e) => ({
      name: e.name,
      score: avg(e.scores) || 0,
      respondent_count: e.respondent_count,
    }));
  }, [timeFilteredAssessments, timeFilteredSessions]);

  const responseRate = useMemo(() => {
    if (!stats10) return 0;
    const totalEmployees = scopedDepartments.reduce(
      (sum, d) => sum + (Number(d.employee_count) || 0),
      0
    );
    return clamp((stats10.responses / (totalEmployees || 50)) * 100, 0, 100);
  }, [stats10, scopedDepartments]);

  const band = bandLabel(healthIndex10);
  const bandChip =
    riskBand10(healthIndex10) === "good"
      ? "Stabil"
      : riskBand10(healthIndex10) === "warn"
      ? "Følg med"
      : "Tiltak";

  const isLoading = loadingAssessments || loadingDepartments;

  if (currentUser && !canSeeDashboard) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold text-slate-900">Ingen tilgang</h2>
          <p className="text-slate-600 mt-2">
            Denne siden er kun tilgjengelig for HR og ledere.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
      <div className="fixed inset-0 -z-10 opacity-70 [background:radial-gradient(40%_30%_at_20%_10%,rgba(59,130,246,0.10),transparent),radial-gradient(35%_25%_at_80%_20%,rgba(16,185,129,0.10),transparent),radial-gradient(35%_30%_at_60%_80%,rgba(245,158,11,0.10),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/60 backdrop-blur border-b border-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 truncate">
                Dashboard
              </h1>
            </div>
            <Segmented
              value={range}
              onChange={setRange}
              options={Object.entries(RANGE_LABEL).map(([v, l]) => ({
                value: v,
                label: l,
              }))}
            />
          </div>
        </div>

        <Suspense
          fallback={
            <div className="grid gap-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          }
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : stats10 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <StatCard
                  label="Svarprosent"
                  value={`${Math.round(responseRate)}%`}
                  hint="Andel ansatte som har svart i perioden"
                  icon={Users}
                  chip="Live"
                />
                <StatCard
                  label="Svar"
                  value={`${stats10.responses}`}
                  hint="Antall innsendte kartlegginger"
                  icon={Activity}
                  chip={RANGE_LABEL[range]}
                />
                <StatCard
                  label="Status"
                  value={band}
                  hint={`Basert på helseindeks (${healthIndex10.toFixed(1)}/10)`}
                  icon={ArrowUpRight}
                  chip={bandChip}
                />
                <StatCard
                  label="Varsler i dag"
                  value={`${alertsToday}`}
                  hint="AI/system-varsler sendt i dag"
                  icon={BarChart3}
                />
              </div>
              {/* Charts */}
              <div className="lg:col-span-8">
                <DepartmentRiskChart data={departmentChartData} />
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <RefreshCw className="h-10 w-10 mx-auto mb-3" />
              Ingen data for valgt periode
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}