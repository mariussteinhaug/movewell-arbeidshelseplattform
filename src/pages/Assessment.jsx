import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Shield, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionRenderer from '../components/assessment/QuestionRenderer';
import QuestionFeedback from '../components/assessment/QuestionFeedback';
import DocumentUpload from '../components/assessment/DocumentUpload';

export default function Assessment() {
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionPath, setSessionPath] = useState('not_set');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

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

  const currentQuestion = relevantQuestions[currentQuestionIndex];

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentQuestion.question_id]: answer };
    setAnswers(newAnswers);

    // Vis feedback når brukeren svarer
    setShowFeedback(true);

    if (currentQuestion.question_id === 'Q4') {
      setSelectedDepartment(answer);
    }

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

KRITISKE RISIKOFAKTORER - VURDER SPESIFIKT:
1. SMERTELOKALISERING (Q13): 
   - Nakke/skuldre = høy risiko for langvarig plager, krever ergonomi-vurdering
   - Nedre rygg = høy risiko, vanlig ved manuelt arbeid og stillesittende arbeid
   - Multiple områder = betydelig høyere risiko, krever omfattende tiltak
   
2. SMERTEINTENSITET (Q14):
   - 7-10 = høy risiko, krever umiddelbar oppfølging og mulig sykmelding
   - 4-6 = moderat risiko, krever tilrettelegging og oppfølging
   - 0-3 = lav risiko, forebyggende tiltak

3. KOMBINERTE FAKTORER:
   - Høy smerte (7+) + multiple lokalisasjoner = kritisk risiko
   - Langvarig varighet (>3 mnd) + høy intensitet = kronisk tilstand, kompleks håndtering
   - Manglende støtte + moderate/høye smerter = økt risiko for langtidssykmelding

DYNAMISK SPØRSMÅLSFLYT:
- Hvis brukeren har rapportert smerter eller høy belastning, prioriter oppfølgingsspørsmål om lokalisering, intensitet og varighet.
- Hvis brukeren har svart "Ja" på støtte (Q10), still oppfølgingsspørsmål om type støtte.
- Tilpass spørsmål basert på alvorlighetsgrad i tidligere svar.

Basert på svarene hittil:
1. Er det nok informasjon til å gjøre en risikovurdering? 
2. Hvis ja, gi risikonivå (low/moderate/high) og begrunnelse som EKSPLISITT refererer til smertelokalisering og intensitet hvis relevant
3. Hvis nei, hvilket spørsmål bør stilles neste? Velg question_id som er mest relevant basert på tidligere svar.

