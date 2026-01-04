import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  AlertCircle,
  Calendar,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function AssessmentResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [selectedProfileDept, setSelectedProfileDept] = useState(null);
  const [profileSession, setProfileSession] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // 🧠 Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  // 🔍 Load data
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["assessment-sessions"],
    queryFn: () => base44.entities.AssessmentSession.list("created_date"),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["questions"],
    queryFn: () => base44.entities.QuestionBank.list("order"),
  });

  // Brukere (kun admin kan liste brukere i Base44)
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === "admin",
  });

  // 🧮 Access rules
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "hr";
  const userDepartment = currentUser?.department;

  const accessFilteredSessions = React.useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return sessions;
    if (userDepartment)
      return sessions.filter((s) => (s.department_name || s.department) === userDepartment);
    return sessions.filter((s) => s.created_by === currentUser.email);
  }, [sessions, currentUser, isAdmin, userDepartment]);

  // 🧹 Filters
  const filteredSessions = accessFilteredSessions.filter((session) => {
    const deptName = session.department_name || session.department;
    const matchesDept = selectedDepartment === "all" || deptName === selectedDepartment;
    const matchesRisk = selectedRiskLevel === "all" || session.risk_level === selectedRiskLevel;
    const matchesSearch =
      !searchTerm ||
      deptName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.anonymous_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesRisk && matchesSearch && session.status === "completed";
  });

  // Map for å finne brukernavn fra respondent_user_id
  const userMap = React.useMemo(() => {
    const m = {};
    (users || []).forEach((u) => {
      m[u.id] = u;
    });
    return m;
  }, [users]);

  // Grupper profiler per avdeling med antall og navneliste
  const deptGroups = React.useMemo(() => {
    const groups = new Map();
    for (const s of filteredSessions) {
      const dept = s.department_name || s.department || "Ikke oppgitt";
      if (!groups.has(dept)) groups.set(dept, { count: 0, respondents: new Map() });
      const g = groups.get(dept);
      g.count += 1;
      const key = s.respondent_user_id || s.anonymous_id;
      if (!g.respondents.has(key)) {
        const u = userMap[s.respondent_user_id];
        const display = u?.full_name || u?.email || "Ukjent ansatt";
        g.respondents.set(key, { userId: s.respondent_user_id || null, display });
      }
    }
    return Array.from(groups.entries()).map(([department, data]) => ({
      department,
      count: data.count,
      respondents: Array.from(data.respondents.values()),
    }));
  }, [filteredSessions, userMap]);

  const openProfile = (userId, deptName) => {
    setSelectedProfileUserId(userId);
    setSelectedProfileDept(deptName);
    const sessions = accessFilteredSessions
      .filter((s) => (s.department_name || s.department) === deptName && s.respondent_user_id === userId)
      .sort((a, b) => new Date(b.created_at || b.completed_at) - new Date(a.created_at || a.completed_at));
    setProfileSession(sessions[0] || null);
    setAiSuggestion("");
    setProfileOpen(true);
  };

  const generateAISuggestion = async () => {
    if (!profileSession) return;
    setAiLoading(true);
    const answeredData = (profileSession.answered_questions || []).map((qa) => {
      const q = questions.find((qu) => qu.question_id === qa.question_id);
      return { question: q?.text || qa.question_id, answer: qa.answer };
    });
    const res = await base44.integrations.Core.InvokeLLM({
      prompt:
        `Du er en norsk HMS-rådgiver. Basert på svarene under, gi 3 konkrete forslag til tiltak i punktliste.\n` +
        `Risikonivå: ${profileSession.risk_level}\n` +
        `Risikosignaler: ${(profileSession.risk_signals || []).join(", ")}\n` +
        `Svar: ${JSON.stringify(answeredData).slice(0, 4000)}\n` +
        `Svar på norsk som punktliste.`,
    });
    setAiSuggestion(typeof res === "string" ? res : JSON.stringify(res));
    setAiLoading(false);
  };

  const toggleExpanded = (sessionId) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) newExpanded.delete(sessionId);
    else newExpanded.add(sessionId);
    setExpandedSessions(newExpanded);
  };

  const riskLevelColors = {
    low: "bg-emerald-100 text-emerald-700",
    moderate: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
    unknown: "bg-slate-100 text-slate-700",
  };

  const riskLevelLabels = {
    low: "Lav",
    moderate: "Moderat",
    high: "Høy",
    unknown: "Ukjent",
  };

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Kartleggingsresultater
        </h1>
        <p className="text-slate-500 mt-1">
          Oversikt over alle fullførte helsekartlegginger
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totalt fullførte</CardDescription>
            <CardTitle className="text-3xl">
              {sessions.filter((s) => s.status === "completed").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Høy risiko</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {sessions.filter((s) => s.risk_level === "high").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Moderat risiko</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {sessions.filter((s) => s.risk_level === "moderate").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lav risiko</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {sessions.filter((s) => s.risk_level === "low").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Søk etter avdeling eller ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle avdelinger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle avdelinger</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedRiskLevel}
              onValueChange={setSelectedRiskLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle risikonivåer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle risikonivåer</SelectItem>
                <SelectItem value="high">Høy risiko</SelectItem>
                <SelectItem value="moderate">Moderat risiko</SelectItem>
                <SelectItem value="low">Lav risiko</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profiler per avdeling</CardTitle>
          <CardDescription>Se hvem som har svart per avdeling og åpne profil</CardDescription>
        </CardHeader>
        <CardContent>
          {deptGroups.length === 0 ? (
            <p className="text-sm text-slate-500">Ingen profiler i utvalget.</p>
          ) : (
            <div className="space-y-3">
              {deptGroups.map((g) => (
                <div key={g.department} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedDepartment(g.department)}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      {g.department}
                    </button>
                    <Badge variant="secondary">{g.count}</Badge>
                  </div>
                  {selectedDepartment === g.department && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.respondents.map((r, idx) => (
                        <button
                          key={(r.userId || idx) + g.department}
                          type="button"
                          onClick={() => r.userId && openProfile(r.userId, g.department)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-60"
                          disabled={!r.userId}
                          title={r.userId ? "Åpne profil" : "Anonym bruker – kan ikke åpnes"}
                        >
                          {r.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Kartlegginger ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Ingen kartlegginger funnet</p>
              <p className="text-sm text-slate-500 mt-1">
                Prøv å justere filtrene
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const isExpanded = expandedSessions.has(session.id);
                return (
                  <div
                    key={session.id}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              className={riskLevelColors[session.risk_level]}
                            >
                              {riskLevelLabels[session.risk_level]} risiko
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {session.path}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              {session.department_name || session.department || 'Ikke oppgitt'}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {format(
                                new Date(session.created_date),
                                "dd. MMM yyyy",
                                { locale: nb }
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <User className="h-4 w-4 text-slate-400" />
                              {session.answered_questions?.length || 0} svar
                            </div>
                          </div>

                          {session.risk_signals?.length > 0 && (
                            <div className="mt-3 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {session.risk_signals
                                  .slice(0, 3)
                                  .map((signal, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {signal}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(session.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4">
                        <h4 className="font-medium text-slate-900 mb-3">
                          Detaljerte svar:
                        </h4>
                        <div className="space-y-4">
                          {session.answered_questions?.map((qa, idx) => {
                            const question = questions.find(
                              (q) => q.question_id === qa.question_id
                            );
                            return (
                              <div
                                key={idx}
                                className="bg-white rounded-lg p-4 border border-slate-200"
                              >
                                <p className="font-medium text-slate-900 text-sm mb-2">
                                  {question?.text || qa.question_id}
                                </p>
                                <p className="text-sm text-slate-700 bg-emerald-50 px-3 py-2 rounded">
                                  <span className="font-medium">Svar:</span>{" "}
                                  {Array.isArray(qa.answer)
                                    ? qa.answer.join(", ")
                                    : qa.answer}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {(userMap[selectedProfileUserId]?.full_name || "Ansatt")} — {selectedProfileDept || ""}
            </DialogTitle>
          </DialogHeader>

          {profileSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={riskLevelColors[profileSession.risk_level]}>
                  {riskLevelLabels[profileSession.risk_level]} risiko
                </Badge>
                <span className="text-xs text-slate-500">
                  {format(new Date(profileSession.created_at || profileSession.completed_at), 'dd. MMM yyyy, HH:mm', { locale: nb })}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {profileSession.answered_questions?.map((qa, idx) => {
                  const q = questions.find((qu) => qu.question_id === qa.question_id);
                  return (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-sm font-medium text-slate-900">{q?.text || qa.question_id}</p>
                      <p className="text-sm text-slate-700 mt-1">{Array.isArray(qa.answer) ? qa.answer.join(", ") : qa.answer}</p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900">AI-forslag</p>
                  <Button size="sm" onClick={generateAISuggestion} disabled={aiLoading} className="bg-emerald-600 hover:bg-emerald-700">
                    {aiLoading ? "Genererer…" : "Foreslå tiltak (AI)"}
                  </Button>
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg min-h-[60px]">
                  {aiSuggestion || "Ingen forslag generert ennå."}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Ingen data for valgt profil.</p>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}