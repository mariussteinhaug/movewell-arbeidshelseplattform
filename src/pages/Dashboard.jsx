import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users,
  Activity,
  Brain,
  Briefcase,
  RefreshCw,
  BarChart3,
  ChevronDown,
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

function to10From5(v) {
  // Convert 1-5 scale to 0-10 for display: 1->2, 3->6, 5->10
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return clamp(n * 2, 0, 10);
}

function weekKeyFromDate(d) {
  // ISO week (rough but stable for dashboard filtering)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
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

function getRangeStartDate(rangeKey) {
  const now = new Date();
  const d = new Date(now);
  if (rangeKey === RANGE.ALL) return null;

  if (rangeKey === RANGE.TODAY) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (rangeKey === RANGE.D7) d.setDate(d.getDate() - 7);
  if (rangeKey === RANGE.D14) d.setDate(d.getDate() - 14);
  if (rangeKey === RANGE.D30) d.setDate(d.getDate() - 30);
  if (rangeKey === RANGE.M6) d.setMonth(d.getMonth() - 6);
  if (rangeKey === RANGE.Y1) d.setFullYear(d.getFullYear() - 1);
  if (rangeKey === RANGE.Y3) d.setFullYear(d.getFullYear() - 3);

  return d;
}

function inRangeByCreatedDate(entity, startDate) {
  if (!startDate) return true;
  const created =
    entity?.created_date ||
    entity?._created_date ||
    entity?.createdAt ||
    entity?.created_at ||
    null;

  if (!created) return true; // best effort: don’t exclude if unknown
  const dt = new Date(created);
  if (Number.isNaN(dt.getTime())) return true;
  return dt >= startDate;
}

function inRangeByWeek(entity, startDate) {
  if (!startDate) return true;
  const wk = entity?.assessment_week || entity?.session_week;
  if (!wk) return true;

  const startWk = weekKeyFromDate(startDate);
  // Compare lexicographically works with YYYY-WW
  return String(wk) >= String(startWk);
}

/* ---------------------------
   Apple-ish colors (exclusive)
   We use slate neutrals + one gradient for "status".
   For risk: GREEN (safe) -> AMBER -> RED (danger)
--------------------------- */
function riskBand(score10) {
  // score10: 0..10 where HIGHER is BETTER
  const s = clamp(Number(score10 || 0), 0, 10);
  if (s >= 7.5) return "good";
  if (s >= 5) return "mid";
  return "bad";
}

function bandMeta(band) {
  // Apple-like: subtle backgrounds, strong text
  if (band === "good") {
    return {
      label: "Lav risiko",
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      track: "#E2E8F0",
      stroke: "#10B981",
      bar: "bg-emerald-500",
    };
  }
  if (band === "mid") {
    return {
      label: "Moderat",
      dot: "bg-amber-500",
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      track: "#E2E8F0",
      stroke: "#F59E0B",
      bar: "bg-amber-500",
    };
  }
  return {
    label: "Høy risiko",
    dot: "bg-red-500",
    text: "text-red-700",
    badge: "bg-red-50 text-red-700 border-red-100",
    track: "#E2E8F0",
    stroke: "#EF4444",
    bar: "bg-red-500",
  };
}

/* ---------------------------
   UI: Range picker (segmented)
--------------------------- */
function RangePicker({ value, onChange }) {
  const options = [
    RANGE.TODAY,
    RANGE.D7,
    RANGE.D14,
    RANGE.D30,
    RANGE.M6,
    RANGE.Y1,
    RANGE.Y3,
    RANGE.ALL,
  ];

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
        {options.map((k) => {
          const active = value === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k)}
              className={cn(
                "whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium transition",
                active
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {RANGE_LABEL[k]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------
   Cool units
--------------------------- */

/** 1) SVG Gauge (0-10, green->red) */
function GaugeCard({
  title = "Helseindeks",
  value10 = 6.8,
  min = 0,
  max = 10,
  delta = 0,
  subtitle = "Basert på fysisk, mental og arbeidsforhold",
  footnote = "Aggregert",
}) {
  const v = Number.isFinite(Number(value10)) ? Number(value10) : 0;
  const clamped = clamp(v, min, max);
  const pct = (clamped - min) / (max - min);

  const band = riskBand(clamped);
  const meta = bandMeta(band);

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

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  const arcLength = Math.PI * r * (240 / 180);
  const dash = arcLength * pct;
  const gap = arcLength - dash;

  const needleAngle = -120 + pct * 240;

  const deltaText =
    typeof delta === "number"
      ? `${delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} ${Math.abs(delta).toFixed(1)}`
      : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>

          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-semibold text-slate-900">
              {clamped.toFixed(1)}
            </span>

            {deltaText && (
              <span className="text-sm font-semibold text-slate-500">{deltaText}</span>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>

          <div className={cn("mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 border", meta.badge)}>
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
            <span className="text-xs font-medium">{meta.label}</span>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {footnote}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[560px] h-[210px]">
          <path
            d={trackPath}
            fill="none"
            stroke={meta.track}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d={trackPath}
            fill="none"
            stroke={meta.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
          />

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

          <circle cx={cx} cy={cy} r="10" fill="#0F172A" />

          <text x="36" y="265" className="fill-slate-500" style={{ fontSize: 12 }}>
            {min}
          </text>
          <text x="266" y="265" className="fill-slate-500" style={{ fontSize: 12 }}>
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
function ProgressRingCard({
  title = "Svarprosent",
  value = 0,
  subtitle = "Siste 30 dager",
  footnote = "Live",
}) {
  const pct = clamp(Number(value || 0), 0, 100);
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  const stroke =
    pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";

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
            stroke={stroke}
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

/** 3) Segment bars 0-10 (green->red) */
function SegmentBars({ title = "Kategori-poengsum", items = [] }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-sm text-slate-500 mt-1">Skalert 0–10</p>
        </div>
        <BarChart3 className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mt-5 space-y-4">
        {items.map((it) => {
          const v10 = clamp(Number(it.value10 || 0), 0, 10);
          const pct = (v10 / 10) * 100;
          const band = riskBand(v10);
          const meta = bandMeta(band);

          return (
            <div key={it.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium">{it.label}</span>
                <span className="text-slate-500">{v10.toFixed(1)}</span>
              </div>

              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", meta.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0</span>
                <span>10</span>
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
  const [range, setRange] = useState(RANGE.D30);

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

  const rangeStart = useMemo(() => getRangeStartDate(range), [range]);

  // Role filter + time filter
  const filteredAssessments = useMemo(() => {
    if (!currentUser) return [];

    const roleScoped =
      role === ROLE.HR
        ? assessments
        : assessments.filter((a) => {
            const deptId = a.department_id;
            const deptName = a.department;
            const okById = deptId && scope.ids.includes(deptId);
            const okByName = !deptId && deptName && scope.names.includes(deptName);
            return okById || okByName;
          });

    const timeScoped = roleScoped.filter((a) => {
      // prefer created_date if present, else week-based
      return inRangeByCreatedDate(a, rangeStart) && inRangeByWeek(a, rangeStart);
    });

    return timeScoped;
  }, [assessments, currentUser, role, scope.ids, scope.names, rangeStart]);

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
    const roleScoped =
      role === ROLE.HR
        ? recommendations
        : recommendations.filter((r) => {
            const deptId = r.department_id;
            const deptName = r.department;
            const okById = deptId && scope.ids.includes(deptId);
            const okByName = !deptId && deptName && scope.names.includes(deptName);
            return okById || okByName;
          });

    // also time-filter recommendations by created_date if present
    return roleScoped.filter((r) => inRangeByCreatedDate(r, rangeStart));
  }, [recommendations, currentUser, role, scope.ids, scope.names, rangeStart]);

  const stats = useMemo(() => {
    if (!filteredAssessments.length) return null;

    const physical5 = avg(filteredAssessments.map((a) => Number(a.physical_load) || 0));
    const mental5 = avg(filteredAssessments.map((a) => Number(a.mental_wellbeing) || 0));
    const work5 = avg(filteredAssessments.map((a) => Number(a.work_environment) || 0));

    // Convert to 0-10 for display
    const physical10 = to10From5(physical5);
    const mental10 = to10From5(mental5);
    const work10 = to10From5(work5);

    return {
      physical10,
      mental10,
      work10,
      responses: filteredAssessments.length,
    };
  }, [filteredAssessments]);

  const healthIndex10 = useMemo(() => {
    if (!stats) return null;
    return (stats.physical10 + stats.mental10 + stats.work10) / 3;
  }, [stats]);

  // Response rate (best effort): if employee_count is available
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

  // department scores: keep 0-10 but charts might expect 0-5 => convert back when passing
  const departmentScores = useMemo(() => {
    if (!filteredAssessments.length) return [];
    const byDept = new Map();

    filteredAssessments.forEach((a) => {
      const key = a.department_id || a.department || "Ukjent";
      const name = a.department || "Ukjent";
      if (!byDept.has(key)) byDept.set(key, { name, scores10: [], count: 0 });

      const score5 =
        ((Number(a.physical_load) || 0) +
          (Number(a.mental_wellbeing) || 0) +
          (Number(a.work_environment) || 0)) / 3;

      byDept.get(key).scores10.push(to10From5(score5));
      byDept.get(key).count += 1;
    });

    return Array.from(byDept.values())
      .map((d) => ({
        name: d.name,
        score10: avg(d.scores10),
        // keep 0-5 copy for existing chart components (if they assume 0-5)
        score: avg(d.scores10) / 2,
        respondent_count: d.count,
      }))
      .sort((a, b) => a.score10 - b.score10);
  }, [filteredAssessments]);

  // trend: convert to 0-5 for chart component, but compute from 0-10 display
  const trendData = useMemo(() => {
    if (!filteredAssessments.length) return [];
    const byWeek = new Map();

    filteredAssessments.forEach((a) => {
      const weekRaw = a.assessment_week || "ukjent";
      if (!byWeek.has(weekRaw)) byWeek.set(weekRaw, { fysisk10: [], mental10: [], arbeid10: [] });

      const w = byWeek.get(weekRaw);
      w.fysisk10.push(to10From5(Number(a.physical_load) || 3));
      w.mental10.push(to10From5(Number(a.mental_wellbeing) || 3));
      w.arbeid10.push(to10From5(Number(a.work_environment) || 3));
    });

    const rows = Array.from(byWeek.entries()).map(([week, d]) => {
      const fysisk10 = avg(d.fysisk10);
      const mental10 = avg(d.mental10);
      const arbeid10 = avg(d.arbeid10);

      // Existing TrendChart expects 1-5 (domain [1,5]) so we convert back
      return {
        week: week.split("-")[1] || week,
        fysisk: fysisk10 / 2,
        mental: mental10 / 2,
        arbeid: arbeid10 / 2,
      };
    });

    return rows.slice(-8);
  }, [filteredAssessments]);

  // risklevel for RiskCard (your existing component expects low/medium/high where higher is better)
  const getRiskLevel10 = (score10) => {
    const s = clamp(Number(score10 || 0), 0, 10);
    if (s >= 7.5) return "low";
    if (s >= 5) return "medium";
    return "high";
  };

  const isLoading = loadingAssessments || loadingDepartments;

  return (
    <div className="space-y-8">
      {/* Header + Range */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2 leading-tight">
            Dashboard
          </h1>
          <p className="text-slate-600 text-lg">
            {role === ROLE.MANAGER
              ? "Aggregert oversikt for din avdeling"
              : "Aggregert oversikt på tvers av avdelinger"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
            Periode
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <RangePicker value={range} onChange={setRange} />
        </div>
      </div>

      {/* TOP: Apple-ish / Simployer-ish grid */}
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
            <ProgressRingCard
              title="Svarprosent"
              value={responseRate}
              subtitle={RANGE_LABEL[range]}
              footnote="Live"
            />
          </div>

          <div className="lg:col-span-8">
            <GaugeCard
              title="Helseindeks"
              value10={healthIndex10 ?? 0}
              min={0}
              max={10}
              delta={0}
              subtitle="Basert på fysisk, mental og arbeidsforhold"
              footnote="Aggregert"
            />
          </div>

          <div className="lg:col-span-12">
            <SegmentBars
              title="Kategori-poengsum"
              items={[
                { key: "physical", label: "Fysisk belastning", value10: stats.physical10 },
                { key: "mental", label: "Mental helse", value10: stats.mental10 },
                { key: "work", label: "Arbeidsforhold", value10: stats.work10 },
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

      {/* Key numbers row (0-10 display) */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RiskCard
            title="Fysisk belastning"
            value={stats.physical10.toFixed(1)}
            subtitle="Gjennomsnittlig score (0–10)"
            riskLevel={getRiskLevel10(stats.physical10)}
            icon={Activity}
            goodWhenUp={true}
          />
          <RiskCard
            title="Mental helse"
            value={stats.mental10.toFixed(1)}
            subtitle="Gjennomsnittlig score (0–10)"
            riskLevel={getRiskLevel10(stats.mental10)}
            icon={Brain}
            goodWhenUp={true}
          />
          <RiskCard
            title="Arbeidsforhold"
            value={stats.work10.toFixed(1)}
            subtitle="Gjennomsnittlig score (0–10)"
            riskLevel={getRiskLevel10(stats.work10)}
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

      {/* Charts (we pass score back as 0-5 to match your existing components) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentScores.length > 0 ? (
          <DepartmentRiskChart data={departmentScores.map(d => ({ ...d, score: d.score }))} />
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
