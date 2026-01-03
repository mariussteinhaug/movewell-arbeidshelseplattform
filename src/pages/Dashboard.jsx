import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users,
  Activity,
  Brain,
  Briefcase,
  RefreshCw,
  BarChart3,
} from "lucide-react";

import RiskCard from "../components/dashboard/RiskCard";
import DepartmentRiskChart from "../components/dashboard/DepartmentRiskChart";
import TrendChart from "../components/dashboard/TrendChart";
import AlertList from "../components/dashboard/AlertList";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
   Utils
--------------------------- */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/* ---------------------------
   Cool units
--------------------------- */

/** 1) SVG Gauge (speedometer) – stable */
function GaugeCard({
  title = "Helseindeks",
  value = 3.4,
  min = 0,
  max = 5,
  delta = 0,
  subtitle = "Basert på fysisk, mental og arbeidsforhold",
  footnote = "Aggregert",
}) {
  const v = typeof value === "number" ? value : Number(value || 0);
  const pct = (clamp(v, min, max) - min) / (max - min);

  // SVG arc geometry (240°)
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 120;
  const stroke = 18;

  const startAngle = (-120 * Math.PI) / 180;
  const endAngle = (120 * Math.PI) / 180;

  const polar = (angle) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const start = polar(startAngle);
  const end = polar(endAngle);

  // full track path
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  // approximate arc length for dash
  const arcLength = Math.PI * r * (240 / 180);
  const dash = arcLength * pct;
  const gap = arcLength - dash;

  const needleAngle = -120 + pct * 240;

  const deltaText =
    typeof delta === "number"
      ? `${delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} ${Math.abs(delta).toFixed(1)}`
      : null;

  // simple risk label
  const riskLabel = v >= 4 ? "Lav risiko" : v >= 3 ? "Moderat" : "Høy risiko";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>

          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-semibold text-slate-900">
              {Number.isFinite(v) ? v.toFixed(1) : "—"}
            </span>

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

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-700">{riskLabel}</span>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {footnote}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[560px] h-[210px]">
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Progress */}
          <path
            d={trackPath}
            fill="none"
            stroke="#10B981"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
          />
          {/* Needle */}
          <g transform={`rotate(${needleAngle} ${cx} ${cy})`}>
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - 95}
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>
          {/* Center */}
          <circle cx={cx} cy={cy} r="10" fill="#0F172A" />

          {/* Min/Max labels */}
          <text x="36" y="265" className="fill-slate-500" style={{ fontSize: 12 }}>
            {min}
          </text>
          <text x="272" y="265" className="fill-slate-500" style={{ fontSize: 12 }}>
            {max}
          </text>
        </svg>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/** 2) Progress ring (response rate) */
function ProgressRingCard({ title = "Svarprosent", value = 0, subtitle = "Siste 30 dager", footnote = "Live" }) {
  const pct = clamp(Number(value || 0), 0, 100);
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
          {footnote}
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
            y="58"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-900"
            style={{ fontSize: 26, fontWeight: 800 }}
          >
            {Math.round(pct)}%
          </text>
          <text
            x="60"
            y="78"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-500"
            style={{ fontSize: 12 }}
          >
            fullført
          </text>
        </svg>
      </div>
    </div>
  );
}

