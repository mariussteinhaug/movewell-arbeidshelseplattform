import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Shield, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionRenderer from '../components/assessment/QuestionRenderer';

export default function Assessment() {
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionPath, setSessionPath] = useState('not_set');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(null);

  const { data: allQuestions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const questions = await base44.entities.QuestionBank.list('order');
      return questions;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const currentQuestion = allQuestions[currentQuestionIndex];
  
  // Filter questions based on path
  const relevantQuestions = React.useMemo(() => {
    if (!allQuestions.length) return [];
    
    const generalQuestions = allQuestions.filter(q => 
      q.path === 'generell' && q.order <= 12
    );
    
    if (sessionPath && sessionPath !== 'not_set') {
      const pathQuestions = allQuestions.filter(q => q.path === sessionPath);
      return [...generalQuestions, ...pathQuestions].sort((a, b) => a.order - b.order);
    }
    
    return generalQuestions;
  }, [allQuestions, sessionPath]);

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentQuestion.question_id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion.question_id === 'Q6') {
      const pathMap = {
        'Muskel- og skjelettplager': 'muskel',
        'Fysisk sykdom': 'fysisk',
        'Psykisk helse': 'psykisk',
        'Andre årsaker': 'annet'
      };
      setSessionPath(pathMap[answer] || 'generell');
    }
  };

  // AI: Decide next question
  const getNextQuestion = async () => {
    setIsAnalyzing(true);
    
    const answeredQuestionIds = Object.keys(answers);
    const answeredData = answeredQuestionIds.map(qid => {
      const q = allQuestions.find(question => question.question_id === qid);
      return { question: q?.text, answer: answers[qid] };
    });

    const prompt = `Du er en ekspert på arbeidshelse og sykefraværsanalyse. 

Kontekst:
- Path valgt: ${sessionPath}
- Besvarte spørsmål: ${answeredQuestionIds.length}

Hittil besvarte spørsmål og svar:
${answeredData.map(d => `Q: ${d.question}\nA: ${d.answer}`).join('\n\n')}

Tilgjengelige ubesvarte spørsmål:
${relevantQuestions
  .filter(q => !answeredQuestionIds.includes(q.question_id))
  .map(q => `${q.question_id}: ${q.text} (kategori: ${q.category}, vekt: ${q.severity_weight})`)
  .join('\n')}

Basert på svarene hittil:
1. Er det nok informasjon til å gjøre en risikovurdering? 
2. Hvis ja, gi risikonivå (low/moderate/high) og begrunnelse
3. Hvis nei, hvilket spørsmål bør stilles neste? Velg question_id.

Returner JSON med:
{
  "stop_assessment": true/false,
  "risk_level": "low/moderate/high" (kun hvis stop),
  "risk_signals": ["signal1", "signal2"] (kun hvis stop),
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
            reason: { type: "string" }
          }
        }
      });

      if (result.stop_assessment) {
        setRiskAssessment(result);
        await saveSession(result);
        setCompleted(true);
      } else {
        const nextIndex = relevantQuestions.findIndex(
          q => q.question_id === result.next_question_id
        );
        if (nextIndex !== -1) {
          setCurrentQuestionIndex(nextIndex);
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveSession = async (assessment) => {
    const now = new Date();
    const week = `${now.getFullYear()}-${String(Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))).padStart(2, '0')}`;
    
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const answeredQuestions = Object.keys(answers).map(qid => ({
      question_id: qid,
      answer: answers[qid],
      timestamp: new Date().toISOString()
    }));

    await base44.entities.AssessmentSession.create({
      anonymous_id: anonymousId,
      department: answers['Q4'] || 'Ikke oppgitt',
      path: sessionPath,
      answered_questions: answeredQuestions,
      risk_signals: assessment.risk_signals || [],
      risk_level: assessment.risk_level || 'unknown',
      confidence: assessment.confidence || 0,
      completed: true,
      session_week: week
    });
  };

  const handleNext = async () => {
    // Sjekk om spørsmålet er påkrevd
    if (currentQuestion.required_for_minimum && !answers[currentQuestion.question_id]) {
      return;
    }

    const answeredCount = Object.keys(answers).length;
    
    if (answeredCount >= 6 && sessionPath !== 'not_set') {
      await getNextQuestion();
    } else {
      if (currentQuestionIndex < relevantQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const progress = (Object.keys(answers).length / Math.max(relevantQuestions.length, 1)) * 100;

  if (!allQuestions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Kartlegging fullført</h2>
          <p className="text-slate-500 mb-4">Takk for din deltakelse. Din kartlegging er fullstendig anonymisert.</p>
          
          {riskAssessment && (
            <div className="bg-slate-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-slate-900 mb-2">Oppsummering</h3>
              <p className="text-sm text-slate-600 mb-3">{riskAssessment.reason}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Risikonivå:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  riskAssessment.risk_level === 'low' ? 'bg-emerald-100 text-emerald-700' :
                  riskAssessment.risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {riskAssessment.risk_level === 'low' ? 'Lav' :
                   riskAssessment.risk_level === 'moderate' ? 'Moderat' : 'Høy'}
                </span>
              </div>
            </div>
          )}

          <Button 
            onClick={() => {
              setCompleted(false);
              setCurrentQuestionIndex(0);
              setAnswers({});
              setSessionPath('not_set');
              setRiskAssessment(null);
            }}
            variant="outline"
          >
            Start ny kartlegging
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Adaptiv helsekartlegging</h1>
        <p className="text-slate-500 mt-2">
          AI-styrt kartlegging som tilpasses dine svar - fullstendig anonym
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-8">
        <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-800">100% Anonym</p>
          <p className="text-sm text-emerald-700 mt-0.5">
            Dine svar kan ikke spores tilbake til deg. Data aggregeres kun på avdelingsnivå.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Spørsmål {Object.keys(answers).length} av ~{relevantQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion?.question_id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentQuestion?.text}
              </CardTitle>
              <CardDescription>
                {currentQuestion?.category && `Kategori: ${currentQuestion.category}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion && (
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.question_id]}
                  onAnswer={handleAnswer}
                />
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0 || isAnalyzing}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Forrige
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={(currentQuestion?.required_for_minimum && !answers[currentQuestion?.question_id]) || isAnalyzing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI analyserer...
                    </>
                  ) : (
                    <>
                      {currentQuestion?.required_for_minimum ? 'Neste' : 'Hopp over'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {isAnalyzing && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">AI vurderer neste spørsmål...</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Basert på dine svar velger AI det mest relevante oppfølgingsspørsmålet
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}