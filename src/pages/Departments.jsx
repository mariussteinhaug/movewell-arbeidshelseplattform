import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, TrendingUp, TrendingDown, Minus, Activity, Brain, Briefcase, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Departments() {
  const [selectedDept, setSelectedDept] = useState(null);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.HealthAssessment.list('-created_date', 500)
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['assessment-sessions'],
    queryFn: () => base44.entities.AssessmentSession.list('-created_date', 500)
  });

  const departmentStats = useMemo(() => {
    if (!assessments.length) return {};

    const stats = {};
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    assessments.forEach(a => {
      const key = a.department || a.department_name || 'Ikke oppgitt';
      if (!stats[key]) {
        stats[key] = {
          physical: [],
          mental: [],
          work: [],
          recovery: [],
          stress: [],
          total: 0,
          lastUpdated: null,
          last4w: 0
        };
      }
      stats[key].physical.push(a.physical_load || 0);
      stats[key].mental.push(a.mental_wellbeing || 0);
      stats[key].work.push(a.work_environment || 0);
      if (a.recovery) stats[key].recovery.push(a.recovery);
      if (a.stress_level) stats[key].stress.push(a.stress_level);
      stats[key].total++;

      const ts = new Date(a.created_date || a.created_at || Date.now());
      if (!stats[key].lastUpdated || ts > stats[key].lastUpdated) stats[key].lastUpdated = ts;
      if (ts >= fourWeeksAgo) stats[key].last4w++;
    });

    const result = {};
    Object.entries(stats).forEach(([dept, data]) => {
      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const overall = (avg(data.physical) + avg(data.mental) + avg(data.work)) / 3;
      result[dept] = {
        physical: avg(data.physical),
        mental: avg(data.mental),
        work: avg(data.work),
        recovery: avg(data.recovery),
        stress: avg(data.stress),
        responses: data.total,
        overall,
        overall10: Math.max(0, Math.min(10, overall * 2)),
        lastUpdated: data.lastUpdated,
        last4w: data.last4w,
      };
    });

    return result;
  }, [assessments]);

  const sessionsAgg = useMemo(() => {
    if (!sessions.length) return {};
    const agg = {};
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    sessions.forEach((s) => {
      const key = s.department_name || s.department || 'Ikke oppgitt';
      if (!agg[key]) {
        agg[key] = { lastRiskLevel: null, lastUpdated: null, last4w: 0 };
      }
      const ts = new Date(s.created_at || s.completed_at || s.created_date || Date.now());
      if (!agg[key].lastUpdated || ts > agg[key].lastUpdated) {
        agg[key].lastUpdated = ts;
        agg[key].lastRiskLevel = s.risk_level || null;
      }
      if (ts >= fourWeeksAgo) agg[key].last4w += 1;
    });

    return agg;
  }, [sessions]);

  const selectedStats = selectedDept ? departmentStats[selectedDept] : null;

  const radarData = selectedStats ? [
    { subject: 'Fysisk', value: selectedStats.physical },
    { subject: 'Mental', value: selectedStats.mental },
    { subject: 'Arbeidsforhold', value: selectedStats.work },
    { subject: 'Restitusjon', value: selectedStats.recovery || 3 },
    { subject: 'Stress', value: selectedStats.stress || 3 },
  ] : [];

  const getRiskBadge = (score) => {
    if (score >= 4) return { label: 'Lav risiko', color: 'bg-emerald-100 text-emerald-700' };
    if (score >= 3) return { label: 'Moderat', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Høy risiko', color: 'bg-red-100 text-red-700' };
  };

  const riskBadgeFromLevel = (level) => {
    if (!level) return null;
    if (level === 'low') return { label: 'Lav risiko', color: 'bg-emerald-100 text-emerald-700' };
    if (level === 'moderate') return { label: 'Moderat', color: 'bg-amber-100 text-amber-700' };
    if (level === 'high') return { label: 'Høy risiko', color: 'bg-red-100 text-red-700' };
    return { label: 'Ukjent', color: 'bg-slate-100 text-slate-600' };
  };

  const StatItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-900">{value.toFixed(1)}</span>
        <span className="text-slate-400">/5</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Avdelinger</h1>
        <p className="text-slate-500 mt-1">Detaljert innsikt per avdeling</p>
      </div>

      {/* Department selector */}
      <Card>
        <CardContent className="pt-6">
          <Select value={selectedDept || ''} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Velg avdeling for detaljert innsikt..." />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {dept.name}
                    {departmentStats[dept.name] && (
                      <Badge className={cn("ml-2", getRiskBadge(departmentStats[dept.name].overall).color)}>
                        {departmentStats[dept.name].overall.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stats card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedDept}</CardTitle>
                <Badge className={getRiskBadge(selectedStats.overall).color}>
                  {getRiskBadge(selectedStats.overall).label}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{selectedStats.responses} kartlegginger mottatt</p>
            </CardHeader>
            <CardContent>
              <StatItem
                icon={Activity}
                label="Fysisk belastning"
                value={selectedStats.physical}
                color="bg-blue-100 text-blue-600"
              />
              <StatItem
                icon={Brain}
                label="Mental helse"
                value={selectedStats.mental}
                color="bg-purple-100 text-purple-600"
              />
              <StatItem
                icon={Briefcase}
                label="Arbeidsforhold"
                value={selectedStats.work}
                color="bg-emerald-100 text-emerald-600"
              />
            </CardContent>
          </Card>

          {/* Radar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Helseprofil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const stats = departmentStats[dept.name];
            const sess = sessionsAgg[dept.name] || {};
            const risk = sess.lastRiskLevel
              ? riskBadgeFromLevel(sess.lastRiskLevel)
              : (stats ? getRiskBadge(stats.overall) : { label: 'Ingen data', color: 'bg-slate-100 text-slate-600' });
            const last4w = sess.last4w ?? stats?.last4w ?? 0;
            const lastUpdated = sess.lastUpdated || stats?.lastUpdated || null;
            
            return (
              <Card 
                key={dept.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedDept(dept.name)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-slate-600" />
                    </div>
                    <Badge className={risk.color}>{risk.label}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>{dept.employee_count} ansatte</span>
                  </div>
                  {(stats || sess) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      {stats && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Indeks</span>
                          <span className="font-semibold text-slate-900">{stats.overall10.toFixed(1)}/10</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Siste 4 uker: <span className="font-medium text-slate-700">{last4w}</span></span>
                        {lastUpdated && (
                          <span>
                            Sist oppdatert: {format(new Date(lastUpdated), 'dd. MMM yyyy', { locale: nb })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}