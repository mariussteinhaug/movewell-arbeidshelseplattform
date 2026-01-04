import React, { useMemo, useState } from "react";
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
import DepartmentRiskChart from "../components/dashboard/DepartmentRiskChart";
import TrendChart from "../components/dashboard/TrendChart";
import AlertList from "../components/dashboard/AlertList";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/ "@/lib/utils";

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
  if (r === "manager" || r === "leader" || r === "leder") return ROLE.MANAGER;
  if (r === "admin") return ROLE.HR; // treat legacy admin as HR
  return ROLE.EMPLOYEE;
}

function getManagedDepartmentKeys(user) {
  const ids = Array.isArray(user?.managed_department_ids) ? user.managed_department_ids : [];
  const singleId = user?.department_id ? [user.department_id] : [];
  const singleName = user?.department ? [user.department] : []; // legacy string
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

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function addYears(d, n) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
}

function getRangeStart(rangeKey) {
  const now = new Date();
  const today = startOfDay(now);
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
    case RANGE.ALL:
    default:
      return null;
  }
}

/* ---------------------------
   Utils
--------------------------- */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function avg(nums) {
  if (!nums?.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function to10From5(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return clamp(n * 2, 0, 10);
}
function riskBand10(score10) {
  const s = clamp(Number(score10 || 0), 0, 10);
  if (s >= 7.5) return "good";
  if (s >= 5) return "warn";
  return "bad";
}
function bandLabel(score10) {
  const b = riskBand10(score10);
  if (b === "good") return "God";
  if (b === "warn") return "Moderat";
  return "Høy risiko";
}

/* ---------------------------
   Apple-ish Segmented Control
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
              "px-3 py-1.5 text-sm font-medium rounded-xl transition-all",
              "focus:outline-none focus:ring-2 focus:ring-slate-300",
              active
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------
   “App cards”
--------------------------- */
function Panel({ title, subtitle, icon: Icon, right, children, className }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white/80 backdrop-blur",
        "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
        "overflow-hidden",
        className
      )}
    >
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? (
              <span className="h-8 w-8 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
          </div>
          {subtitle ? <p className="text-sm text-slate-500 mt-2">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, chip }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white/80 backdrop-blur",
        "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
        "p-6"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-semibold text-slate-900">{value}</span>
            {chip ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {chip}
              </span>
            ) : null}
          </div>
          {hint ? <p className="text-sm text-slate-500 mt-2">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="h-10 w-10 rounded-2xl bg-slate-100 grid place-items-center">
            <Icon className="h-5 w-5 text-slate-700" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------
   Existing “Cool Units” you had (kept)
   - GaugeCard
   - ProgressRingCard
   - SegmentBars
   (paste your existing implementations here unchanged)
--------------------------- */
// 👉 Lim: behold GaugeCard, ProgressRingCard og SegmentBars fra koden din.
// (Jeg refererer til dem under.)

export default function Dashboard() {
  const [range, setRange] = useState(RANGE.D30);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const role = normalizeRole(currentUser?.role);
  const canSeeDashboard = role === ROLE.HR || role === ROLE.MANAGER;
  const scope = useMemo(() => getManagedDepartmentKeys(currentUser), [currentUser]);

  const { data: assessmentsRaw = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => base44.entities.HealthAssessment.list("-created_date", 500),
    enabled: !!currentUser && canSeeDashboard,
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => base44.entities.Department.list(),
    enabled: !!currentUser && canSeeDashboard,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => base44.entities.ActionRecommendation.filter({ status: "ny" }, "-created_date", 10),
    enabled: !!currentUser && canSeeDashboard,
  });

  if (currentUser && !canSeeDashboard) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-slate-900">Ingen tilgang</h2>
          <p className="text-slate-600 mt-2">Denne siden er kun tilgjengelig for HR og ledere.</p>
        </div>
      </div>
    );
  }

  const scopedAssessments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return assessmentsRaw;
    return assessmentsRaw.filter((a) => {
      const deptId = a.department_id;
      const deptName = a.department;
      const okById = deptId && scope.ids.includes(deptId);
      const okByName = !deptId && deptName && scope.names.includes(deptName);
      return okById || okByName;
    });
  }, [assessmentsRaw, currentUser, role, scope.ids, scope.names]);

  const scopedDepartments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return departments;
    return departments.filter((d) => {
      const deptId = d.id || d.department_id;
      const deptName = d.name;
      const okById = deptId && scope.ids.includes(deptId);
      const okByName = !deptId && deptName && scope.names.includes(deptName);
      return okById || okByName;
    });
  }, [departments, currentUser, role, scope.ids, scope.names]);

  const scopedRecommendations = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return recommendations;
    return recommendations.filter((r) => {
      const deptId = r.department_id;
      const deptName = r.department;
      const okById = deptId && scope.ids.includes(deptId);
      const okByName = !deptId && deptName && scope.names.includes(deptName);
      return okById || okByName;
    });
  }, [recommendations, currentUser, role, scope.ids, scope.names]);

  const timeFilteredAssessments = useMemo(() => {
    const start = getRangeStart(range);
    if (!start) return scopedAssessments;
    const startMs = start.getTime();
    return scopedAssessments.filter((a) => {
      const cd = a.created_date ? new Date(a.created_date) : null;
      if (!cd || Number.isNaN(cd.getTime())) return false;
      return cd.getTime() >= startMs;
    });
  }, [scopedAssessments, range]);

  const stats10 = useMemo(() => {
    if (!timeFilteredAssessments.length) return null;
    const physical10 = avg(timeFilteredAssessments.map((a) => to10From5(a.physical_load)));
    const mental10 = avg(timeFilteredAssessments.map((a) => to10From5(a.mental_wellbeing)));
    const work10 = avg(timeFilteredAssessments.map((a) => to10From5(a.work_environment)));
    return { physical10, mental10, work10, responses: timeFilteredAssessments.length };
  }, [timeFilteredAssessments]);

  const healthIndex10 = useMemo(() => {
    if (!stats10) return 0;
    return (stats10.physical10 + stats10.mental10 + stats10.work10) / 3;
  }, [stats10]);

  const responseRate = useMemo(() => {
    if (!stats10) return 0;
    const totalEmployees = scopedDepartments.reduce(
      (sum, d) => sum + (Number(d.employee_count) || 0),
      0
    );
    if (totalEmployees > 0) return clamp((stats10.responses / totalEmployees) * 100, 0, 100);
    return clamp((stats10.responses / 50) * 100, 0, 100);
  }, [stats10, scopedDepartments]);

  const departmentScores = useMemo(() => {
    if (!timeFilteredAssessments.length) return [];
    const byDept = new Map();

    timeFilteredAssessments.forEach((a) => {
      const key = a.department_id || a.department || "Ukjent";
      const name = a.department || "Ukjent";
      if (!byDept.has(key)) byDept.set(key, { name, scores10: [], count: 0 });

      const score10 =
        (to10From5(a.physical_load) +
          to10From5(a.mental_wellbeing) +
          to10From5(a.work_environment)) /
        3;

      const row = byDept.get(key);
      row.scores10.push(score10);
      row.count += 1;
    });

    return Array.from(byDept.values())
      .map((d) => ({ name: d.name, score10: avg(d.scores10), respondent_count: d.count }))
      .sort((a, b) => a.score10 - b.score10);
  }, [timeFilteredAssessments]);

  const trendData = useMemo(() => {
    if (!timeFilteredAssessments.length) return [];
    const byWeek = new Map();

    timeFilteredAssessments.forEach((a) => {
      const weekRaw = a.assessment_week || "ukjent";
      if (!byWeek.has(weekRaw)) byWeek.set(weekRaw, { fysisk10: [], mental10: [], arbeid10: [] });

      const w = byWeek.get(weekRaw);
      w.fysisk10.push(to10From5(a.physical_load) || 6);
      w.mental10.push(to10From5(a.mental_wellbeing) || 6);
      w.arbeid10.push(to10From5(a.work_environment) || 6);
    });

    return Array.from(byWeek.entries())
      .map(([week, d]) => ({
        week: week.split("-")[1] || week,
        fysisk10: avg(d.fysisk10),
        mental10: avg(d.mental10),
        arbeid10: avg(d.arbeid10),
      }))
      .slice(-12);
  }, [timeFilteredAssessments]);

  const isLoading = loadingAssessments || loadingDepartments;

  // Small derived labels
  const band = bandLabel(healthIndex10);
  const bandChip =
    riskBand10(healthIndex10) === "good"
      ? "Stabil"
      : riskBand10(healthIndex10) === "warn"
      ? "Følg med"
      : "Tiltak";

  return (
    <div className="min-h-screen">
      {/* App background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
      <div className="fixed inset-0 -z-10 opacity-70 [background:radial-gradient(40%_30%_at_20%_10%,rgba(59,130,246,0.10),transparent),radial-gradient(35%_25%_at_80%_20%,rgba(16,185,129,0.10),transparent),radial-gradient(35%_30%_at_60%_80%,rgba(245,158,11,0.10),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Sticky topbar */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/60 backdrop-blur border-b border-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 truncate">
                  Dashboard
                </h1>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {role === ROLE.MANAGER ? "Oversikt for din avdeling" : "Oversikt på tvers av avdelinger"} •{" "}
                <span className="text-slate-500">{RANGE_LABEL[range]}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Segmented
                value={range}
                onChange={setRange}
                options={[
                  { value: RANGE.TODAY, label: "I dag" },
                  { value: RANGE.D7, label: "7d" },
                  { value: RANGE.D14, label: "14d" },
                  { value: RANGE.D30, label: "30d" },
                  { value: RANGE.M6, label: "6m" },
                  { value: RANGE.Y1, label: "1år" },
                  { value: RANGE.Y3, label: "3år" },
                  { value: RANGE.ALL, label: "All" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white/80 p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-9 w-24 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white/80 p-6">
              <Skeleton className="h-4 w-40 mb-4" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-12 rounded-3xl border border-slate-200 bg-white/80 p-6">
              <Skeleton className="h-4 w-48 mb-4" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          </div>
        ) : stats10 ? (
          <>
            {/* KPI row + Hero */}
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
              </div>

              <div className="lg:col-span-8">
                {/* Bruk GaugeCarden din her */}
                <GaugeCard
                  title="Helseindeks"
                  value10={healthIndex10}
                  delta10={0}
                  subtitle="Høy score = bra (grønn). Lav score = risiko (rød)."
                  footnote="Aggregert"
                />
              </div>

              <div className="lg:col-span-12">
                {/* Bruk SegmentBarsen din her */}
                <SegmentBars
                  title="Kategori-poengsum"
                  items={[
                    { key: "physical", label: "Fysisk belastning", value10: stats10.physical10 },
                    { key: "mental", label: "Psykisk helse", value10: stats10.mental10 },
                    { key: "work", label: "Arbeidsforhold", value10: stats10.work10 },
                  ]}
                />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <Panel
                  title="Avdelingsrisiko"
                  subtitle="Gjennomsnittlig score (0–10) per avdeling"
                  icon={BarChart3}
                >
                  {departmentScores.length > 0 ? (
                    <DepartmentRiskChart data={departmentScores} />
                  ) : (
                    <div className="h-80 grid place-items-center text-slate-500">
                      Ingen avdelingsdata tilgjengelig
                    </div>
                  )}
                </Panel>
              </div>

              <div className="lg:col-span-5">
                <Panel
                  title="Utvikling over tid"
                  subtitle="Gjennomsnittlig score per kategori"
                  icon={Activity}
                >
                  {trendData.length > 0 ? (
                    <TrendChart data={trendData} />
                  ) : (
                    <div className="h-80 grid place-items-center text-slate-500">Ingen trenddata tilgjengelig</div>
                  )}
                </Panel>
              </div>

              <div className="lg:col-span-12">
                <Panel
                  title="Tiltak & anbefalinger"
                  subtitle="Nye forslag som krever oppfølging"
                  icon={Sparkles}
                  right={
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {scopedRecommendations?.length ?? 0} nye
                    </span>
                  }
                >
                  <AlertList alerts={scopedRecommendations} />
                </Panel>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <RefreshCw className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">Ingen data for valgt periode</p>
            <p className="text-sm text-slate-500 mt-1">Velg en annen periode eller start med kartlegginger.</p>
          </div>
        )}
      </div>
    </div>
  );
}
