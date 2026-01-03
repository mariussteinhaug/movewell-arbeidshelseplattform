import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Activity, Brain, Briefcase, RefreshCw } from "lucide-react";
import RiskCard from "../components/dashboard/RiskCard";
import DepartmentRiskChart from "../components/dashboard/DepartmentRiskChart";
import TrendChart from "../components/dashboard/TrendChart";
import AlertList from "../components/dashboard/AlertList";
import { Skeleton } from "@/components/ui/skeleton";

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
  if (r === "admin") return ROLE.HR; // treat admin as HR in MoveWell
  return ROLE.EMPLOYEE;
}

// Hent avdelingsscope fra user. Støtter flere mulige felt (Base44 kan variere).
function getManagedDepartmentKeys(user) {
  const ids = Array.isArray(user?.managed_department_ids) ? user.managed_department_ids : [];
  const singleId = user?.department_id ? [user.department_id] : [];
  const singleName = user?.department ? [user.department] : []; // legacy
  return {
    ids: Array.from(new Set([...ids, ...singleId])),
    names: Array.from(new Set([...singleName])),
  };
}

export default function Dashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const role = normalizeRole(currentUser?.role);
  const canSeeDashboard = role === ROLE.HR || role === ROLE.MANAGER;

  const scope = useMemo(() => getManagedDepartmentKeys(currentUser), [currentUser]);

  // NOTE: Vi stopper datafetch for ansatte. (Apple-feel + mindre “lekk” i UI)
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

  // Hard gate (ansatt skal ikke inn her)
  if (currentUser && !canSeeDashboard) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ingen tilgang</h2>
        <p className="text-slate-600">Denne siden er kun tilgjengelig for HR og ledere.</p>
      </div>
    );
  }

  // Filter: HR = alt, Manager = kun egne avdelinger (id eller navn fallback)
  const filteredAssessments = useMemo(() => {
    if (!currentUser) return [];
    if (role === ROLE.HR) return assessments;

    // Manager: filter by department_id first, fallback to department string
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

    // Manager: samme logikk
    return departments.filter((d) => {
      const deptId = d.id || d.department_id; // Base44 kan ha id-felt
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

  const departmentScores = useMemo(() => {
    if (!filteredAssessments.length) return [];

    const byDept = new Map();

    filteredAssessments.forEach((a) => {
      const deptKey = a.department_id || a.department || "Ukjent";
      const deptName = a.department || "Ukjent";

      if (!byDept.has(deptKey)) {
        byDept.set(deptKey, { name: deptName, scores: [], count: 0 });
      }
      const row = byDept.get(deptKey);
      const avgScore =
        ((Number(a.physical_load) || 0) + (Number(a.mental_wellbeing) || 0) + (Number(a.work_environment) || 0)) / 3;

      row.scores.push(avgScore);
      row.count += 1;
    });

    return Array.from(byDept.values())
      .map((d) => ({
        name: d.name,
        score: d.scores.reduce((x, y) => x + y, 0) / d.scores.length,
        respondent_count: d.count, // matcher tooltipen vi foreslo
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
      fysisk: d.fysisk.reduce((x, y) => x + y, 0) / d.fysisk.length,
      mental: d.mental.reduce((x, y) => x + y, 0) / d.mental.length,
      arbeid: d.arbeid.reduce((x, y) => x + y, 0) / d.arbeid.length,
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
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 leading-tight">Dashboard</h1>
        <p className="text-slate-600 text-lg">
          Aggregert oversikt over arbeidshelse {role === ROLE.MANAGER ? "for din avdeling" : "på tvers av avdelinger"}
        </p>
      </div>

      {/* Stats cards */}
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
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <RefreshCw className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Ingen data ennå</p>
          <p className="text-sm text-slate-500 mt-1">Start med å legge til avdelinger og kjøre kartlegginger</p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentScores.length > 0 ? (
          <DepartmentRiskChart data={departmentScores} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center h-80">
            <p className="text-slate-500">Ingen avdelingsdata tilgjengelig</p>
          </div>
        )}

        {trendData.length > 0 ? (
          <TrendChart data={trendData} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center h-80">
            <p className="text-slate-500">Ingen trenddata tilgjengelig</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      <AlertList alerts={filteredRecommendations} />
    </div>
  );
}
