import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  CheckCircle2,
  Shield,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import QuestionRenderer from "../components/assessment/QuestionRenderer";
import QuestionFeedback from "../components/assessment/QuestionFeedback";
import DocumentUpload from "../components/assessment/DocumentUpload";
import { cn } from "@/lib/utils";

/* ---------------------------
   Helpers
--------------------------- */

// ISO week string YYYY-WW
function getISOWeekString(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
}

function safeArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function prettyRisk(level) {
  if (level === "low") return { label: "Lav", chip: "bg-emerald-100 text-emerald-700" };
  if (level === "moderate") return { label: "Moderat", chip: "bg-amber-100 text-amber-800" };
  if (level === "high") return { label: "Høy", chip: "bg-red-100 text-red-700" };
  return { label: "Ukjent", chip: "bg-slate-100 text-slate-700" };
}

// Next unanswered question fallback (keeps flow stable)
function nextUnansweredIndex(questions, answers, fromIndex) {
  for (let i = fromIndex + 1; i < questions.length; i++) {
    const qid = questions[i]?.question_id;
    if (qid && answers[qid] == null) return i;
  }
  return -1;
}

/* ---------------------------
   Page
--------------------------- */

export default function Assessment() {
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionPath, setSessionPath] = useState("not_set");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(null);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Current user once
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: allQuestions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => base44.entities.QuestionBank.list("order"),
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => base44.entities.Department.list(),
  });

  const relevantQuestions = useMemo(() => {
    if (!allQuestions.length) return [];

    // “general” first (<=12)
    const generalQuestions = allQuestions.filter((q) => q.path === "generell" && q.order <= 12);

    if (sessionPath && sessionPath !== "not_set") {
      const pathQuestions = allQuestions.filter((q) => q.path === sessionPath);
      return [...generalQuestions, ...pathQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return generalQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allQuestions, sessionPath]);

  const currentQuestion = relevantQuestions[currentQuestionIndex];
  const currentQid = currentQuestion?.question_id;

  const answeredCount = useMemo(() => Object.keys(answers).filter((k) => answers[k] != null).length, [answers]);
  const progress = useMemo(() => {
    if (!relevantQuestions.length) return 0;
    // progress by “position” feels better than answers count
    return ((currentQuestionIndex + 1) / relevantQuestions.length) * 100;
  }, [currentQuestionIndex, relevantQuestions.length]);

  const canGoNext = !!currentQid && (
   answers[currentQid] != null ||
  (currentQid === "Q4" && selectedDepartment)
);

  const handleAnswer = (answer) => {
    if (!currentQid) return;

    setAnswers((prev) => ({ ...prev, [currentQid]: answer }));
    setShowFeedback(true);

    // Department selection on Q4
    if (currentQid === "Q4") {
      setSelectedDepartment(answer);
    }

    // Path selection on Q6
    if (currentQid === "Q6") {
      const pathMap = {
        "Muskel- og skjelettplager": "muskel",
        "Fysisk sykdom": "fysisk",
        "Psykisk helse": "psykisk",
        "Andre årsaker": "annet",
      };
      setSessionPath(pathMap[answer] || "generell");
    }
  };

  /* ---------------------------
     AI: decide next step
  --------------------------- */
  const getNextQuestionAI = async () => {
    if (!currentUser) return;

    setIsAnalyzing(true);

    const answeredQuestionIds = Object.keys(answers).filter((qid) => answers[qid] != null);
    const answeredData = answeredQuestionIds.map((qid) => {
      const q = allQuestions.find((qq) => qq.question_id === qid);
      return { question: q?.text, answer: answers[qid] };
    });

    const unanswered = relevantQuestions
      .filter((q) => !answeredQuestionIds.includes(q.question_id))
      .map((q) => `${q.question_id}: ${q.text} (kategori: ${q.category}, vekt: ${q.severity_weight})`)
      .join("\n");

    const prompt = `Du er en ekspert på arbeidshelse og sykefraværsanalyse.

Kontekst:
- Path valgt: ${sessionPath}
- Besvarte spørsmål: ${answeredQuestionIds.length}

Hittil besvarte spørsmål og svar:
${answeredData.map((d) => `Q: ${d.question}\nA: ${d.answer}`).join("\n\n")}

Tilgjengelige ubesvarte spørsmål:
${unanswered}

Returner JSON med:
{
  "stop_assessment": true/false,
  "risk_level": "low/moderate/high" (kun hvis stop),
  "risk_signals": ["..."] (kun hvis stop),
  "confidence": 0.0-1.0 (kun hvis stop),
  "next_question_id": "QXX" (kun hvis fortsett),
  "reason": "begrunnelse"
}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            stop_assessment: { type: "boolean" },
            risk_level: { type: "string" },
            risk_signals: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
            next_question_id: { type: "string" },
            reason: { type: "string" },
          },
        },
      });

      // If AI says stop OR can’t find next => stop and save
      if (result?.stop_assessment) {
        const sessionId = await saveSession(result);
        await createInAppNotification(result, sessionId);
        setRiskAssessment(result);
        setCompleted(true);
        queryClient.invalidateQueries({ queryKey: ["assessment-sessions"] });
        return;
      }

      // Try jump to AI’s suggested question
      const nextId = result?.next_question_id;
      const idx = relevantQuestions.findIndex((q) => q.question_id === nextId);

      if (idx !== -1) {
        setCurrentQuestionIndex(idx);
        return;
      }

      // Fallback: next unanswered
      const fallbackIdx = nextUnansweredIndex(relevantQuestions, answers, currentQuestionIndex);
      if (fallbackIdx !== -1) {
        setCurrentQuestionIndex(fallbackIdx);
        return;
      }

      // Otherwise stop
      const sessionId = await saveSession(result);
      await createInAppNotification(result, sessionId);
      setRiskAssessment(result);
      setCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["assessment-sessions"] });
    } catch (error) {
      console.error("AI analysis error:", error);
      alert("Det oppstod en feil ved analysen. Prøv igjen.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---------------------------
     Save session
  --------------------------- */
  const saveSession = async (assessment) => {
    try {
      const week = getISOWeekString(new Date());

      const answeredQuestions = Object.keys(answers)
        .filter((qid) => answers[qid] != null)
        .map((qid) => ({
          question_id: qid,
          answer: answers[qid],
          timestamp: new Date().toISOString(),
        }));

      const session = await base44.entities.AssessmentSession.create({
        anonymous_id: `session_${Date.now()}`,
        department: selectedDepartment || "Ikke oppgitt",
        path: sessionPath,
        answered_questions: answeredQuestions,
        risk_signals: assessment?.risk_signals || [],
        risk_level: assessment?.risk_level || "unknown",
        confidence: assessment?.confidence || 0,
        completed: true,
        session_week: week,
        uploaded_documents: uploadedFiles.map((f) => f.url),
      });

      return session.id;
    } catch (error) {
      console.error("Feil ved lagring av sesjon:", error);
      throw error;
    }
  };

  /* ---------------------------
     Notifications & follow-up (Message + Accommodation)
  --------------------------- */
  const createInAppNotification = async (assessment, sessionId) => {
    try {
      if (!currentUser) return;

      const deptList = await base44.entities.Department.list();
      const dept = deptList.find((d) => d.name === selectedDepartment);

      // 1) AI recommendation text
      const answeredData = Object.keys(answers)
        .filter((qid) => answers[qid] != null)
        .map((qid) => {
          const q = allQuestions.find((qq) => qq.question_id === qid);
          return `Spørsmål: ${q?.text}\nSvar: ${answers[qid]}`;
        })
        .join("\n\n");

      const painLocation = answers["Q13"];
      const painIntensity = answers["Q14"];
      const painFrequency = answers["Q15"];

      const aiPrompt = `Du er en ekspert på arbeidshelse, ergonomi og tilrettelegging.

En ansatt har fullført en helsekartlegging:

ANSATT:
- Navn: ${currentUser.full_name} (${currentUser.email})
- Avdeling: ${selectedDepartment}
- Risikonivå: ${assessment?.risk_level}
- Risikosignaler: ${(assessment?.risk_signals || []).join(", ")}

SMERTE:
${painLocation ? `- Lokalisering: ${safeArray(painLocation).join(", ")}` : ""}
${painIntensity ? `- Intensitet: ${painIntensity}/10` : ""}
${painFrequency ? `- Frekvens: ${painFrequency}` : ""}

Svar fra kartlegging:
${answeredData}

Gi konkrete, målrettede anbefalinger til leder og HR.
Skriv i vanlig tekst uten markdown.
Bruk punktlister med bindestrek.

Struktur:
1. UMIDDELBARE TILTAK (0-2 uker)
2. TILPASNINGER OG TILRETTELEGGING
3. OPPFØLGINGSPLAN
4. EKSTERNE RESSURSER
5. FOREBYGGENDE TILTAK FOR AVDELINGEN`;

      const aiRecommendationsRaw = await base44.integrations.Core.InvokeLLM({ prompt: aiPrompt });

      const cleanRecommendations = String(aiRecommendationsRaw || "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/##/g, "")
        .replace(/#/g, "");

      // 2) Find recipients (HR/admin + dept manager if email exists)
      // NOTE: if you changed roles, include hr/manager/admin
      let users = [];
      try {
        users = await base44.entities.User.list();
      } catch (e) {
        // If User entity doesn’t exist, we still send to manager below (if present)
        users = [];
      }

      const hrUsers = users.filter((u) => ["admin", "hr"].includes(String(u.role || "").toLowerCase()));
      const risk = prettyRisk(assessment?.risk_level);

      const messageContent = `ANSATT:
- Navn: ${currentUser.full_name}
- E-post: ${currentUser.email}
- Avdeling: ${selectedDepartment}

RESULTAT:
- Risikonivå: ${risk.label}
- Risikosignaler: ${(assessment?.risk_signals || []).join(", ") || "Ingen spesifikke"}
- Begrunnelse: ${assessment?.reason || "—"}

ANBEFALINGER:
${cleanRecommendations}

---
Systemgenerert varsling (MoveWell).`;

      // Send to HR users
      for (const hr of hrUsers) {
        await base44.entities.Message.create({
          recipient_email: hr.email,
          recipient_name: hr.full_name,
          sender_email: "system@movewell.no",
          sender_name: "MoveWell System",
          subject: `Ny helsekartlegging: ${currentUser.full_name} – ${selectedDepartment}`,
          content: messageContent,
          category: "oppfølging",
          priority: assessment?.risk_level === "high" ? "høy" : assessment?.risk_level === "moderate" ? "normal" : "lav",
          status: "ulest",
          related_department: selectedDepartment,
          related_assessment_id: sessionId,
          sent_at: new Date().toISOString(),
          replies: [],
        });
      }

      // Department manager (if Department has manager_email)
      const managerEmail = dept?.manager_email;
      if (managerEmail && !hrUsers.find((u) => u.email === managerEmail)) {
        await base44.entities.Message.create({
          recipient_email: managerEmail,
          recipient_name: dept?.manager_name || "Avdelingsleder",
          sender_email: "system@movewell.no",
          sender_name: "MoveWell System",
          subject: `Ny helsekartlegging i din avdeling: ${selectedDepartment}`,
          content: `En ansatt i din avdeling har fullført en helsekartlegging.

ANSATT: ${currentUser.full_name}
RISIKONIVÅ: ${risk.label}

ANBEFALINGER:
${cleanRecommendations}

Vennligst følg opp med den ansatte.`,
          category: "oppfølging",
          priority: assessment?.risk_level === "high" ? "høy" : "normal",
          status: "ulest",
          related_department: selectedDepartment,
          related_assessment_id: sessionId,
          sent_at: new Date().toISOString(),
          replies: [],
        });
      }

      // 3) Create Accommodation if moderate/high
      if (assessment?.risk_level === "high" || assessment?.risk_level === "moderate") {
        await base44.entities.Accommodation.create({
          employee_email: currentUser.email,
          employee_name: currentUser.full_name,
          department: selectedDepartment,
          accommodation_type:
            assessment?.risk_level === "high"
              ? "Høy prioritet – krever tilrettelegging"
              : "Moderat prioritet – oppfølging anbefalt",
          description: `Basert på helsekartlegging:

RISIKOSIGNALER:
${(assessment?.risk_signals || []).join("\n") || "Ingen spesifikke"}

BEGRUNNELSE:
${assessment?.reason || "—"}

ANBEFALINGER:
${cleanRecommendations}`,
          status: "planlagt",
          responsible_person: dept?.manager_name || "Ikke tildelt",
          responsible_email: dept?.manager_email || "",
          risk_level: assessment?.risk_level,
          related_assessment_id: sessionId,
          last_updated: new Date().toISOString(),
          notes: `Automatisk opprettet ${new Date().toLocaleDateString("nb-NO")}`,
        });
      }
    } catch (error) {
      console.error("Feil ved opprettelse av varsling:", error);
    }
  };

  /* ---------------------------
     Nav
  --------------------------- */
  const handleNext = async () => {
    if (!canGoNext || isAnalyzing) return;

    setShowFeedback(false);

    const isLast = currentQuestionIndex >= relevantQuestions.length - 1;

    // Always run AI on last
    if (isLast) {
      await getNextQuestionAI();
      return;
    }

    // Run AI when we have enough answers + path chosen
    if (answeredCount >= 6 && sessionPath !== "not_set") {
      await getNextQuestionAI();
      return;
    }

    // Otherwise: go sequential
    setCurrentQuestionIndex((i) => Math.min(i + 1, relevantQuestions.length - 1));
  };

  const handlePrevious = () => {
    if (isAnalyzing) return;
    setCurrentQuestionIndex((i) => Math.max(i - 1, 0));
  };

  const handleRestart = () => {
    setCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSessionPath("not_set");
    setRiskAssessment(null);
    setSelectedDepartment(null);
    setUploadedFiles([]);
    setShowFeedback(false);
  };

  /* ---------------------------
     Loading states
  --------------------------- */
  if (loadingQuestions || loadingDepartments) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!allQuestions.length || !relevantQuestions.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="h-7 w-7 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Ingen spørsmål funnet</h2>
        <p className="text-slate-500 mt-2">Sjekk at QuestionBank er fylt inn.</p>
      </div>
    );
  }

  /* ---------------------------
     Completed screen (Apple-ish)
  --------------------------- */
  if (completed) {
    const risk = prettyRisk(riskAssessment?.risk_level);

    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-10">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Kartlegging fullført</h2>
            <p className="text-slate-500 mb-6">
              Takk! Svarene dine hjelper med å forbedre arbeidsmiljø og tilrettelegging.
            </p>
          </div>

          <Card className="rounded-3xl border-slate-200">
            <CardHeader>
              <CardTitle>Oppsummering</CardTitle>
              <CardDescription>AI-generert vurdering basert på svarene dine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Risikonivå</div>
                <span className={cn("px-3 py-1 rounded-full text-sm font-semibold", risk.chip)}>
                  {risk.label}
                </span>
              </div>

              {riskAssessment?.reason && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                    <p className="text-sm text-slate-700">{riskAssessment.reason}</p>
                  </div>
                </div>
              )}

              <Button onClick={handleRestart} variant="outline" className="w-full rounded-xl">
                Start ny kartlegging
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ---------------------------
     Main UI
  --------------------------- */
  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Adaptiv helsekartlegging</h1>
        <p className="text-slate-500 mt-2">
          AI-styrt kartlegging som tilpasses svarene dine – for bedre oppfølging og forebygging.
        </p>
      </div>

      {/* Privacy pill */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
        <div className="h-10 w-10 rounded-xl bg-white/70 border border-emerald-200 flex items-center justify-center">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">
            {selectedDepartment ? `Kartlegging for ${selectedDepartment}` : "Helsekartlegging"}
          </p>
          <p className="text-sm text-emerald-800/80 mt-0.5">
            Ærlige svar hjelper med å identifisere forbedringsområder og tilrettelegging.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>
            Spørsmål {currentQuestionIndex + 1} av {relevantQuestions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQid}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <Card className="rounded-3xl border-slate-200">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-snug">{currentQuestion?.text}</CardTitle>
                  <CardDescription>
                    {currentQuestion?.category ? `Kategori: ${currentQuestion.category}` : " "}
                  </CardDescription>
                </div>

                <div className="shrink-0 pt-1">
                  <QuestionFeedback show={showFeedback} onComplete={() => setShowFeedback(false)} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Department selection (Q4) */}
              {currentQid === "Q4" ? (
                <div className="space-y-2">
                  {departments.map((dept) => {
                    const active = answers["Q4"] === dept.name;
                    return (
                      <button
                        key={dept.id || dept.name}
                        type="button"
                        onClick={() => handleAnswer(dept.name)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border transition-all",
                          active
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        <p className="font-semibold text-slate-900">{dept.name}</p>
                        {dept.sector && (
                          <p className="text-sm text-slate-500 mt-1">{String(dept.sector).replace(/_/g, " ")}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQid]}
                  onAnswer={handleAnswer}
                />
              )}

              {/* Document upload on last */}
              {currentQuestionIndex === relevantQuestions.length - 1 && (
                <DocumentUpload uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* AI analyzing panel */}
      {isAnalyzing && (
        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/70 border border-blue-200 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">AI vurderer neste steg…</p>
              <p className="text-xs text-blue-800/80 mt-0.5">
                Basert på svarene dine velger AI det mest relevante oppfølgingsspørsmålet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky footer navigation (Apple-ish) */}
      <div className="fixed left-0 right-0 bottom-0 z-40">
        <div className="mx-auto max-w-2xl px-4 pb-4">
          <div className="bg-white/85 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm p-3 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isAnalyzing}
              className="flex-1 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Forrige
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext || isAnalyzing}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI analyserer…
                </>
              ) : (
                <>
                  Neste
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