/** 3) Segment bars (like Simployer engagement breakdown) */
function SegmentBars({ title = "Kategori-score", items = [] }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-sm text-slate-500 mt-1">Skalert 1–5</p>
        </div>
        <BarChart3 className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mt-5 space-y-4">
        {items.map((it) => {
          const v = clamp(Number(it.value || 0), 0, 5);
          const pct = (v / 5) * 100;
          return (
            <div key={it.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium">{it.label}</span>
                <span className="text-slate-500">{v.toFixed(1)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    v >= 4 ? "bg-emerald-500" : v >= 3 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------
   Dashboard page
--------------------------- */
export default function Dashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const role = normalizeRole(currentUser?.role);
  const canSeeDashboard = role === ROLE.HR || role === ROLE.MANAGER;
  const scope = useMemo(() => getManagedDepartmentKeys(currentUser), [currentUser]);

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

  if (currentUser && !canSeeDashboard) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ingen tilgang</h2>
        <p className="text-slate-600">Denne siden er kun tilgjengelig for HR og ledere.</p>
      </div>
    );
  }

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

    const physical = avg(filteredAssessments.map((a) => Number(a.physical_load) || 0));
    const mental = avg(filteredAssessments.map((a) => Number(a.mental_wellbeing) || 0));
    const work = avg(filteredAssessments.map((a) => Number(a.work_environment) || 0));

    return {
      physical,
      mental,
      work,
      responses: filteredAssessments.length,
    };
  }, [filteredAssessments]);

  const healthIndex = useMemo(() => {
    if (!stats) return null;
    return (stats.physical + stats.mental + stats.work) / 3;
  }, [stats]);

  // Response rate (best effort): use employee_count if present
  const responseRate = useMemo(() => {
    if (!stats) return 0;

    const totalEmployees = filteredDepartments.reduce(
      (sum, d) => sum + (Number(d.employee_count) || 0),
      0
    );

    if (totalEmployees > 0) {
      return clamp((stats.responses / totalEmployees) * 100, 0, 100);
    }

    // fallback if no employee_count
    return clamp((stats.responses / 50) * 100, 0, 100);
  }, [stats, filteredDepartments]);

  const departmentScores = useMemo(() => {
    if (!filteredAssessments.length) return [];
    const byDept = new Map();

    filteredAssessments.forEach((a) => {
      const key = a.department_id || a.department || "Ukjent";
      const name = a.department || "Ukjent";
      if (!byDept.has(key)) byDept.set(key, { name, scores: [], count: 0 });

      const row = byDept.get(key);
      const score = ((Number(a.physical_load) || 0) + (Number(a.mental_wellbeing) || 0) + (Number(a.work_environment) || 0)) / 3;
      row.scores.push(score);
      row.count += 1;
    });

    return Array.from(byDept.values())
      .map((d) => ({
        name: d.name,
        score: avg(d.scores),
        respondent_count: d.count,
      }))
      .sort((a, b) => a.score - b.score);
  }, [filteredAssessments]);

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

    const rows = Array.from(byWeek.entries()).map(([week, d]) => ({
      week: week.split("-")[1] || week,
      fysisk: avg(d.fysisk),
      mental: avg(d.mental),
      arbeid: avg(d.arbeid),
    }));

    return rows.slice(-8);
  }, [filteredAssessments]);

  const getRiskLevel = (score) => {
    if (score >= 4) return "low";
    if (score >= 3) return "medium";
    return "high";
  };

  const isLoading = loadingAssessments || loadingDepartments;

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

      {/* TOP: Simployer-ish grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-3 w-40 mb-6" />
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          </div>
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6">
            <Skeleton className="h-4 w-40 mb-3" />
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-3 w-64 mb-8" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-12 bg-white rounded-3xl border border-slate-200 p-6">
            <Skeleton className="h-4 w-40 mb-6" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ProgressRingCard title="Svarprosent" value={responseRate} subtitle="Siste 30 dager" footnote="Live" />
          </div>

          <div className="lg:col-span-8">
            <GaugeCard
              title="Helseindeks"
              value={healthIndex ?? 0}
              min={0}
              max={5}
              delta={0}
              subtitle="Basert på fysisk, mental og arbeidsforhold"
              footnote="Aggregert"
            />
          </div>

          <div className="lg:col-span-12">
            <SegmentBars
              title="Kategori-score"
              items={[
                { key: "physical", label: "Fysisk belastning", value: stats.physical },
                { key: "mental", label: "Mental helse", value: stats.mental },
                { key: "work", label: "Arbeidsforhold", value: stats.work },
              ]}
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

      {/* Key numbers row */}
      {stats && (
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
      )}

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
