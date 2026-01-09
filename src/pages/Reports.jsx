import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    FileText, 
    TrendingUp, 
    AlertTriangle, 
    Clock, 
    Download,
    Loader2,
    Shield,
    Users
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useRequireRoles, ROLE } from '../components/access/guard';

export default function Reports() {
    const { user, role, isLoading: authLoading, scope } = useRequireRoles([ROLE.MANAGER, ROLE.HR], "Assessment");
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [generating, setGenerating] = useState(false);
    const queryClient = useQueryClient();

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => base44.entities.Department.list(),
    });

    const { data: reports = [] } = useQuery({
        queryKey: ['reports', selectedDepartment],
        queryFn: () => {
            if (!selectedDepartment) return base44.entities.Report.list('-created_date');
            return base44.entities.Report.filter({ department: selectedDepartment }, '-created_date');
        },
    });

    const generateReport = async () => {
        if (!selectedDepartment) return;
        
        setGenerating(true);
        try {
            // Get current week
            const now = new Date();
            const currentWeek = `${now.getFullYear()}-W${String(Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 604800000)).padStart(2, '0')}`;
            const fourWeeksAgo = `${now.getFullYear()}-W${String(Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 604800000) - 4).padStart(2, '0')}`;

            // Fetch responses
            const responses = await base44.entities.HealthAssessment.filter({
                department: selectedDepartment,
                assessment_week: { $gte: fourWeeksAgo }
            });

            // GDPR Check: minimum 5 respondents
            const uniqueRespondents = new Set(responses.map(r => r.created_by)).size;
            if (uniqueRespondents < 5) {
                alert('GDPR: Minimum 5 respondenter kreves for å generere rapport. Kun ' + uniqueRespondents + ' funnet.');
                setGenerating(false);
                return;
            }

            // Calculate aggregated scores
            const avgPhysical = responses.reduce((sum, r) => sum + r.physical_load, 0) / responses.length;
            const avgMental = responses.reduce((sum, r) => sum + r.mental_wellbeing, 0) / responses.length;
            const avgWork = responses.reduce((sum, r) => sum + r.work_environment, 0) / responses.length;

            // Collect all comments
            const comments = responses.filter(r => r.comments).map(r => r.comments).join('\n');

            // AI Analysis
            const aiReport = await base44.integrations.Core.InvokeLLM({
                prompt: `Du er en arbeidshelse-ekspert. Analyser følgende anonyme data fra ${uniqueRespondents} ansatte i avdeling "${selectedDepartment}" over de siste 4 ukene:

Gjennomsnittlige scorer (1-5, hvor 1 er dårlig og 5 er bra):
- Fysisk belastning: ${avgPhysical.toFixed(2)}
- Mental helse: ${avgMental.toFixed(2)}
- Arbeidsforhold: ${avgWork.toFixed(2)}

Ansattes kommentarer:
${comments || 'Ingen kommentarer'}

Generer en strukturert analyse som identifiserer:
1. Executive summary (2-3 setninger om overordnet helsetilstand)
2. Topp 3 problemer med alvorlighetsgrad (1-5) og andel berørte (%)
3. Hoveddrivere for risiko (root causes)
4. Konkrete tiltak i tre tidshorisonter:
   - Umiddelbare tiltak (0-2 uker): Lavterskel, rask effekt
   - Kortsiktige tiltak (1-3 måneder): Systematiske forbedringer
   - Langsiktige tiltak (3-12 måneder): Strukturelle endringer`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        executive_summary: { type: "string" },
                        top_problems: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    problem: { type: "string" },
                                    severity: { type: "number" },
                                    affected_percentage: { type: "number" }
                                }
                            }
                        },
                        risk_drivers: {
                            type: "array",
                            items: { type: "string" }
                        },
                        actions_immediate: {
                            type: "array",
                            items: { type: "string" }
                        },
                        actions_short_term: {
                            type: "array",
                            items: { type: "string" }
                        },
                        actions_long_term: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            // Save report
            await base44.entities.Report.create({
                department: selectedDepartment,
                week_from: fourWeeksAgo,
                week_to: currentWeek,
                respondent_count: uniqueRespondents,
                executive_summary: aiReport.executive_summary,
                top_problems: aiReport.top_problems,
                risk_drivers: aiReport.risk_drivers,
                actions_immediate: aiReport.actions_immediate,
                actions_short_term: aiReport.actions_short_term,
                actions_long_term: aiReport.actions_long_term,
                generated_at: new Date().toISOString()
            });

            queryClient.invalidateQueries({ queryKey: ['reports'] });
        } catch (error) {
            alert('Feil ved generering av rapport: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const exportPDF = (report) => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('MoveWell Lederrapport', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Avdeling: ${report.department}`, 20, 35);
        doc.text(`Periode: ${report.week_from} til ${report.week_to}`, 20, 42);
        doc.text(`Respondenter: ${report.respondent_count}`, 20, 49);
        
        doc.setFontSize(14);
        doc.text('Executive Summary', 20, 65);
        doc.setFontSize(10);
        const summaryLines = doc.splitTextToSize(report.executive_summary, 170);
        doc.text(summaryLines, 20, 72);
        
        let yPos = 72 + summaryLines.length * 5 + 10;
        
        doc.setFontSize(14);
        doc.text('Topp 3 Problemer', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        report.top_problems?.forEach((p, i) => {
            doc.text(`${i + 1}. ${p.problem} (Alvorlighet: ${p.severity}/5, Berørte: ${p.affected_percentage}%)`, 20, yPos);
            yPos += 7;
        });
        
        yPos += 5;
        doc.setFontSize(14);
        doc.text('Tiltak - Umiddelbart (0-2 uker)', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        report.actions_immediate?.forEach(action => {
            const lines = doc.splitTextToSize(`• ${action}`, 170);
            doc.text(lines, 20, yPos);
            yPos += lines.length * 5;
        });
        
        doc.save(`MoveWell_Rapport_${report.department}_${report.week_to}.pdf`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">AI-Rapporter</h1>
                    <p className="text-slate-600 mt-2">Generer og analyser helsedata med AI</p>
                </div>
            </div>

            {/* GDPR Notice */}
            <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">GDPR-beskyttelse aktiv</h3>
                            <p className="text-sm text-slate-600">
                                Minimum 5 respondenter kreves per avdeling. All data er anonymisert og aggregert.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Generate Report */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Generer ny rapport
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Velg avdeling" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.name}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={generateReport} 
                            disabled={!selectedDepartment || generating}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Genererer...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Generer AI-Rapport
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-sm text-slate-600">
                        Analyserer siste 4 uker med data og genererer tiltak i 3 tidshorisonter
                    </p>
                </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Tidligere rapporter</h2>
                {reports.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                            <p className="text-slate-600">Ingen rapporter generert ennå</p>
                        </CardContent>
                    </Card>
                ) : (
                    reports.map(report => (
                        <Card key={report.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{report.department}</CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {format(new Date(report.created_date), 'dd.MM.yyyy HH:mm')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {report.respondent_count} respondenter
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportPDF(report)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2">Executive Summary</h4>
                                    <p className="text-sm text-slate-700">{report.executive_summary}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        Topp 3 Problemer
                                    </h4>
                                    <div className="space-y-2">
                                        {report.top_problems?.map((problem, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                                <span className="font-bold text-slate-700">{idx + 1}.</span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-900">{problem.problem}</p>
                                                    <div className="flex gap-4 mt-1 text-xs text-slate-600">
                                                        <span>Alvorlighet: {problem.severity}/5</span>
                                                        <span>Berørte: {problem.affected_percentage}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <h5 className="font-semibold text-red-900 mb-2 text-sm">Umiddelbart (0-2 uker)</h5>
                                        <ul className="space-y-1">
                                            {report.actions_immediate?.map((action, idx) => (
                                                <li key={idx} className="text-xs text-slate-700">• {action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                        <h5 className="font-semibold text-amber-900 mb-2 text-sm">Kortsiktig (1-3 mnd)</h5>
                                        <ul className="space-y-1">
                                            {report.actions_short_term?.map((action, idx) => (
                                                <li key={idx} className="text-xs text-slate-700">• {action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                        <h5 className="font-semibold text-emerald-900 mb-2 text-sm">Langsiktig (3-12 mnd)</h5>
                                        <ul className="space-y-1">
                                            {report.actions_long_term?.map((action, idx) => (
                                                <li key={idx} className="text-xs text-slate-700">• {action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}