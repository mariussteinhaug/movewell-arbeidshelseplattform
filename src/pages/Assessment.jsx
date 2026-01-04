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
    const generalQuestions = allQuestions.filter((q) => q.path === "generell" && q.order <= 12);
    if (sessionPath && sessionPath !== "not_set") {
      const pathQuestions = allQuestions.filter((q) => q.path === sessionPath);
      return [...generalQuestions, ...pathQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return generalQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allQuestions, sessionPath]);

  const currentQuestion = relevantQuestions[currentQuestionIndex];
  const currentQid = currentQuestion?.question_id;

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k] != null).length,
    [answers]
  );

  const progress = useMemo(() => {
    if (!relevantQuestions.length) return 0;
    return ((currentQuestionIndex + 1) / relevantQuestions.length) * 100;
  }, [currentQuestionIndex, relevantQuestions.length]);

  const canGoNext =
    !!currentQid &&
    (answers[currentQid] != null || (currentQid === "Q4" && selectedDepartment));

  const handleAnswer = (answer) => {
    if (!currentQid) return;
    setAnswers((prev) => ({ ...prev, [currentQid]: answer }));
    setShowFeedback(true);

    if (currentQid === "Q4") {
      setSelectedDepartment(answer);
    }

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
     AI: decide next step (failsafe)
  --------------------------- */
  const getNextQuestionAI = async () => {
    if (!currentUser) return;
    setIsAnalyzing(true);

    try {
      const answeredIds = Object.keys(answers).filter((qid) => answers[qid] != null);
      const answeredData = answeredIds.map((qid) => {
        const q = allQuestions.find((qq) => qq.question_id === qid);
        return { question: q?.text, answer: answers[qid] };
      });

      const prompt = `Du er en ekspert på arbeidshelse og sykefraværsanalyse.
Besvar kort med JSON.`;

      let result = null;
      try {
        result = await base44.integrations.Core.InvokeLLM({
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
      } catch (err) {
        console.warn("⚠️ AI disabled or failed, falling back.");
      }

      // fallback if no AI
      if (!result || result.error) {
        result = {
          stop_assessment: true,
          risk_level: "moderate",
          risk_signals: ["Fullført uten AI"],
          confidence: 1.0,
          reason: "AI ikke aktivert i Base44",
        };
      }

      if (result.stop_assessment) {
        const sessionId = await saveSession(result);
        await createInAppNotification(result, sessionId);
        setRiskAssessment(result);
        setCompleted(true);
        queryClient.invalidateQueries({ queryKey: ["assessment-sessions"] });
        return;
      }

      const nextId = result?.next_question_id;
      const idx = relevantQuestions.findIndex((q) => q.question_id === nextId);
      if (idx !== -1) {
        setCurrentQuestionIndex(idx);
        return;
      }

      // fallback to finish
      const sessionId = await saveSession(result);
      await createInAppNotification(result, sessionId);
      setRiskAssessment(result);
      setCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["assessment-sessions"] });
    } catch (error) {
      console.error("AI analysis error:", error);
      // fallback complete
      const fake = {
        stop_assessment: true,
        risk_level: "moderate",
        risk_signals: ["AI-feil"],
        confidence: 0.8,
        reason: "Fullført uten AI-analyse",
      };
      const sessionId = await saveSession(fake);
      setRiskAssessment(fake);
      setCompleted(true);
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

      const deptList = await base44.entities.Department.list();
      const dept = deptList.find((d) => d.name === selectedDepartment);

      const session = await base44.entities.AssessmentSession.create({
        organization_id: currentUser?.organization_id || "default",
        department_id: dept?.id || "unknown",
        department_name: selectedDepartment || "Ikke oppgitt",
        anonymous_id: `session_${Date.now()}`,
        path: sessionPath,
        answered_questions: answeredQuestions,
        risk_signals: assessment?.risk_signals || [],
        risk_level: assessment?.risk_level || "unknown",
        confidence: assessment?.confidence || 0,
        status: "completed",
        session_week: week,
        uploaded_documents: uploadedFiles.map((f) => f.url),
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      return session.id;
    } catch (error) {
      console.error("Feil ved lagring av sesjon:", error);
      throw error;
    }
  };

  /* ---------------------------
     Notifications (stub)
  --------------------------- */
  const createInAppNotification = async (assessment, sessionId) => {
    console.log("📝 Kartlegging fullført:", { assessment, sessionId });
  };

  /* ---------------------------
     Navigation
  --------------------------- */
  const handleNext = async () => {
    if (!canGoNext || isAnalyzing) return;
    setShowFeedback(false);
    const isLast = currentQuestionIndex >= relevantQuestions.length - 1;

    // ✅ Fullfør lokalt hvis siste spørsmål
    if (isLast) {
      await getNextQuestionAI();
      return;
    }

    if (answeredCount >= 6 && sessionPath !== "not_set") {
      await getNextQuestionAI();
      return;
    }

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
     Loading & UI
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
     Completed screen
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
              <CardDescription>AI- eller systemgenerert vurdering</CardDescription>
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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Adaptiv helsekartlegging</h1>
        <p className="text-slate-500 mt-2">
          AI-styrt kartlegging som tilpasses svarene dine – for bedre oppfølging og forebygging.
        </p>
      </div>

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

      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>
            Spørsmål {currentQuestionIndex + 1} av {relevantQuestions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

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
              <CardTitle className="text-lg leading-snug">{currentQuestion?.text}</CardTitle>
              <CardDescription>
                {currentQuestion?.category ? `Kategori: ${currentQuestion.category}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                          <p className="text-sm text-slate-500 mt-1">
                            {String(dept.sector).replace(/_/g, " ")}
                          </p>
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

              {currentQuestionIndex === relevantQuestions.length - 1 && (
                <DocumentUpload uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

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