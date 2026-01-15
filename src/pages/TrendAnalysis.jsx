import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Loader2, Calendar, BarChart3, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format, subMonths } from 'date-fns';
import { useRequireRoles, ROLE } from '../components/access/guard';

export default function TrendAnalysis() {
  const { user, role, isLoading: authLoading, scope } = useRequireRoles([ROLE.HR], "Dashboard");
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('3');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [latestReport, setLatestReport] = useState(null);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    enabled: !authLoading,
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['assessment-sessions'],
    queryFn: () => base44.entities.AssessmentSession.list('-created_date', 500),
    enabled: !authLoading,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const generateTrendReport = async () => {
    setGeneratingReport(true);
    try {
      // Filtrer data basert på valgt periode
      const monthsAgo = parseInt(selectedPeriod);
      const cutoffDate = subMonths(new Date(), monthsAgo);
      
      const filteredSessions = allSessions.filter(s => 
        new Date(s.created_date) >= cutoffDate && s.completed
      );

      if (filteredSessions.length === 0) {
        alert('Ingen data tilgjengelig for valgt periode');
        setGeneratingReport(false);
        return;
      }

      // Aggreger data per avdeling
      const deptStats = {};
      departments.forEach(dept => {
        const deptSessions = filteredSessions.filter(s => s.department === dept.name);
        
        if (deptSessions.length > 0) {
          const riskCounts = { low: 0, moderate: 0, high: 0, unknown: 0 };
          const allRiskSignals = [];
          const paths = {};

          deptSessions.forEach(session => {
            riskCounts[session.risk_level || 'unknown']++;
            if (session.risk_signals) {
              allRiskSignals.push(...session.risk_signals);
            }
            paths[session.path] = (paths[session.path] || 0) + 1;
          });

          // Finn mest vanlige risikosignaler
          const signalFrequency = {};
          allRiskSignals.forEach(signal => {
            signalFrequency[signal] = (signalFrequency[signal] || 0) + 1;
          });

          const topSignals = Object.entries(signalFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([signal, count]) => ({ signal, count }));

          deptStats[dept.name] = {
            totalAssessments: deptSessions.length,
            riskCounts,
            topSignals,
            primaryPath: Object.entries(paths).sort((a, b) => b[1] - a[1])[0]?.[0] || 'generell',
            avgConfidence: deptSessions.reduce((sum, s) => sum + (s.confidence || 0), 0) / deptSessions.length
          };
        }
      });

      // Generer AI-rapport
      const prompt = `Du er en ekspert på arbeidshelse og organisasjonsutvikling. Analyser følgende trenddata fra helsekartlegginger de siste ${monthsAgo} månedene:

TOTALDATA:
- Totalt antall kartlegginger: ${filteredSessions.length}
- Periode: ${format(cutoffDate, 'dd.MM.yyyy')} - ${format(new Date(), 'dd.MM.yyyy')}

AVDELINGSSTATISTIKK:
${Object.entries(deptStats).map(([dept, stats]) => `
Avdeling: ${dept}
- Antall kartlegginger: ${stats.totalAssessments}
- Risikonivå fordeling: Lav: ${stats.riskCounts.low}, Moderat: ${stats.riskCounts.moderate}, Høy: ${stats.riskCounts.high}
- Hovedproblemområde: ${stats.primaryPath}
- Topp risikosignaler: ${stats.topSignals.map(s => `${s.signal} (${s.count}x)`).join(', ')}
`).join('\n')}

Gi en omfattende analyse som inkluderer:

1. **EXECUTIVE SUMMARY**: Kort oppsummering av de viktigste funnene (2-3 setninger)

2. **TRENDER OG MØNSTRE**: 
   - Hvilke avdelinger har høyest risiko?
   - Hvilke problemområder er mest utbredt?
   - Er det forskjeller mellom avdelinger?

3. **PRIORITERTE TILTAK**: 
   - Umiddelbare tiltak (0-4 uker) som bør implementeres
   - Kortsiktige tiltak (1-3 måneder)
   - Langsiktige tiltak (3-12 måneder)

4. **ANBEFALINGER PER AVDELING**: Spesifikke tiltak for hver avdeling basert på deres unike risikoprofil

5. **RESSURSER OG VERKTØY**: Hvilke eksterne ressurser kan være nyttige (fysioterapeut, ergonomi-vurdering, etc.)

Vær konkret, datadrevet og handlingsorientert i anbefalingene.`;

      const aiReport = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      const reportData = {
        period_months: monthsAgo,
        generated_at: new Date().toISOString(),
        total_assessments: filteredSessions.length,
        department_stats: deptStats,
        ai_analysis: aiReport
      };

      setLatestReport(reportData);
      
    } catch (error) {
      console.error('Feil ved generering av rapport:', error);
      alert('Kunne ikke generere rapport. Prøv igjen.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const riskLevelColor = (level) => {
    switch(level) {
      case 'low': return 'bg-emerald-100 text-emerald-700';
      case 'moderate': return 'bg-amber-100 text-amber-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Trendanalyse</h1>
        <p className="text-slate-500 mt-1">AI-drevet analyse av helsekartlegging over tid</p>
      </div>

      {/* Generate Report Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Generer ny trendrapport
          </CardTitle>
          <CardDescription>
            Velg tidsperiode og la AI analysere trender i helsekartlegginger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-700">Tidsperiode</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Siste måned</SelectItem>
                  <SelectItem value="3">Siste 3 måneder</SelectItem>
                  <SelectItem value="6">Siste 6 måneder</SelectItem>
                  <SelectItem value="12">Siste år</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={generateTrendReport}
              disabled={generatingReport || allSessions.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyserer...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generer rapport
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>Totalt {allSessions.length} kartlegginger tilgjengelig</span>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {latestReport && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Totalt kartlegginger</CardDescription>
                <CardTitle className="text-3xl">{latestReport.total_assessments}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Periode</CardDescription>
                <CardTitle className="text-xl">Siste {latestReport.period_months} mnd</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avdelinger analysert</CardDescription>
                <CardTitle className="text-3xl">{Object.keys(latestReport.department_stats).length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Department Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Avdelingsstatistikk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(latestReport.department_stats).map(([deptName, stats]) => (
                  <div key={deptName} className="border-b border-slate-200 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{deptName}</h3>
                      <Badge variant="outline">{stats.totalAssessments} kartlegginger</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">Lav risiko</span>
                        <span className="text-lg font-semibold text-emerald-600">{stats.riskCounts.low}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">Moderat</span>
                        <span className="text-lg font-semibold text-amber-600">{stats.riskCounts.moderate}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">Høy risiko</span>
                        <span className="text-lg font-semibold text-red-600">{stats.riskCounts.high}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">Hovedområde</span>
                        <span className="text-sm font-medium text-slate-700">{stats.primaryPath}</span>
                      </div>
                    </div>

                    {stats.topSignals.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Mest rapporterte risikosignaler:</p>
                        <div className="flex flex-wrap gap-2">
                          {stats.topSignals.map((sig, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {sig.signal} ({sig.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                AI-generert analyse og anbefalinger
              </CardTitle>
              <CardDescription>
                Generert {format(new Date(latestReport.generated_at), 'dd.MM.yyyy HH:mm')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {latestReport.ai_analysis}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!latestReport && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Ingen rapport generert ennå</p>
              <p className="text-sm text-slate-500 mt-1">
                Velg en tidsperiode og klikk "Generer rapport" for å starte analysen
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}