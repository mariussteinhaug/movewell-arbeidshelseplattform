import React, { useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart3,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRequireRoles, ROLE, accessScopeFromUser } from "../components/access/guard";

// Lazy load heavy charts for performance
const DepartmentRiskChart = lazy(() =>
  import("../components/dashboard/DepartmentRiskChart")
);
const TrendChart = lazy(() => import("../components/dashboard/TrendChart"));
const AlertList = lazy(() => import("../components/dashboard/AlertList"));

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
   Time ranges (simplified)
--------------------------- */
const RANGE = {
  D7: "7d",
  D30: "30d",
  M6: "6m",
  Y1: "1y",
};

const RANGE_LABEL = {
  [RANGE.D7]: "7 dager",
  [RANGE.D30]: "30 dager",
  [RANGE.M6]: "6 mnd",
  [RANGE.Y1]: "1 år",
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
   Segmented Control (Apple-style)
--------------------------- */
function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex items-center rounded-xl bg-slate-100/80 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
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
   Metric Card (Apple-style)
--------------------------- */
function MetricCard({ label, value, change, positive }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-4xl font-semibold tracking-tight text-slate-900">{value}</span>
        {change && (
          <span className={cn(
            "text-sm font-medium",
            positive ? "text-emerald-600" : "text-slate-400"
          )}>
            {change}
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
  const { user: currentUser, role, isLoading: authLoading, scope: authScope } = useRequireRoles([ROLE.MANAGER, ROLE.HR], "Assessment");
  const [range, setRange] = useState(RANGE.D30);
  const [selectedDept, setSelectedDept] = useState(null);

  const canSeeDashboard = role === ROLE.HR || role === ROLE.MANAGER;
  const scope = useMemo(() => getManagedDepartmentKeys(currentUser), [currentUser?.id]);

  // All hooks must be called unconditionally - use enabled flag to control fetching
  const queryEnabled = !authLoading && !!currentUser;

  const { data: assessmentsRaw = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ["assessments", currentUser?.organization_id],
    queryFn: () => base44.entities.HealthAssessment.filter({ organization_id: currentUser?.organization_id }, "-created_date", 500),
    enabled: queryEnabled,
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ["departments", currentUser?.organization_id],
    queryFn: () => base44.entities.Department.filter({ organization_id: currentUser?.organization_id }),
    enabled: queryEnabled,
  });

  const { data: sessionsAll = [] } = useQuery({
    queryKey: ["assessment-sessions", currentUser?.organization_id],
    queryFn: () => base44.entities.AssessmentSession.filter({ organization_id: currentUser?.organization_id }, "-created_date", 500),
    enabled: queryEnabled,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations", currentUser?.organization_id],
    queryFn: () =>
      base44.entities.ActionRecommendation.filter(
        { status: "ny", organization_id: currentUser?.organization_id },
        "-created_date",
        10
      ),
    enabled: queryEnabled,
  });

  // Meldinger (for varsler i dag)
  const { data: messagesAll = [] } = useQuery({
    queryKey: ["messages", currentUser?.organization_id],
    queryFn: () => base44.entities.Message.filter({ organization_id: currentUser?.organization_id }, "-sent_at", 200),
    enabled: queryEnabled,
  });

  const scopedAssessments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return assessmentsRaw;
    return assessmentsRaw.filter(
      (a) =>
        scope.ids.includes(a.department_id) ||
        scope.names.includes(a.department)
    );
  }, [assessmentsRaw, role, scope]);

  const scopedDepartments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return departments;
    return departments.filter(
      (d) => scope.ids.includes(d.id) || scope.names.includes(d.name)
    );
  }, [departments, role, scope]);

  const scopedRecommendations = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return recommendations;
    return recommendations.filter(
      (r) =>
        scope.ids.includes(r.department_id) || scope.names.includes(r.department)
    );
  }, [recommendations, role, scope]);

  const scopedSessions = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return sessionsAll;
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
      if (role === ROLE.HR) return true;
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

  const isLoading = authLoading || loadingAssessments || loadingDepartments;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Oversikt over helsekartlegging</p>
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

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          }
        >
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          ) : stats10 ? (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <MetricCard
                  label="Svarprosent"
                  value={`${Math.round(responseRate)}%`}
                  change={responseRate >= 70 ? "God deltakelse" : null}
                  positive={responseRate >= 70}
                />
                <MetricCard
                  label="Helseindeks"
                  value={healthIndex10.toFixed(1)}
                  change={`av 10 • ${band}`}
                  positive={healthIndex10 >= 7}
                />
                <MetricCard
                  label="Kartlegginger"
                  value={stats10.responses}
                  change={RANGE_LABEL[range]}
                />
              </div>

              {/* Chart Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Avdelinger</h2>
                    <p className="text-sm text-slate-500">Helseindeks per avdeling</p>
                  </div>
                </div>
                <DepartmentRiskChart data={departmentChartData} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Ingen data for valgt periode</p>
              <p className="text-sm text-slate-400 mt-1">Prøv en annen tidsperiode</p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
  }