Returner JSON med:
{
  "stop_assessment": true/false,
  "risk_level": "low/moderate/high" (kun hvis stop),
  "risk_signals": ["signal1", "signal2"] (kun hvis stop - vær SPESIFIKK om smertelokalisering og intensitet),
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
        await saveSession(result);
        setRiskAssessment(result);
        setCompleted(true);
        queryClient.invalidateQueries({ queryKey: ['assessment-sessions'] });
      } else {
        const nextIndex = relevantQuestions.findIndex(
          q => q.question_id === result.next_question_id
        );
        if (nextIndex !== -1 && nextIndex > currentQuestionIndex) {
          setCurrentQuestionIndex(nextIndex);
        } else {
          // Hvis AI ikke finner neste spørsmål eller vi er på siste, avslutt
          await saveSession(result);
          setRiskAssessment(result);
          setCompleted(true);
          queryClient.invalidateQueries({ queryKey: ['assessment-sessions'] });
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('Det oppstod en feil ved analysen. Prøv igjen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveSession = async (assessment) => {
    try {
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
        department: selectedDepartment || 'Ikke oppgitt',
        path: sessionPath,
        answered_questions: answeredQuestions,
        risk_signals: assessment.risk_signals || [],
        risk_level: assessment.risk_level || 'unknown',
        confidence: assessment.confidence || 0,
        completed: true,
        session_week: week,
        uploaded_documents: uploadedFiles.map(f => f.url)
      });

      // Send e-post til leder og HR med AI-forslag
      await sendManagerNotification(assessment, answeredQuestions);
    } catch (error) {
      console.error('Feil ved lagring av sesjon:', error);
      throw error;
    }
  };

  const sendManagerNotification = async (assessment, answeredQuestions) => {
    try {
      // Hent nåværende bruker
      const currentUser = await base44.auth.me();
      
      // Hent avdelingsinformasjon
      const deptList = await base44.entities.Department.list();
      const dept = deptList.find(d => d.name === selectedDepartment);

      // Generer AI-forslag for tiltak
      const answeredData = answeredQuestions.map(aq => {
        const q = allQuestions.find(question => question.question_id === aq.question_id);
        return `Spørsmål: ${q?.text}\nSvar: ${aq.answer}`;
      }).join('\n\n');

      // Ekstraher smertedata for mer spesifikke anbefalinger
      const painLocation = answeredQuestions.find(q => q.question_id === 'Q13')?.answer;
      const painIntensity = answeredQuestions.find(q => q.question_id === 'Q14')?.answer;
      const painFrequency = answeredQuestions.find(q => q.question_id === 'Q15')?.answer;

      const aiPrompt = `Du er en ekspert på arbeidshelse, ergonomi og tilrettelegging. 

En ansatt har fullført en helsekartlegging med følgende informasjon:

ANSATT INFORMASJON:
- Navn: ${currentUser.full_name} (${currentUser.email})
- Avdeling: ${selectedDepartment}
- Risikonivå: ${assessment.risk_level}
- Risikosignaler: ${assessment.risk_signals?.join(', ')}

DETALJERT SMERTEANALYSE:
${painLocation ? `- Smertelokalisering: ${Array.isArray(painLocation) ? painLocation.join(', ') : painLocation}` : ''}
${painIntensity ? `- Smerteintensitet: ${painIntensity}/10` : ''}
${painFrequency ? `- Frekvens: ${painFrequency}` : ''}

Svar fra fullstendig kartlegging:
${answeredData}

Basert på denne informasjonen, gi KONKRETE og MÅLRETTEDE anbefalinger til leder og HR:

1. UMIDDELBARE TILTAK (0-2 uker):
   ${painLocation ? `- Spesifikke tiltak for ${Array.isArray(painLocation) ? painLocation.join(' og ') : painLocation}-plager` : '- Generelle førstetiltak'}
   ${painIntensity && parseInt(painIntensity) >= 7 ? '- KRITISK: Høy smerte krever rask handling' : ''}
   - Konkrete arbeidsplassendringer
   - Nødvendige verktøy/hjelpemidler

2. TILPASNINGER OG TILRETTELEGGING:
   ${painLocation ? `- Ergonomiske tilpasninger spesifikt for ${Array.isArray(painLocation) ? painLocation.join('/') : painLocation}` : '- Generelle ergonomiske tilpasninger'}
   - Arbeidstidsordninger
   - Arbeidsoppgaver som bør justeres/unngås
   - Fysiske tilpasninger på arbeidsplassen

3. OPPFØLGINGSPLAN:
   - Konkret tidsplan for oppfølgingsmøter
   - Målbare milepæler
   - Ansvarsfordeling (leder, HR, tillitsvalgt, verneombud)

4. EKSTERNE RESSURSER:
   ${painLocation && painIntensity ? '- SPESIFIKKE fagpersoner basert på smertelokalisering og intensitet:' : '- Relevante fagpersoner:'}
   - Fysioterapeut/manuellterapeut (når og hvorfor)
   - Ergoterapeut/ergonomirådgiver (spesifikke områder)
   - Bedriftshelsetjeneste (hvilke tjenester)
   - Eventuelt psykolog/coach hvis relevant
   
5. FOREBYGGENDE TILTAK FOR AVDELINGEN:
   - Læringspunkter fra denne saken
   - Tiltak for å unngå lignende situasjoner

Vær KONKRET, KONSTRUKTIV og EMPATISK. Unngå generelle råd - gi spesifikke handlingspunkter basert på smertelokalisering og intensitet.`;

      const aiRecommendations = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt
      });

      // Hent admin-brukere (HR/Ledere)
      const users = await base44.entities.User.list();
      const adminUsers = users.filter(u => u.role === 'admin');

      // Send e-post til hver admin
      for (const admin of adminUsers) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `Ny helsekartlegging fra ${currentUser.full_name} - ${selectedDepartment}`,
          body: `
Hei,

En ansatt har fullført en helsekartlegging som krever oppfølging:

ANSATT INFORMASJON:
- Navn: ${currentUser.full_name}
- E-post: ${currentUser.email}
- Avdeling: ${selectedDepartment}

RESULTAT:
- Risikonivå: ${assessment.risk_level === 'low' ? 'Lav' : assessment.risk_level === 'moderate' ? 'Moderat' : 'Høy'}
- Identifiserte risikosignaler: ${assessment.risk_signals?.join(', ') || 'Ingen spesifikke'}
- Begrunnelse: ${assessment.reason}

AI-ANBEFALINGER:
${aiRecommendations}

---
Denne e-posten er generert automatisk fra MoveWell helsekartlegging.
Vennligst følg opp med den ansatte innen 2 virkedager.
          `
        });
      }

      // Send også til avdelingsleder hvis oppgitt
      if (dept?.manager_name && dept?.manager_email) {
        await base44.integrations.Core.SendEmail({
          to: dept.manager_email,
          subject: `Ny helsekartlegging i din avdeling - ${selectedDepartment}`,
          body: `
Hei ${dept.manager_name},

En ansatt i din avdeling har fullført en helsekartlegging:

ANSATT: ${currentUser.full_name}
RISIKONIVÅ: ${assessment.risk_level === 'low' ? 'Lav' : assessment.risk_level === 'moderate' ? 'Moderat' : 'Høy'}

AI-ANBEFALINGER:
${aiRecommendations}

Ta kontakt med den ansatte for oppfølging.
          `
        });
      }
    } catch (error) {
      console.error('Feil ved sending av varsel:', error);
    }
  };

  const handleNext = async () => {
    // Alle spørsmål er nå påkrevd
    if (!answers[currentQuestion.question_id]) {
      return;
    }

    setShowFeedback(false);

    const answeredCount = Object.keys(answers).length;
    const isLastQuestion = currentQuestionIndex === relevantQuestions.length - 1;

    // Hvis siste spørsmål, ALLTID kjør AI-analyse
    if (isLastQuestion) {
      await getNextQuestion();
    } else if (answeredCount >= 6 && sessionPath !== 'not_set') {
      // Eller hvis nok svar, kjør AI-analyse
      await getNextQuestion();
    } else {
      // Gå til neste spørsmål
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
          <p className="text-slate-500 mb-4">Takk for din deltakelse. Dine svar vil bidra til å forbedre arbeidsmiljøet og tilrettelegge bedre for din helse.</p>
          
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
              setSelectedDepartment(null);
              setUploadedFiles([]);
              setShowFeedback(false);
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
          AI-styrt kartlegging som tilpasses dine svar - hjelper både deg og bedriften
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-8">
        <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-800">
            {selectedDepartment ? `Kartlegging for ${selectedDepartment}` : 'Helsekartlegging'}
          </p>
          <p className="text-sm text-emerald-700 mt-0.5">
            Dine ærlige svar hjelper bedriften med å identifisere forbedringsområder og tilrettelegge bedre for ditt arbeidsmiljø og helse.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Spørsmål {currentQuestionIndex + 1} av ~{relevantQuestions.length}</span>
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {currentQuestion?.text}
                  </CardTitle>
                  <CardDescription>
                    {currentQuestion?.category && `Kategori: ${currentQuestion.category}`}
                  </CardDescription>
                </div>
                <QuestionFeedback 
                  show={showFeedback} 
                  onComplete={() => setShowFeedback(false)} 
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion && currentQuestion.question_id === 'Q4' ? (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleAnswer(dept.name)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        answers['Q4'] === dept.name
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:bg-slate-50 hover:border-emerald-300'
                      }`}
                    >
                      <p className="font-medium text-slate-900">{dept.name}</p>
                      {dept.sector && (
                        <p className="text-sm text-slate-500 mt-1">
                          {dept.sector.replace(/_/g, ' ')}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : currentQuestion && (
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.question_id]}
                  onAnswer={handleAnswer}
                />
              )}

              {/* Document upload - vis på siste spørsmål */}
              {currentQuestionIndex === relevantQuestions.length - 1 && (
                <DocumentUpload
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
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
                  disabled={!answers[currentQuestion?.question_id] || isAnalyzing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI analyserer...
                    </>
                  ) : (
                    <>
                      Neste
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