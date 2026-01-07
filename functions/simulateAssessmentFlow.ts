import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function isoWeekString(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validate auth if available (test harness can still proceed using service role)
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      // continue as service role for automation test
    }

    const orgId = (user && (user.organization_id || 'default')) || 'default';

    // 1) Ensure there's at least one Department (create a test one if none)
    const departments = await base44.asServiceRole.entities.Department.list();
    let dept = departments.find((d) => d.organization_id === orgId) || departments[0];
    if (!dept) {
      dept = await base44.asServiceRole.entities.Department.create({
        organization_id: orgId,
        name: 'Test Avdeling',
        employee_count: 1,
        is_active: true,
        sector: 'administrasjon',
      });
    }

    // 2) Ensure QuestionBank not empty; if empty, seed minimal set (Q1..Q6 including Q4 and Q6 used by UI)
    const questions = await base44.asServiceRole.entities.QuestionBank.list('order');
    let seeded = false;
    if (!questions || questions.length === 0) {
      seeded = true;
      const seed = [
        {
          question_id: 'Q1',
          version: '1.0',
          is_active: true,
          text: 'Hvordan har den fysiske belastningen vært siste uke?',
          path: 'generell',
          category: 'kontekst',
          answer_type: 'scale',
          scale: { min: 1, max: 5, step: 1, min_label: 'Lav', max_label: 'Høy' },
          order: 1,
        },
        {
          question_id: 'Q2',
          version: '1.0',
          is_active: true,
          text: 'Hvordan opplever du arbeidsmiljøet?',
          path: 'generell',
          category: 'kontekst',
          answer_type: 'scale',
          scale: { min: 1, max: 5, step: 1, min_label: 'Dårlig', max_label: 'Godt' },
          order: 2,
        },
        {
          question_id: 'Q3',
          version: '1.0',
          is_active: true,
          text: 'Hvordan er stressnivået ditt?',
          path: 'generell',
          category: 'risiko',
          answer_type: 'scale',
          scale: { min: 1, max: 5, step: 1, min_label: 'Lavt', max_label: 'Høyt' },
          order: 3,
        },
        {
          question_id: 'Q4',
          version: '1.0',
          is_active: true,
          text: 'Hvilken avdeling tilhører du?',
          path: 'generell',
          category: 'kontekst',
          answer_type: 'choice',
          answer_options: [dept.name],
          order: 4,
        },
        {
          question_id: 'Q5',
          version: '1.0',
          is_active: true,
          text: 'Er det noe spesielt vi bør vite om arbeidssituasjonen?',
          path: 'generell',
          category: 'kontekst',
          answer_type: 'text',
          order: 5,
        },
        {
          question_id: 'Q6',
          version: '1.0',
          is_active: true,
          text: 'Hva beskriver best årsaken til eventuelle plager?',
          path: 'generell',
          category: 'årsak',
          answer_type: 'choice',
          answer_options: ['Muskel- og skjelettplager', 'Fysisk sykdom', 'Psykisk helse', 'Andre årsaker'],
          order: 6,
        },
      ];
      await base44.asServiceRole.entities.QuestionBank.bulkCreate(seed);
    }

    // 3) Simulate answering: choose dept (Q4) and path (Q6)
    const nowIso = new Date().toISOString();
    const weekStr = isoWeekString(new Date());

    const answered_questions = [
      { question_id: 'Q1', answer: '3', timestamp: nowIso },
      { question_id: 'Q2', answer: '4', timestamp: nowIso },
      { question_id: 'Q3', answer: '3', timestamp: nowIso },
      { question_id: 'Q4', answer: dept.name, timestamp: nowIso },
      { question_id: 'Q6', answer: 'Psykisk helse', timestamp: nowIso },
    ];

    // Risk result similar to UI fallback when AI off
    const assessmentResult = {
      risk_level: 'moderate',
      risk_signals: ['Simulert test'],
      confidence: 0.9,
    };

    // 4) Create AssessmentSession
    const session = await base44.asServiceRole.entities.AssessmentSession.create({
      organization_id: orgId,
      department_id: dept.id,
      department_name: dept.name,
      respondent_user_id: user?.id || null,
      respondent_display_name: user?.full_name || 'AutoTest Bot',
      anonymous_id: `autotest_${Date.now()}`,
      path: 'psykisk',
      status: 'completed',
      progress: 100,
      answered_questions,
      generated_questions: [],
      risk_signals: assessmentResult.risk_signals,
      risk_level: assessmentResult.risk_level,
      confidence: assessmentResult.confidence,
      session_week: weekStr,
      created_at: nowIso,
      submitted_at: nowIso,
      completed_at: nowIso,
    });

    // 5) Create HealthAssessment snapshot used by dashboard
    const score = assessmentResult.risk_level === 'high' ? 2 : assessmentResult.risk_level === 'low' ? 4 : 3;
    const health = await base44.asServiceRole.entities.HealthAssessment.create({
      organization_id: orgId,
      department_id: dept.id,
      department_name: dept.name,
      assessment_week: weekStr,
      status: 'submitted',
      created_date: nowIso,
      physical_load: score,
      mental_wellbeing: score,
      work_environment: score,
      recovery: score,
      stress_level: score,
      adaptive_responses: [],
      risk_indicators: assessmentResult.risk_signals,
    });

    // 6) Optional: quick sanity LLM ping (does not block)
    let llmOk = null;
    try {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'Svar med ett ord: OK',
      });
      llmOk = typeof res === 'string' ? res : JSON.stringify(res).slice(0, 64);
    } catch (e) {
      llmOk = 'failed';
    }

    return Response.json({
      ok: true,
      seededQuestions: seeded,
      department: { id: dept.id, name: dept.name },
      created_session_id: session.id,
      created_health_assessment_id: health.id,
      llm_status: llmOk,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});