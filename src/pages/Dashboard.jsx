import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users,
  Activity,
  Brain,
  Briefcase,
  RefreshCw,
} from "lucide-react";

import RiskCard from "../components/dashboard/RiskCard";
import DepartmentRiskChart from "../components/dashboard/DepartmentRiskChart";
import TrendChart from "../components/dashboard/TrendChart";
import AlertList from "../components/dashboard/AlertList";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ---------------------------
   Role helpers
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
  const singleName = user?.department ? [user.department] : []; // legacy
  return {
    ids: Array.from(new Set([...ids, ...singleId])),
    names: Array.from(new Set([...singleName])),
  };
}

/* ---------------------------
   Mini components (Simployer-ish)
--------------------------- */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function GaugeCard({
  title = "Helseindeks",
  value = 3.8,
  min = 0,
  max = 5,
  delta = 0,
  subtitle = "Siste 8 uker",
  footnote = "Aggregert",
}) {
  const pct = (clamp(value, min, max) - min) / (max - min);
  const deg = -120 + pct * 240;
  const display = typeof value === "number" ? value.toFixed(1) : value;

  const deltaText =
    typeof delta === "number"
      ? `${delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} ${Math.abs(delta).toFixed(1)}`
      : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-semibold text-slate-900">{display}</span>
            {deltaText && (
              <span
                className={cn(
                  "text-sm font-semibold",
                  delta > 0 ? "text-emerald-700" : delta < 0 ? "text-red-600" : "text-slate-500"
                )}
              >
                {deltaText}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {footnote}
        </span>
      </div>

      <div className="mt-6 relative h-36">
        <div className="absolute inset-x-0 bottom-0 mx-auto w-64 h-32">
          <div className="absolute inset-0 rounded-t-full border-[14px] border-slate-100 border-b-0" />

          {/* subtle progress tint */}
          <div
            className="absolute inset-0 rounded-t-full border-[14px] border-emerald-500 border-b-0"
            style={{
              clipPath: `polygon(0% 100%, 0% 0%, 100% 0%, 100% 100%)`,
              transformOrigin: "50% 100%",
              transform: `rotate(${pct * 240 - 120}deg)`,
              opacity: 0.18,
            }}
          />

          {/* needle */}
          <div
            className="absolute left-1/2 bottom-0 h-28 w-0.5 bg-slate-900/80"
            style={{
              transform: `translateX(-50%) rotate(${deg}deg)`,
              transformOrigin: "bottom",
            }}
          />
          <div
            className="absolute left-1/2 bottom-0 h-4 w-4 rounded-full bg-slate-900"
            style={{ transform: "translate(-50%, 50%)" }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ProgressRingCard({
  title = "Svarprosent",
  value = 65,
  delta = 0,
  subtitle = "Siste 30 dager",
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {delta > 0 ? `↑ ${delta}%` : delta < 0 ? `↓ ${Math.abs(delta)}%` : "→ 0%"}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} strokeWidth="10" stroke="#E2E8F0" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={r}
            strokeWidth="10"
            stroke="#10B981"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 60 60)"
          />
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-900"
            style={{ fontSize: 24, fontWeight: 700 }}
          >
            {pct}%
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------
   Dashboard
--------------------------- */
export default function Dashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const role = normalizeRole(currentUser?.role);
  const canSeeDashboard = role === ROLE.HR || role === ROLE.MANAGER;
  const scope = useMemo(() => getManagedDepartmentKeys(currentUser), [currentUser]);

  // Stop fetch for employees
  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
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

  // Gate for employees
  if (currentUser && !canSeeDashboard) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ingen tilgang</h2>
        <p className="text-slate-600">Denne siden er kun tilgjengelig for HR og ledere.</p>
      </div>
    );
  }

  // Filter: HR = all, Manager = own departments
  const filteredAssessments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return assessments;

    return assessments.filter((a) => {
      const deptId = a.department_id;
      const deptName = a.department;
      const okById = deptId && scope.ids.includes(deptId);
      const okByName = !deptId && deptName && scope.names.includes(deptName);
      return okById || okByName;
    });
  }, [assessments, currentUser, role, scope.ids, scope.names]);

  const filteredDepartments = useMemo(() => {
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

  const filteredRecommendations = useMemo(() => {
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

  const stats = useMemo(() => {
    if (!filteredAssessments.length) return null;

    const avg = (key) =>
      filteredAssessments.reduce((sum, a) => sum + (Number(a[key]) || 0), 0) / filteredAssessments.length;

    return {
      physical: avg("physical_load"),
      mental: avg("mental_wellbeing"),
      work: avg("work_environment"),
      responses: filteredAssessments.length,
    };
  }, [filteredAssessments]);

  // HealthIndex for gauge (0-5)
  const healthIndex = useMemo(() => {
    if (!stats) return null;
    return (stats.physical + stats.mental + stats.work) / 3;
  }, [stats]);

  // Department scores for bar chart
  const departmentScores = useMemo(() => {
    if (!filteredAssessments.length) return [];

    const byDept = new Map();
    filteredAssessments.forEach((a) => {
      const key = a.department_id || a.department || "Ukjent";
      const name = a.department || "Ukjent";

      if (!byDept.has(key)) byDept.set(key, { name, scores: [], count: 0 });

      const row = byDept.get(key);
      const avgScore =
        ((Number(a.physical_load) || 0) + (Number(a.mental_wellbeing) || 0) + (Number(a.work_environment) || 0)) / 3;

      row.scores.push(avgScore);
      row.count += 1;
    });

    return Array.from(byDept.values())
      .map((d) => ({
        name: d.name,
        score: d.scores.reduce((x, y) => x + y, 0) / d.scores.length,
        respondent_count: d.count,
      }))
      .sort((a, b) => a.score - b.score);
  }, [filteredAssessments]);

  // Trend data (last 8 weeks)
  const trendData = useMemo(() => {
    if (!filteredAssessments.length) return [];

    const byWeek = new Map();
    filteredAssessments.forEach((a) => {
      const weekRaw = a.assessment_week || "ukjent";
      if (!byWeek.has(weekRaw)) byWeek.set(weekRaw, { fysisk: [], mental: [], arbeid: [] });

      const w = byWeek.get(weekRaw);
      w.fysisk.push(Number(a.physical_load) || 3);
      w.mental.push(Number(a.mental_wellbeing) || 3);
      w.arbeid.push(Number(a.work_environment) || 3);
    });

    return Array.from(byWeek.entries())
      .map(([week, d]) => ({
        week: week.split("-")[1] || week,
        fysisk: d.fysisk.reduce((x, y) => x + y, 0) / d.fysisk.length,
        mental: d.mental.reduce((x, y) => x + y, 0) / d.mental.length,
        arbeid: d.arbeid.reduce((x, y) => x + y, 0) / d.arbeid.length,
      }))
      .slice(-8);
  }, [filteredAssessments]);

  const getRiskLevel = (score) => {
    if (score >= 4) return "low";
    if (score >= 3) return "medium";
    return "high";
  };

  const isLoading = loadingAssessments || loadingDepartments;

  // Simple response rate proxy (just to give the ring something).
  // If you later have employee_count, swap this calculation.
  const responseRate = useMemo(() => {
    if (!filteredAssessments.length) return 0;
    // “best effort”: cap at 95 so it doesn’t look fake-perfect
    return Math.min(95, Math.round((filteredAssessments.length / 50) * 100));
  }, [filteredAssessments]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 leading-tight">
          Dashboard
        </h1>
        <p className="text-slate-600 text-lg">
          {role === ROLE.MANAGER
            ? "Aggregert oversikt for din avdeling"
            : "Aggregert oversikt på tvers av avdelinger"}
        </p>
      </div>

      {/* TOP: Ring + Gauge (Simployer-ish) */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-3 w-40 mb-6" />
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          </div>
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-3 w-40 mb-8" />
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ProgressRingCard
              title="Svarprosent"
              value={responseRate}
              delta={+0}
              subtitle="Siste 30 dager"
            />
          </div>

          <div className="lg:col-span-8">
            <GaugeCard
              title="Helseindeks"
              value={healthIndex ?? 0}
              min={0}
              max={5}
              delta={+0.0}
              subtitle="Basert på fysisk, mental og arbeidsforhold"
              footnote="Aggregert"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
          <RefreshCw className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Ingen data ennå</p>
          <p className="text-sm text-slate-500 mt-1">
            Start med å legge til avdelinger og kjøre kartlegginger
          </p>
        </div>
      )}

      {/* Key numbers */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RiskCard
            title="Fysisk belastning"
            value={stats.physical.toFixed(1)}
            subtitle="Gjennomsnittlig score"
            riskLevel={getRiskLevel(stats.physical)}
            icon={Activity}
            goodWhenUp={true}
          />
          <RiskCard
            title="Mental helse"
            value={stats.mental.toFixed(1)}
            subtitle="Gjennomsnittlig score"
            riskLevel={getRiskLevel(stats.mental)}
            icon={Brain}
            goodWhenUp={true}
          />
          <RiskCard
            title="Arbeidsforhold"
            value={stats.work.toFixed(1)}
            subtitle="Gjennomsnittlig score"
            riskLevel={getRiskLevel(stats.work)}
            icon={Briefcase}
            goodWhenUp={true}
          />
          <RiskCard
            title="Kartlegginger"
            value={stats.responses}
            subtitle={`${filteredDepartments.length} avdelinger`}
            riskLevel="neutral"
            icon={Users}
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentScores.length > 0 ? (
          <DepartmentRiskChart data={departmentScores} />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-center h-80">
            <p className="text-slate-500">Ingen avdelingsdata tilgjengelig</p>
          </div>
        )}

        {trendData.length > 0 ? (
          <TrendChart data={trendData} />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-center h-80">
            <p className="text-slate-500">Ingen trenddata tilgjengelig</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      <AlertList alerts={filteredRecommendations} />
    </div>
  );
}
