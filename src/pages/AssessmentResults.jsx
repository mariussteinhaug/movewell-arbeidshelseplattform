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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

/** Fancy loader mens AI genererer */
function AISkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center shadow-sm">
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="h-3 w-44 rounded bg-slate-200 animate-pulse" />
          <div className="mt-2 h-2 w-72 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="text-xs text-slate-500">Tenker…</div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="h-4 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
        <div className="h-4 w-11/12 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
        <div className="h-4 w-10/12 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span>Genererer tiltak</span>
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
        </span>
      </div>
    </div>
  );
}

export default function AssessmentResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [selectedProfileDept, setSelectedProfileDept] = useState(null);
  const [selectedProfileName, setSelectedProfileName] = useState("");
  const [profileSession, setProfileSession] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Når vi åpner en profil med lagret AI-svar, fyll det inn
  React.useEffect(() => {
    if (profileSession?.ai_summary) {
      setAiSuggestion(profileSession.ai_summary);
    } else {
      setAiSuggestion(""); // tom hvis det ikke finnes lagret
    }
  }, [profileSession?.id]); // bevisst: kun når session byttes

  // Rens og formater AI-tekst: fjern stjerner/markdown og behold maks 3 tiltak (én pr linje)
  const formatSuggestion = React.useCallback((raw) => {
    if (!raw) return "";
    const txt = String(raw).replace(/\*\*/g, "");
    const lines = txt
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^her er/i.test(l));
    const items = lines.map((l) =>
      l
        .replace(/^[-•\u2022]+/i, "")
        .replace(/^\s+/, "")
        .replace(/^\d+[\.)]\s*/, "")
    );
    return items.slice(0, 3).join("\n");
  }, []);

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
    enabled: ["admin", "hr"].includes(String(currentUser?.role || "").toLowerCase()),
  });

  // 🧮 Access rules
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "hr";
  const userDepartment = currentUser?.department;
  const canEdit = ["admin", "hr", "manager"].includes(
    String(currentUser?.role || "").toLowerCase()
  );

  const accessFilteredSessions = React.useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return sessions;
    if (userDepartment)
      return sessions.filter(
        (s) => (s.department_name || s.department) === userDepartment
      );
    return sessions.filter((s) => s.created_by === currentUser.email);
  }, [sessions, currentUser, isAdmin, userDepartment]);

  // 🧹 Filters
  const filteredSessions = accessFilteredSessions.filter((session) => {
    const deptName = session.department_name || session.department;
    const matchesDept =
      selectedDepartment === "all" || deptName === selectedDepartment;
    const matchesRisk =
      selectedRiskLevel === "all" || session.risk_level === selectedRiskLevel;
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

  // Flate liste over respondenter (én rad per person, seneste sesjon)
  const respondents = React.useMemo(() => {
    const byUser = new Map();
    const nameFromEmail = (email) =>
      email ? String(email).split("@")[0] : "Anonym bruker";

    for (const s of filteredSessions) {
      const key = s.respondent_user_id || s.anonymous_id || s.created_by;
      const u = userMap[s.respondent_user_id];
      const display =
        s.respondent_display_name ||
        u?.full_name ||
        u?.email ||
        s.created_by ||
        nameFromEmail(s.created_by);

      const dept = s.department_name || s.department || "Ikke oppgitt";
      const ts = new Date(
        s.created_at || s.completed_at || s.created_date || 0
      ).getTime();

      const existing = byUser.get(key);
      if (!existing || ts > existing.ts) {
        byUser.set(key, {
          userId: s.respondent_user_id || null,
          display,
          department: dept,
          ts,
          session: s,
        });
      }
    }

    return Array.from(byUser.values()).sort((a, b) => b.ts - a.ts);
  }, [filteredSessions, userMap]);

  const openProfile = (userId, deptName, fallbackSession, displayName) => {
    setSelectedProfileUserId(userId || null);
    setSelectedProfileDept(deptName);
    setSelectedProfileName(displayName || "");

    if (userId) {
      const userSessions = accessFilteredSessions
        .filter(
          (s) =>
            (s.department_name || s.department) === deptName &&
            s.respondent_user_id === userId
        )
        .sort(
          (a, b) =>
            new Date(b.created_at || b.completed_at) -
            new Date(a.created_at || a.completed_at)
        );
      setProfileSession(userSessions[0] || null);
    } else {
      setProfileSession(fallbackSession || null);
    }

    setProfileOpen(true);
  };

  /** MANUELL generering: AI skal IKKE auto-kjøre når profil åpnes */
  const generateAISuggestion = async ({ force = false } = {}) => {
    if (!profileSession) return;

    // Ikke generer på nytt hvis allerede lagret (med mindre force=true)
    if (!force && profileSession.ai_summary) return;

    setAiLoading(true);
    try {
      const answeredData = (profileSession.answered_questions || []).map((qa) => {
        const q = questions.find((qu) => qu.question_id === qa.question_id);
        return { question: q?.text || qa.question_id, answer: qa.answer };
      });

      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          `Du er en norsk HMS-rådgiver. Skriv tre korte, konkrete tiltak i et naturlig og menneskelig språk.` +
          ` Unngå overskrift, unngå markdown, ingen stjerner, ingen tall eller punkter.` +
          ` Returner nøyaktig tre linjer, én per tiltak.` +
          `\nRisikonivå: ${profileSession.risk_level}\n` +
          `Risikosignaler: ${(profileSession.risk_signals || []).join(", ")}\n` +
          `Svar: ${JSON.stringify(answeredData).slice(0, 4000)}`,
      });

      const toStr = typeof res === "string" ? res : JSON.stringify(res);
      const cleaned = formatSuggestion(toStr);

      // Lagre på sesjonen => da blir det IKKE generert på nytt neste gang
      await base44.entities.AssessmentSession.update(profileSession.id, {
        ai_summary: cleaned,
      });

      setAiSuggestion(cleaned);
      setProfileSession({ ...profileSession, ai_summary: cleaned });
    } finally {
      setAiLoading(false);
    }
  };

  const saveAISuggestion = async () => {
    if (!profileSession || !canEdit) return;
    setAiLoading(true);
    try {
      await base44.entities.AssessmentSession.update(profileSession.id, {
        ai_summary: aiSuggestion,
      });
      setProfileSession({ ...profileSession, ai_summary: aiSuggestion });
    } finally {
      setAiLoading(false);
    }
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

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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

            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
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
          <CardTitle>Ansatte som har svart</CardTitle>
          <CardDescription>
            Klikk på en ansatt for å se svar og AI-forslag
          </CardDescription>
        </CardHeader>
        <CardContent>
          {respondents.length === 0 ? (
            <p className="text-sm text-slate-500">Ingen svar i utvalget.</p>
          ) : (
            <div className="space-y-2">
              {respondents.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openProfile(r.userId, r.department, r.session, r.display)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border transition bg-white hover:bg-slate-50 border-slate-200"
                  title="Åpne profil"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 grid place-items-center text-slate-600 text-xs">
                      {r.display?.[0] || "A"}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">{r.display}</p>
                      <p className="text-xs text-slate-500">{r.department}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">Vis profil</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {(selectedProfileName ||
                userMap[selectedProfileUserId]?.full_name ||
                "Ansatt")}{" "}
              — {selectedProfileDept || ""}
            </DialogTitle>
          </DialogHeader>

          {profileSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={riskLevelColors[profileSession.risk_level]}>
                  {riskLevelLabels[profileSession.risk_level]} risiko
                </Badge>
                <span className="text-xs text-slate-500">
                  {format(
                    new Date(profileSession.created_at || profileSession.completed_at),
                    "dd. MMM yyyy, HH:mm",
                    { locale: nb }
                  )}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {profileSession.answered_questions?.map((qa, idx) => {
                  const q = questions.find((qu) => qu.question_id === qa.question_id);
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 border border-slate-200"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {q?.text || qa.question_id}
                      </p>
                      <p className="text-sm text-slate-700 mt-1">
                        {Array.isArray(qa.answer) ? qa.answer.join(", ") : qa.answer}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* AI */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-xl bg-slate-900 text-white grid place-items-center shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">AI-forslag</p>

                    {profileSession?.ai_summary ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Lagret</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-700">Ikke generert</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Generer kun manuelt (ikke auto) */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateAISuggestion({ force: false })}
                      disabled={aiLoading || !profileSession || !!profileSession?.ai_summary}
                      className="border-slate-200"
                      title={
                        profileSession?.ai_summary
                          ? "Allerede lagret for denne kartleggingen"
                          : "Generer forslag"
                      }
                    >
                      {aiLoading ? "Genererer…" : "Generer"}
                    </Button>

                    {/* Valgfri: Regenerer (kun hvis man vil overskrive, og kun for de som kan edit) */}
                    {canEdit && profileSession?.ai_summary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={aiLoading}
                        onClick={() => {
                          const ok = window.confirm(
                            "Vil du generere på nytt og overskrive lagret AI-forslag?"
                          );
                          if (ok) generateAISuggestion({ force: true });
                        }}
                        className="text-slate-600 hover:text-slate-900"
                        title="Generer på nytt (overskriver)"
                      >
                        Regenerer
                      </Button>
                    )}

                    {/* Lagre (for HR/leder/admin) */}
                    {canEdit && (
                      <Button
                        size="sm"
                        onClick={saveAISuggestion}
                        disabled={aiLoading || !profileSession}
                        className="bg-slate-900 hover:bg-slate-800"
                      >
                        {aiLoading ? "Lagrer…" : "Lagre"}
                      </Button>
                    )}
                  </div>
                </div>

                {aiLoading ? (
                  <AISkeleton />
                ) : canEdit ? (
                  <Textarea
                    value={aiSuggestion}
                    onChange={(e) => setAiSuggestion(e.target.value)}
                    placeholder="Trykk Generer for å få forslag, eller skriv inn egne tiltak..."
                    className="min-h-[140px] bg-white"
                  />
                ) : (
                  <div className="text-[15px] text-slate-800 whitespace-pre-wrap bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm leading-relaxed min-h-[72px]">
                    {aiSuggestion || "Ingen forslag generert ennå."}
                  </div>
                )}
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
