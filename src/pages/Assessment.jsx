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
  RefreshCw,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import QuestionRenderer from "../components/assessment/QuestionRenderer";
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dynamicQuestions, setDynamicQuestions] = useState([]);

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

  const displayedQuestions = useMemo(() => [...relevantQuestions, ...dynamicQuestions], [relevantQuestions, dynamicQuestions]);

  const currentQuestion = displayedQuestions[currentQuestionIndex];
  const currentQid = currentQuestion?.question_id;

  const progress = useMemo(() => {
    if (!displayedQuestions.length) return 0;
    return ((currentQuestionIndex + 1) / displayedQuestions.length) * 100;
  }, [currentQuestionIndex, displayedQuestions.length]);

  const canGoNext =
    !!currentQid &&
    (answers[currentQid] != null || (currentQid === "Q4" && selectedDepartment));

  const handleAnswer = (answer) => {
    if (!currentQid) return;
    setAnswers((prev) => ({ ...prev, [currentQid]: answer }));

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
     Varsling til HR og leder
  --------------------------- */
  const createInAppNotification = async (assessment, sessionId) => {
    try {
      if (!currentUser) return;

      // Finn avdeling (for å sende som broadcast til ledelse/HR)
      const deptList = await base44.entities.Department.list();
      const dept = deptList.find((d) => d.name === selectedDepartment);

      // Generer korte AI-forslag til tiltak
      let recommendationsText = "";
      try {
        const answeredIds = Object.keys(answers).filter((qid) => answers[qid] != null);
        const answeredData = answeredIds.map((qid) => {
          const q = allQuestions.find((qq) => qq.question_id === qid);
          return { question: q?.text || qid, answer: answers[qid] };
        });
        const aiRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Du er en norsk HMS-rådgiver. Basert på input under, lag 3 konkrete forslag til tiltak (korte punkt) for avdeling "${selectedDepartment || "ukjent"}".\n\nRisikonivå: ${assessment?.risk_level}\nRisikosignaler: ${(assessment?.risk_signals || []).join(", ")}\nSvar: ${JSON.stringify(answeredData).slice(0, 4000)}\n\nSvar kun som punktopplistet tekst.`,
        });
        recommendationsText = typeof aiRes === "string" ? aiRes : JSON.stringify(aiRes);
      } catch (_) {
        recommendationsText = (assessment?.risk_signals || []).length
          ? `Foreslåtte fokusområder: ${assessment.risk_signals.join(", ")}`
          : "Foreslåtte tiltak vil bli vurdert manuelt.";
      }

      const priority =
        assessment?.risk_level === "high"
          ? "hoy"
          : assessment?.risk_level === "moderate"
          ? "normal"
          : "lav";

      const messageContent = `AI-forslag til tiltak for ${selectedDepartment || dept?.name || "avdeling"}:\n\n${recommendationsText}\n\nOpprettet: ${new Date().toLocaleString("nb-NO")}`;

      // Opprett ActionRecommendation per punkt slik at de vises under “Anbefalinger”
      const lines = recommendationsText
        .split(/\r?\n/)
        .map((l) => l.replace(/^[-•]\s*/, "").trim())
        .filter((l) => l.length > 0);

      const recPriority =
        assessment?.risk_level === "high" ? "hoy" : assessment?.risk_level === "moderate" ? "middels" : "lav";

      const weekStr = getISOWeekString(new Date());
      if (lines.length) {
        await base44.entities.ActionRecommendation.bulkCreate(
          lines.slice(0, 5).map((line) => ({
            organization_id: currentUser?.organization_id || "default",
            department_id: dept?.id || "unknown",
            department_name: selectedDepartment || dept?.name || "Ikke oppgitt",
            assessment_week: weekStr,
            source: "ai",
            category: "generell",
            title: line.length > 80 ? line.slice(0, 77) + "…" : line,
            description: line,
            priority: recPriority,
            status: "ny",
            owner_user_id: dept?.manager_user_id || currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            visibility: "manager_and_hr",
          }))
        );
      }

      // Opprett automatisk tilrettelegging for moderat/høy risiko
      if (["high", "moderate"].includes(String(assessment?.risk_level))) {
        const days = assessment?.risk_level === "high" ? 14 : 30;
        const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        const accPriority = assessment?.risk_level === "high" ? "hoy" : "normal";
        const desc = lines.length ? lines.slice(0, 3).map((l) => `• ${l}`).join("\n") : (assessment?.risk_signals || []).join(", ");
        await base44.entities.Accommodation.create({
          organization_id: currentUser?.organization_id || "default",
          employee_user_id: currentUser.id,
          employee_display_name: currentUser.full_name,
          department_id: dept?.id || "unknown",
          department_name: selectedDepartment || dept?.name || "Ikke oppgitt",
          accommodation_type: "AI-foreslått oppfølging",
          description: `Basert på kartlegging (${assessment?.risk_level}).\n${desc}`,
          status: "planlagt",
          priority: accPriority,
          responsible_user_id: dept?.manager_user_id || currentUser.id,
          responsible_display_name: dept?.manager_display_name || undefined,
          visibility: "manager_and_hr",
          risk_level: assessment?.risk_level === "high" ? "high" : "moderate",
          related_assessment_session_id: sessionId,
          due_date: due,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Opprett in-app melding synlig for leder og HR i avdelingen (broadcast)
      await base44.entities.Message.create({
        organization_id: currentUser?.organization_id || "default",
        thread_id: `assessment_${sessionId}`,
        type: "broadcast",
        category: "tilrettelegging",
        priority,
        subject: `AI-forslag til tiltak – ${selectedDepartment || dept?.name || ""}`,
        content: messageContent,
        sender_user_id: currentUser.id,
        sender_display_name: currentUser.full_name,
        recipient_department_id: dept?.id || undefined,
        visibility: "manager_and_hr",
        related_assessment_session_id: sessionId,
        sent_at: new Date().toISOString(),
      });

      console.log("✅ Varsel opprettet + tilrettelegging opprettet ved behov", {
        department: dept?.name,
        sessionId,
      });
    } catch (error) {
      console.error("Feil ved opprettelse av varsling:", error);
    }
  };

  /* ---------------------------
     AI: determine next step
  --------------------------- */
  const getNextQuestionAI = async () => {
    if (!currentUser) return;
    setIsAnalyzing(true);

    try {
      let result = null;
      try {
        result = await base44.integrations.Core.InvokeLLM({
          prompt: `Du er en ekspert på arbeidshelse. Gi en kort JSON-beslutning.
        - Hvis du trenger flere datapunkter, foreslå inntil 3 oppfølgingsspørsmål i new_questions.
        - Hvert spørsmål må ha text og answer_type (en av: text, scale, choice, multichoice, number).
        - For choice/multichoice gi answer_options, for scale gi scale {min,max,step,min_label,max_label}.
        - Ikke bruk markdown i tekster.`,
          response_json_schema: {
            type: "object",
            properties: {
              stop_assessment: { type: "boolean" },
              risk_level: { type: "string" },
              risk_signals: { type: "array", items: { type: "string" } },
              confidence: { type: "number" },
              next_question_id: { type: "string" },
              reason: { type: "string" },
              new_questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    answer_type: { type: "string", enum: ["text", "scale", "choice", "multichoice", "number"] },
                    answer_options: { type: "array", items: { type: "string" } },
                    scale: {
                      type: "object",
                      properties: {
                        min: { type: "number" },
                        max: { type: "number" },
                        step: { type: "number" },
                        min_label: { type: "string" },
                        max_label: { type: "string" }
                      }
                    }
                  },
                  required: ["text", "answer_type"]
                }
              }
            }
          }
        });
      } catch {
        console.warn("⚠️ AI disabled or failed, using fallback.");
      }

      if (!result || result.error) {
        result = {
          stop_assessment: true,
          risk_level: "moderate",
          risk_signals: ["Fullført uten AI"],
          confidence: 1.0,
        };
      }

      const aiQs = Array.isArray(result?.new_questions) ? result.new_questions : [];
      if (aiQs.length) {
        const normalized = aiQs.slice(0, 5).map((q, idx) => ({
          question_id: q.id || `AI${Date.now()}_${idx + 1}`,
          text: q.text || "Oppfølgingsspørsmål",
          answer_type: q.answer_type || "text",
          answer_options: q.answer_options || [],
          scale: q.scale,
          path: "generell",
          category: "tiltak",
          order: 1000 + idx,
        }));
        setDynamicQuestions((prev) => {
          const merged = [...prev, ...normalized].slice(0, 5);
          return merged;
        });
        setCurrentQuestionIndex((i) => Math.min(i + 1, relevantQuestions.length));
        setIsAnalyzing(false);
        return;
      } else if (result.stop_assessment) {
        const sessionId = await saveSession(result);
        await createInAppNotification(result, sessionId);
        setRiskAssessment(result);
        setCompleted(true);
        queryClient.invalidateQueries({ queryKey: ["assessment-sessions"] });
        return;
      }

      const nextId = result?.next_question_id;
      const idx = displayedQuestions.findIndex((q) => q.question_id === nextId);
      if (idx !== -1) setCurrentQuestionIndex(idx);
      else {
        const sessionId = await saveSession(result);
        await createInAppNotification(result, sessionId);
        setRiskAssessment(result);
        setCompleted(true);
        queryClient.invalidateQueries({ queryKey: ["assessment-sessions"] });
      }
    } catch (error) {
      console.error("AI error:", error);
      const fallback = {
        stop_assessment: true,
        risk_level: "moderate",
        risk_signals: ["AI-feil"],
        confidence: 0.8,
      };
      const sessionId = await saveSession(fallback);
      await createInAppNotification(fallback, sessionId);
      setRiskAssessment(fallback);
      setCompleted(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---------------------------
     Save session
  --------------------------- */
  const saveSession = async (assessment) => {
    if (!currentUser) return null;

    try {
      const week = getISOWeekString(new Date());
      const deptList = await base44.entities.Department.list();
      const dept = deptList.find((d) => d.name === selectedDepartment);

      const answeredQuestions = Object.keys(answers)
        .filter((qid) => answers[qid] != null)
        .map((qid) => ({
          question_id: qid,
          answer: Array.isArray(answers[qid])
            ? answers[qid].join(", ")
            : String(answers[qid]),
          timestamp: new Date().toISOString(),
        }));

      const session = await base44.entities.AssessmentSession.create({
        organization_id: currentUser?.organization_id || "default",
        department_id: dept?.id || "unknown",
        department_name: selectedDepartment || "Ikke oppgitt",
        respondent_user_id: currentUser?.id,
        respondent_display_name: currentUser?.full_name || currentUser?.email,
        anonymous_id: `session_${Date.now()}`,
        path: sessionPath,
        answered_questions: answeredQuestions,
        generated_questions: dynamicQuestions,
        risk_signals: assessment?.risk_signals || [],
        risk_level: assessment?.risk_level || "unknown",
        confidence: assessment?.confidence || 0,
        status: "completed",
        session_week: week,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      // Opprett også en HealthAssessment for dashboard/statistikk
      const score = assessment?.risk_level === "high" ? 2 : assessment?.risk_level === "low" ? 4 : 3;
      await base44.entities.HealthAssessment.create({
        organization_id: currentUser?.organization_id || "default",
        department_id: dept?.id || "unknown",
        department_name: selectedDepartment || "Ikke oppgitt",
        assessment_week: week,
        status: "submitted",
        created_date: new Date().toISOString(),
        physical_load: score,
        mental_wellbeing: score,
        work_environment: score,
        recovery: score,
        stress_level: score,
        adaptive_responses: [],
        risk_indicators: assessment?.risk_signals || [],
      });

      return session.id;
    } catch (error) {
      console.error("Feil ved lagring av sesjon:", error);
      throw error;
    }
  };

  /* ---------------------------
     Navigation
  --------------------------- */
  const handleNext = async () => {
    if (!canGoNext || isAnalyzing) return;
    const isLast = currentQuestionIndex >= displayedQuestions.length - 1;
    if (isLast) {
      await getNextQuestionAI();
    } else {
      setCurrentQuestionIndex((i) => Math.min(i + 1, relevantQuestions.length - 1));
    }
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
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-10"
        >
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Kartlegging fullført
            </h2>
            <p className="text-slate-500 mb-6">
              Takk! Svarene dine hjelper med å forbedre arbeidsmiljø og
              tilrettelegging.
            </p>
          </div>

          <Card className="rounded-3xl border-slate-200">
            <CardHeader>
              <CardTitle>Oppsummering</CardTitle>
              <CardDescription>
                Svarene dine er sendt til HR og leder for eventuell oppfølging.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Takk for at du fullførte helsekartleggingen. Du trenger ikke gjøre noe mer.
              </p>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Adaptiv helsekartlegging
        </h1>
        <p className="text-slate-500 mt-2">
          AI-styrt kartlegging som tilpasses svarene dine – for bedre oppfølging
          og forebygging.
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
            Ærlige svar hjelper med å identifisere forbedringsområder og
            tilrettelegging.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>
            Spørsmål {currentQuestionIndex + 1} av {displayedQuestions.length}
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

              {currentQuestionIndex === displayedQuestions.length - 1 && (
                <DocumentUpload
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                />
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
              <p className="text-sm font-semibold text-blue-900">
                AI vurderer neste steg…
              </p>
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