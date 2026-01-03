import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Activity, Brain, Briefcase, RefreshCw } from 'lucide-react';
import RiskCard from '../components/dashboard/RiskCard';
import DepartmentRiskChart from '../components/dashboard/DepartmentRiskChart';
import TrendChart from '../components/dashboard/TrendChart';
import AlertList from '../components/dashboard/AlertList';
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.HealthAssessment.list('-created_date', 500),
    enabled: !!currentUser
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    enabled: !!currentUser
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => base44.entities.ActionRecommendation.filter({ status: 'ny' }, '-created_date', 10),
    enabled: !!currentUser
  });

  // Filter based on role
  const isAdmin = currentUser?.role === 'admin';
  const userDepartment = currentUser?.department;

  const filteredAssessments = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return assessments;
    // Leader - only own department
    if (userDepartment) {
      return assessments.filter(a => a.department === userDepartment);
    }
    // Employee - no access to dashboard
    return [];
  }, [assessments, currentUser, isAdmin, userDepartment]);

  // Check if user has dashboard access
  if (currentUser && currentUser.role !== 'admin' && !userDepartment) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ingen tilgang</h2>
        <p className="text-slate-600">Denne siden er kun tilgjengelig for HR og ledere.</p>
      </div>
    );
  }

  const stats = useMemo(() => {
    if (!filteredAssessments.length) return null;

    const avgPhysical = filteredAssessments.reduce((sum, a) => sum + (a.physical_load || 0), 0) / filteredAssessments.length;
    const avgMental = filteredAssessments.reduce((sum, a) => sum + (a.mental_wellbeing || 0), 0) / filteredAssessments.length;
    const avgWork = filteredAssessments.reduce((sum, a) => sum + (a.work_environment || 0), 0) / filteredAssessments.length;
    const totalResponses = filteredAssessments.length;

    return {
      physical: avgPhysical,
      mental: avgMental,
      work: avgWork,
      responses: totalResponses
    };
  }, [filteredAssessments]);

  const departmentScores = useMemo(() => {
    if (!filteredAssessments.length) return [];

    const byDept = {};
    filteredAssessments.forEach(a => {
      if (!byDept[a.department]) {
        byDept[a.department] = { scores: [], count: 0 };
      }
      const avg = ((a.physical_load || 0) + (a.mental_wellbeing || 0) + (a.work_environment || 0)) / 3;
      byDept[a.department].scores.push(avg);
      byDept[a.department].count++;
    });

    return Object.entries(byDept).map(([name, data]) => ({
      name,
      score: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count
    })).sort((a, b) => a.score - b.score);
  }, [filteredAssessments]);

  const trendData = useMemo(() => {
    if (!filteredAssessments.length) return [];

    const byWeek = {};
    filteredAssessments.forEach(a => {
      const week = a.assessment_week || 'ukjent';
      if (!byWeek[week]) {
        byWeek[week] = { fysisk: [], mental: [], arbeid: [] };
      }
      byWeek[week].fysisk.push(a.physical_load || 3);
      byWeek[week].mental.push(a.mental_wellbeing || 3);
      byWeek[week].arbeid.push(a.work_environment || 3);
    });

    return Object.entries(byWeek)
      .map(([week, data]) => ({
        week: week.split('-')[1] || week,
        fysisk: data.fysisk.reduce((a, b) => a + b, 0) / data.fysisk.length,
        mental: data.mental.reduce((a, b) => a + b, 0) / data.mental.length,
        arbeid: data.arbeid.reduce((a, b) => a + b, 0) / data.arbeid.length
      }))
      .slice(-8);
  }, [filteredAssessments]);

  const getRiskLevel = (score) => {
    if (score >= 4) return 'low';
    if (score >= 3) return 'medium';
    return 'high';
  };

  const isLoading = loadingAssessments || loadingDepartments;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 leading-tight">Dashboard</h1>
        <p className="text-slate-600 text-lg">Aggregert oversikt over arbeidshelse på tvers av avdelinger</p>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
          />
          <RiskCard 
            title="Mental helse"
            value={stats.mental.toFixed(1)}
            subtitle="Gjennomsnittlig score"
            riskLevel={getRiskLevel(stats.mental)}
            icon={Brain}
          />
          <RiskCard 
            title="Arbeidsforhold"
            value={stats.work.toFixed(1)}
            subtitle="Gjennomsnittlig score"
            riskLevel={getRiskLevel(stats.work)}
            icon={Briefcase}
          />
          <RiskCard 
            title="Kartlegginger"
            value={stats.responses}
            subtitle={`${departments.length} avdelinger`}
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
      <AlertList alerts={recommendations} />
    </div>
  );
}