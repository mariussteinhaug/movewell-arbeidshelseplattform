import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { RefreshCw, BarChart3, Check, ChevronDown } from "lucide-react";
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
  if (s >= 7.5) return "good"; // grønn
  if (s >= 5) return "warn"; // amber
  return "bad"; // rød
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
    <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-xl transition-all",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
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
   Cool Units (0–10)
--------------------------- */

// 1) Gauge
function GaugeCard({
  title = "Helseindeks",
  value10 = 0,
  subtitle = "Basert på fysisk, mental og arbeidsforhold",
  footnote = "Aggregert",
  delta10 = 0,
}) {
  const v = clamp(Number(value10 || 0), 0, 10);
  const pct = v / 10;

  // SVG arc geometry (240°)
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 120;
  const stroke = 18;

  const startAngle = (-120 * Math.PI) / 180;
  const endAngle = (120 * Math.PI) / 180;

  const polar = (angle) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  const start = polar(startAngle);
  const end = polar(endAngle);

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  // arc length approx
  const arcLength = Math.PI * r * (240 / 180);
  const dash = arcLength * pct;
  const gap = arcLength - dash;

  const needleAngle = -120 + pct * 240;

  const band = riskBand10(v);

  const ringColor = band === "good" ? "#10B981" : band === "warn" ? "#F59E0B" : "#EF4444";

  const deltaText =
    typeof delta10 === "number"
      ? `${delta10 > 0 ? "↑" : delta10 < 0 ? "↓" : "→"} ${Math.abs(delta10).toFixed(1)}`
      : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>

          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-semibold text-slate-900">{v.toFixed(1)}</span>
            <span className="text-sm text-slate-500">/ 10</span>

            {deltaText && (
              <span
                className={cn(
                  "text-sm font-semibold",
                  delta10 > 0 ? "text-emerald-700" : delta10 < 0 ? "text-red-600" : "text-slate-500"
                )}
              >
                {deltaText}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ringColor }}
            />
            <span className="text-xs font-medium text-slate-700">{bandLabel(v)}</span>
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
            stroke={ringColor}
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

          {/* Min/Max labels (0–10) */}
          <text x="32" y="265" className="fill-slate-500" style={{ fontSize: 12 }}>
            0
          </text>
          <text x="268" y="265" className="fill-slate-500" style={{ fontSize: 12 }}>
            10
          </text>
        </svg>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
}

// 2) Progress ring
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

  // ring color: low response = red
  const ringColor = pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{footnote}</span>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} strokeWidth="10" stroke="#E2E8F0" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={r}
            strokeWidth="10"
            stroke={ringColor}
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

// 3) Segment bars 0–10
function SegmentBars({ title = "Kategori-score", items = [] }) {
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
          const v = clamp(Number(it.value10 || 0), 0, 10);
          const pct = (v / 10) * 100;

          const band = riskBand10(v);
          const fill = band === "good" ? "#10B981" : band === "warn" ? "#F59E0B" : "#EF4444";

          return (
            <div key={it.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium">{it.label}</span>
                <span className="text-slate-500">{v.toFixed(1)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: fill }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------
   Dashboard page (FULL)
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
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ingen tilgang</h2>
        <p className="text-slate-600">Denne siden er kun tilgjengelig for HR og ledere.</p>
      </div>
    );
  }

  // Filter by role + department scope
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

  // Time filter (best effort):
  // - if created_date exists, use that
  // - else if assessment_week exists, do NOT try to parse week here; fall back to created_date only.
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

    return {
      physical10,
      mental10,
      work10,
      responses: timeFilteredAssessments.length,
    };
  }, [timeFilteredAssessments]);

  const healthIndex10 = useMemo(() => {
    if (!stats10) return 0;
    return (stats10.physical10 + stats10.mental10 + stats10.work10) / 3;
  }, [stats10]);

  // Response rate (uses employee_count if present)
  const responseRate = useMemo(() => {
    if (!stats10) return 0;

    const totalEmployees = scopedDepartments.reduce((sum, d) => sum + (Number(d.employee_count) || 0), 0);

    if (totalEmployees > 0) {
      return clamp((stats10.responses / totalEmployees) * 100, 0, 100);
    }

    // fallback if no employee_count available
    return clamp((stats10.responses / 50) * 100, 0, 100);
  }, [stats10, scopedDepartments]);

  // Department chart data (0–10)
  const departmentScores = useMemo(() => {
    if (!timeFilteredAssessments.length) return [];
    const byDept = new Map();

    timeFilteredAssessments.forEach((a) => {
      const key = a.department_id || a.department || "Ukjent";
      const name = a.department || "Ukjent";
      if (!byDept.has(key)) byDept.set(key, { name, scores10: [], count: 0 });

      const score10 =
        (to10From5(a.physical_load) + to10From5(a.mental_wellbeing) + to10From5(a.work_environment)) / 3;

      const row = byDept.get(key);
      row.scores10.push(score10);
      row.count += 1;
    });

    return Array.from(byDept.values())
      .map((d) => ({
        name: d.name,
        score10: avg(d.scores10),
        respondent_count: d.count,
      }))
      .sort((a, b) => a.score10 - b.score10);
  }, [timeFilteredAssessments]);

  // Trend data (0–10) grouped by assessment_week (keeps your existing pattern)
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

    const rows = Array.from(byWeek.entries())
      .map(([week, d]) => ({
        week: week.split("-")[1] || week,
        fysisk10: avg(d.fysisk10),
        mental10: avg(d.mental10),
        arbeid10: avg(d.arbeid10),
      }))
      .slice(-12);

    return rows;
  }, [timeFilteredAssessments]);

  const isLoading = loadingAssessments || loadingDepartments;

  return (
    <div className="space-y-8">
      {/* Header + time range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2 leading-tight">Dashboard</h1>
          <p className="text-slate-600 text-lg">
            {role === ROLE.MANAGER ? "Oversikt for din avdeling" : "Oversikt på tvers av avdelinger"}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* TOP grid */}
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
      ) : stats10 ? (
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
              value10={healthIndex10}
              delta10={0}
              subtitle="Høy score = bra (grønn). Lav score = risiko (rød)."
              footnote="Aggregert"
            />
          </div>

          <div className="lg:col-span-12">
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
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
          <RefreshCw className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Ingen data for valgt periode</p>
          <p className="text-sm text-slate-500 mt-1">Velg en annen periode eller start med kartlegginger.</p>
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
      <AlertList alerts={scopedRecommendations} />
    </div>
  );
}
