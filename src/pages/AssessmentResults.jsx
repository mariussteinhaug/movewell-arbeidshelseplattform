import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
import { FixedSizeList as List } from "react-window";

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

/** Måler høyden på et element (for react-window) */
function useElementHeight() {
  const ref = useRef(null);
  const [height, setHeight] = useState(520);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const ro = new ResizeObserver(() => {
      const h = Math.max(240, Math.floor(el.getBoundingClientRect().height));
      setHeight(h);
    });

    ro.observe(el);
    // init
    const h = Math.max(240, Math.floor(el.getBoundingClientRect().height));
    setHeight(h);

    return () => ro.disconnect();
  }, []);

  return { ref, height };
}

export default function AssessmentResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [sortMode, setSortMode] = useState("alpha"); // "alpha" | "latest"

  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [selectedProfileDept, setSelectedProfileDept] = useState(null);
  const [selectedProfileName, setSelectedProfileName] = useState("");
  const [profileSession, setProfileSession] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Når vi åpner en profil med lagret AI-svar, fyll det inn
  useEffect(() => {
    if (profileSession?.ai_summary) setAiSuggestion(profileSession.ai_summary);
    else setAiSuggestion("");
  }, [profileSession?.id]);

  const formatSuggestion = useCallback((raw) => {
    if (!raw) return "";
    const txt = String(raw).replace(/\*\*/g, "");
    const lines = txt
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^her er/i.test(l));
    const items = lines.map((l) =>
      l.replace(/^[-•\u2022]+/i, "").replace(/^\s+/, "").replace(/^\d+[\.)]\s*/, "")
    );
    return items.slice(0, 3).join("\n");
  }, []);

  // 🧠 Current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  // Data
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

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: ["admin", "hr"].includes(String(currentUser?.role || "").toLowerCase()),
  });

  // Access rules
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "hr";
  const userDepartment = currentUser?.department;
  const canEdit = ["admin", "hr", "manager"].includes(String(currentUser?.role || "").toLowerCase());

  const accessFilteredSessions = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return sessions;
    if (userDepartment) {
      return sessions.filter((s) => (s.department_name || s.department) === userDepartment);
    }
    return sessions.filter((s) => s.created_by === currentUser.email);
  }, [sessions, currentUser, isAdmin, userDepartment]);

  // Filters (kun completed)
  const filteredSessions = useMemo(() => {
    return accessFilteredSessions.filter((session) => {
      if (session.status !== "completed") return false;

      const deptName = session.department_name || session.department;
      const matchesDept = selectedDepartment === "all" || deptName === selectedDepartment;
      const matchesRisk = selectedRiskLevel === "all" || session.risk_level === selectedRiskLevel;

      const haystack = `${deptName || ""} ${session.created_by || ""} ${session.anonymous_id || ""}`.toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());

      return matchesDept && matchesRisk && matchesSearch;
    });
  }, [accessFilteredSessions, selectedDepartment, selectedRiskLevel, searchTerm]);

  const userMap = useMemo(() => {
    const m = {};
    (users || []).forEach((u) => (m[u.id] = u));
    return m;
  }, [users]);

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

  // ✅ Respondenter: dedupe + sort
  const respondents = useMemo(() => {
    const byPerson = new Map();
    const normalizeName = (s) => (s || "").toString().trim();
    const nameFromEmail = (email) => (email ? String(email).split("@")[0] : "Anonym bruker");

    for (const s of filteredSessions) {
      const key = s.respondent_user_id || s.created_by || s.anonymous_id;
      if (!key) continue;

      const u = userMap[s.respondent_user_id];
      const display =
        normalizeName(s.respondent_display_name) ||
        normalizeName(u?.full_name) ||
        normalizeName(u?.email) ||
        normalizeName(s.created_by) ||
        nameFromEmail(s.created_by);

      const dept = s.department_name || s.department || "Ikke oppgitt";
      const ts = new Date(s.completed_at || s.created_at || s.created_date || 0).getTime();

      const existing = byPerson.get(key);
      if (!existing || ts > existing.ts) {
        byPerson.set(key, {
          key,
          userId: s.respondent_user_id || null,
          display,
          department: dept,
          ts,
          session: s,
          risk_level: s.risk_level || "unknown",
        });
      }
    }

    const arr = Array.from(byPerson.values());

    if (sortMode === "latest") {
      arr.sort((a, b) => b.ts - a.ts);
    } else {
      arr.sort((a, b) => (a.display || "").localeCompare((b.display || ""), "nb", { sensitivity: "base" }));
    }

    return arr;
  }, [filteredSessions, userMap, sortMode]);

  const openProfile = (userId, deptName, fallbackSession, displayName) => {
    setSelectedProfileUserId(userId || null);
    setSelectedProfileDept(deptName);
    setSelectedProfileName(displayName || "");

    if (userId) {
      const userSessions = accessFilteredSessions
        .filter((s) => (s.department_name || s.department) === deptName && s.respondent_user_id === userId)
        .sort(
          (a, b) =>
            new Date(b.completed_at || b.created_at || b.created_date || 0) -
            new Date(a.completed_at || a.created_at || a.created_date || 0)
        );
      setProfileSession(userSessions[0] || fallbackSession || null);
    } else {
      setProfileSession(fallbackSession || null);
    }

    setProfileOpen(true);
  };

  const generateAISuggestion = async ({ force = false } = {}) => {
    if (!profileSession) return;
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

      await base44.entities.AssessmentSession.update(profileSession.id, { ai_summary: cleaned });

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
      await base44.entities.AssessmentSession.update(profileSession.id, { ai_summary: aiSuggestion });
      setProfileSession({ ...profileSession, ai_summary: aiSuggestion });
    } finally {
      setAiLoading(false);
    }
  };

  // Stats
  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const highCount = sessions.filter((s) => s.risk_level === "high").length;
  const moderateCount = sessions.filter((s) => s.risk_level === "moderate").length;
  const lowCount = sessions.filter((s) => s.risk_level === "low").length;

  // react-window: mål containerhøyde
  const { ref: listWrapRef, height: listHeight } = useElementHeight();
  const ITEM_SIZE = 74; // px (rad-høyde)

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const r = respondents[index];
    if (!r) return null;

    const lastDate = r.session?.completed_at || r.session?.created_at || r.session?.created_date;
    return (
      <div style={style} className="px-1">
        <button
          type="button"
          onClick={() => openProfile(r.userId, r.department, r.session, r.display)}
          className="w-full flex items-center justify-between p-3 rounded-lg border transition bg-white hover:bg-slate-50 border-slate-200"
          title="Åpne profil"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-100 grid place-items-center text-slate-700 text-xs font-semibold">
              {(r.display?.[0] || "A").toUpperCase()}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{r.display}</p>
                <Badge className={riskLevelColors[r.risk_level] || riskLevelColors.unknown}>
                  {(riskLevelLabels[r.risk_level] || "Ukjent")} risiko
                </Badge>
              </div>

              <p className="text-xs text-slate-500">
                {r.department}
                {lastDate ? ` • ${format(new Date(lastDate), "dd. MMM yyyy", { locale: nb })}` : ""}
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400">Vis profil</span>
        </button>
      </div>
    );
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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Kartleggingsresultater</h1>
        <p className="text-slate-500 mt-1">Oversikt over alle fullførte helsekartlegginger</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totalt fullførte</CardDescription>
            <CardTitle className="text-3xl">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Høy risiko</CardDescription>
            <CardTitle className="text-3xl text-red-600">{highCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Moderat risiko</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{moderateCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lav risiko</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{lowCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Søk etter avdeling, e-post eller ID..."
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

            <Select value={sortMode} onValueChange={setSortMode}>
              <SelectTrigger>
                <SelectValue placeholder="Sorter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpha">Alfabetisk (A–Å)</SelectItem>
                <SelectItem value="latest">Siste svar først</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Respondents */}
      <Card>
        <CardHeader>
          <CardTitle>Ansatte som har svart</CardTitle>
          <CardDescription>
            Virtuell liste (raskt med 500+). Klikk på en ansatt for å se svar og AI-forslag.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {respondents.length === 0 ? (
            <p className="text-sm text-slate-500">Ingen svar i utvalget.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">Totalt: {respondents.length}</p>
                <p className="text-xs text-slate-500">Scroller uten paging</p>
              </div>

              {/* react-window trenger en fast høyde: vi måler containeren */}
              <div
                ref={listWrapRef}
                className="h-[420px] sm:h-[520px] border border-slate-200 rounded-xl bg-slate-50/30"
              >
                <List
                  height={listHeight}
                  itemCount={respondents.length}
                  itemSize={ITEM_SIZE}
                  width="100%"
                  overscanCount={8}
                >
                  {Row}
                </List>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {(selectedProfileName || userMap[selectedProfileUserId]?.full_name || "Ansatt")} —{" "}
              {selectedProfileDept || ""}
            </DialogTitle>
          </DialogHeader>

          {profileSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={riskLevelColors[profileSession.risk_level] || riskLevelColors.unknown}>
                  {riskLevelLabels[profileSession.risk_level] || "Ukjent"} risiko
                </Badge>
                <span className="text-xs text-slate-500">
                  {format(
                    new Date(profileSession.created_at || profileSession.completed_at || profileSession.created_date),
                    "dd. MMM yyyy, HH:mm",
                    { locale: nb }
                  )}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {profileSession.answered_questions?.map((qa, idx) => {
                  const q = questions.find((qu) => qu.question_id === qa.question_id);
                  return (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-sm font-medium text-slate-900">{q?.text || qa.question_id}</p>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateAISuggestion({ force: false })}
                      disabled={aiLoading || !profileSession || !!profileSession?.ai_summary}
                      className="border-slate-200"
                      title={profileSession?.ai_summary ? "Allerede lagret" : "Generer forslag"}
                    >
                      {aiLoading ? "Genererer…" : "Generer"}
                    </Button>

                    {canEdit && profileSession?.ai_summary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={aiLoading}
                        onClick={() => {
                          const ok = window.confirm("Vil du generere på nytt og overskrive lagret AI-forslag?");
                          if (ok) generateAISuggestion({ force: true });
                        }}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Regenerer
                      </Button>
                    )}

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
