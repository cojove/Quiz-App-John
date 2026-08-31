// Quiz capacity checks based on material, settings, and question-type limits.

const NUMERIC_QUESTIONS_PER_QUIZ = 20;
const ALPHA_QUESTIONS_PER_QUIZ = 10;

/** Returns total questions required for one quiz (20 or 30 with A&B). */
function getQuestionsPerQuiz(quizSettings) {
  return quizSettings.includeAB
    ? NUMERIC_QUESTIONS_PER_QUIZ + ALPHA_QUESTIONS_PER_QUIZ
    : NUMERIC_QUESTIONS_PER_QUIZ;
}

/** Max questions when duplicate verses are disallowed (one question per verse). */
function countMaxFillableQuestions(groupQuestions, quizSettings) {
  if (quizSettings.allowDuplicateVerses) {
    return groupQuestions.length;
  }
  return new Set(groupQuestions.map((q) => q.ref)).size;
}

/** Max questions when Strict Mode type Min/Max limits must be honored. */
function computeMaxFeasibleQuizSize(groupQuestions, quizSettings) {
  const maxes = {};
  for (const t of quizSettings.quesTypes) {
    maxes[t.type] = t.max;
  }

  if (quizSettings.allowDuplicateVerses) {
    const sumMax = Object.values(maxes).reduce((sum, n) => sum + n, 0);
    return Math.min(groupQuestions.length, sumMax);
  }

  const byRef = new Map();
  for (const q of groupQuestions) {
    if (!byRef.has(q.ref)) byRef.set(q.ref, new Set());
    byRef.get(q.ref).add(q.type);
  }

  const refs = [...byRef.keys()];
  refs.sort((a, b) => byRef.get(a).size - byRef.get(b).size);

  const counts = {};
  for (const type of Object.keys(maxes)) counts[type] = 0;

  let used = 0;
  for (const ref of refs) {
    const types = [...byRef.get(ref)].filter((t) => counts[t] < maxes[t]);
    if (types.length === 0) continue;
    types.sort((a, b) => maxes[b] - counts[b] - (maxes[a] - counts[a]));
    counts[types[0]]++;
    used++;
  }

  return used;
}

/** Returns the applicable fill capacity for the current Strict Mode setting. */
function getMaxFillableForSettings(groupQuestions, quizSettings) {
  if (quizSettings.strictMode) {
    return computeMaxFeasibleQuizSize(groupQuestions, quizSettings);
  }
  return countMaxFillableQuestions(groupQuestions, quizSettings);
}

/** Validates pool size before generation begins. Returns an error detail or null. */
function validateQuizCapacity(groupQuestions, quizSettings) {
  const required = getQuestionsPerQuiz(quizSettings);
  const maxFillable = getMaxFillableForSettings(groupQuestions, quizSettings);

  if (maxFillable >= required) {
    return null;
  }

  const reason = quizSettings.strictMode
    ? QuizErrorReason.STRICT_CAPACITY
    : QuizErrorReason.LENIENT_CAPACITY;

  return {
    reason,
    context: {
      maxFillable,
      required,
      totalQuestions: groupQuestions.length,
      uniqueVerses: countMaxFillableQuestions(groupQuestions, quizSettings),
      allowDuplicateVerses: quizSettings.allowDuplicateVerses,
      includeAB: quizSettings.includeAB,
      strictMode: quizSettings.strictMode,
    },
  };
}
