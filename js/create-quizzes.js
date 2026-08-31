/*
Quiz creation orchestration.

See quiz-log.js, quiz-capacity.js, and quiz-selection.js for supporting logic.
Data structures are documented in the original create-quizzes.js header and
throughout the question object properties used by JohnData.json.
*/

/** Filters the master question list to the selected material and question types. */
function filterQuestions(groupQuestions, quizSettings) {
  const selectedTypeClubCombos = quizSettings.quesTypes.flatMap(
    (quesType) => quesType.typeClubCombos,
  );

  return groupQuestions.filter(
    (ques) =>
      quesInMaterial(ques, quizSettings.material) &&
      selectedTypeClubCombos.includes(ques.typeClub),
  );
}

/** Builds one quiz from the shared group question pool. */
function createQuiz(groupQuestions, quizSettings, quizNum) {
  const alphaTarget = quizSettings.includeAB ? ALPHA_QUESTIONS_PER_QUIZ : 0;

  const quiz = {
    title: `#${quizNum}: ${quizSettings.quizTitle}`,
    questions: [],
    alphaQuestions: [],
  };

  const quizQuestions = JSON.parse(JSON.stringify(groupQuestions));
  quizSettings = JSON.parse(JSON.stringify(quizSettings));

  if (quizSettings.strictMode) {
    const refError = addRequiredRefQuestions(
      quiz,
      quizQuestions,
      quizSettings,
      groupQuestions,
      quizNum,
    );
    if (refError) return refError;

    const minError = fillTypeMinimums(
      quiz,
      quizQuestions,
      quizSettings,
      groupQuestions,
      quizNum,
    );
    if (minError) return minError;
  }

  if (
    fillQuizSlots(
      NUMERIC_QUESTIONS_PER_QUIZ,
      quiz.questions,
      quizQuestions,
      quizSettings,
      groupQuestions,
      "numeric",
      quizNum,
    ) == "Error"
  ) {
    return "Error";
  }

  if (alphaTarget > 0) {
    if (
      fillQuizSlots(
        alphaTarget,
        quiz.alphaQuestions,
        quizQuestions,
        quizSettings,
        groupQuestions,
        "A&B",
        quizNum,
      ) == "Error"
    ) {
      return "Error";
    }
  }

  shuffle(quiz.questions);
  return quiz;
}

/** Creates the requested number of quizzes from all available questions. */
function createQuizzes(allQuestions, quizSettings) {
  resetQuizError();

  let groupQuestions = JSON.parse(JSON.stringify(allQuestions));
  groupQuestions = filterQuestions(groupQuestions, quizSettings);

  logQuizInfo("Starting quiz creation", {
    totalQuestionsInData: allQuestions.length,
    filteredQuestions: groupQuestions.length,
    numQuizzes: quizSettings.numQuizzes,
    materialSections: quizSettings.material.length,
    questionTypes: quizSettings.quesTypes.map((t) => ({
      type: t.type,
      min: t.min,
      max: t.max,
      club: t.club,
    })),
    resetUsedQues: quizSettings.resetUsedQues,
    allowDuplicateVerses: quizSettings.allowDuplicateVerses,
    maxWs: quizSettings.maxWs,
    includeAB: quizSettings.includeAB,
    strictMode: quizSettings.strictMode,
  });

  if (groupQuestions.length === 0) {
    setQuizError(QuizErrorReason.NO_MATCHING_QUESTIONS, {
      materialSections: quizSettings.material.length,
      selectedTypes: quizSettings.quesTypes.map((t) => t.type),
    });
    return { err: "Error", quizzes: [], errDetail: getLastQuizError() };
  }

  const capacityError = validateQuizCapacity(groupQuestions, quizSettings);
  if (capacityError) {
    setQuizError(capacityError.reason, capacityError.context);
    return { err: "Error", quizzes: [], errDetail: getLastQuizError() };
  }

  const quizzes = [];
  let quizNum = 1;

  while (quizzes.length < quizSettings.numQuizzes) {
    logQuizInfo(
      `Creating quiz #${quizNum} (${quizzes.length}/${quizSettings.numQuizzes} complete, ${groupQuestions.length} questions in pool)`,
    );

    const quiz = createQuiz(groupQuestions, quizSettings, quizNum);
    if (quiz == "Error") {
      return { err: "Error", quizzes, errDetail: getLastQuizError() };
    }

    quizzes.push(quiz);
    quizNum++;
  }

  return { err: "", quizzes };
}
