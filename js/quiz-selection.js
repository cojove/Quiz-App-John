// Question pool management and selection during quiz creation.

/** Returns true when a question may be selected under current limits. */
function isQuestionSelectable(ques, quizSettings, typeFilter, options = {}) {
  const respectWLimit = options.respectWLimit ?? true;
  const respectTypeMax =
    options.respectTypeMax ?? quizSettings.strictMode;

  const quesType = quizSettings.quesTypes.find((t) => t.type === ques.type);
  if (!quesType || !typeFilter(quesType)) return false;
  if (
    respectWLimit &&
    ques.w === "W" &&
    quizSettings.wCount >= quizSettings.maxWs
  ) {
    return false;
  }
  if (respectTypeMax && quesType.count >= quesType.max) return false;
  return true;
}

/** Returns question types that still have selectable questions in the pool. */
function getTypesWithQuestions(quesTypes, quizQuestions, quizSettings) {
  return quesTypes.filter((t) =>
    quizQuestions.some(
      (q) =>
        q.type === t.type &&
        isQuestionSelectable(q, quizSettings, () => true),
    ),
  );
}

/** Applies side effects after a question is added to a quiz. */
function processFoundQues(
  selectedQues,
  section,
  quizQuestions,
  quizSettings,
  groupQuestions,
) {
  quizQuestions.splice(quesIndexByID(quizQuestions, selectedQues.id), 1);

  if (!quizSettings.resetUsedQues) {
    const groupQuesIndex = quesIndexByID(groupQuestions, selectedQues.id);
    groupQuestions[groupQuesIndex].count++;
    if (groupQuestions[groupQuesIndex].count >= quizSettings.maxQuesUse) {
      groupQuestions.splice(groupQuesIndex, 1);
    }
  }

  if (!quizSettings.allowDuplicateVerses) {
    for (let i = quizQuestions.length - 1; i >= 0; i--) {
      if (quizQuestions[i].ref == selectedQues.ref) {
        quizQuestions.splice(i, 1);
      }
    }
  }

  if (selectedQues.w == "W") {
    quizSettings.wCount++;
  }

  const quesTypeIndex = quesTypeIndexByType(
    selectedQues.type,
    quizSettings.quesTypes,
  );
  const quesType = quizSettings.quesTypes[quesTypeIndex];
  quesType.count++;
  if (quizSettings.strictMode && quesType.count >= quesType.max) {
    quizSettings.quesTypes.splice(quesTypeIndex, 1);
  }

  section.count++;
}

/** Picks one question from an unused verse, honoring the supplied type filter. */
function pickFromVerses(
  quizQuestions,
  quizSettings,
  groupQuestions,
  typeFilter,
  selectOptions = {},
) {
  const byRef = new Map();
  for (const q of quizQuestions) {
    if (!byRef.has(q.ref)) byRef.set(q.ref, []);
    byRef.get(q.ref).push(q);
  }

  const verseCandidates = [];
  for (const questions of byRef.values()) {
    const pickable = questions.filter((q) =>
      isQuestionSelectable(q, quizSettings, typeFilter, selectOptions),
    );
    if (pickable.length > 0) verseCandidates.push(pickable);
  }

  if (verseCandidates.length === 0) return quizError();

  shuffleSortByCount(quizSettings.material);
  const selectedQues = randomElement(randomElement(verseCandidates));
  const section = quizSettings.material.find((s) =>
    quesInSection(selectedQues, s),
  );

  if (!section) return quizError();

  processFoundQues(
    selectedQues,
    section,
    quizQuestions,
    quizSettings,
    groupQuestions,
  );
  return selectedQues;
}

/** Picks a question in lenient mode, relaxing limits only when necessary. */
function pickQuestionLenient(quizQuestions, quizSettings, groupQuestions) {
  const underMinAndMax = (t) => t.count < t.min && t.count < t.max;
  const underMax = (t) => t.count < t.max;
  const respectLimits = { respectTypeMax: true, respectWLimit: true };

  const passes = [
    [underMinAndMax, respectLimits],
    [underMax, respectLimits],
    [() => true, { respectTypeMax: false, respectWLimit: true }],
    [() => true, { respectTypeMax: false, respectWLimit: false }],
  ];

  for (const [typeFilter, selectOptions] of passes) {
    const question = pickFromVerses(
      quizQuestions,
      quizSettings,
      groupQuestions,
      typeFilter,
      selectOptions,
    );
    if (question !== "Error") return question;
  }

  return quizError();
}

/** Finds matching questions in material sections and selects one. */
function findQuestionInMaterial(
  quizQuestions,
  quizSettings,
  groupQuestions,
  matchFn,
  { preferLowestCount = false } = {},
) {
  shuffleSortByCount(quizSettings.material);

  for (const section of quizSettings.material) {
    const matchedQuestions = [];
    for (const ques of quizQuestions) {
      if (matchFn(ques, section)) {
        matchedQuestions.push(ques);
      }
    }

    if (matchedQuestions.length === 0) continue;

    shuffleSortByCount(matchedQuestions);
    const selectedQues = preferLowestCount
      ? matchedQuestions[0]
      : randomElement(matchedQuestions);
    processFoundQues(
      selectedQues,
      section,
      quizQuestions,
      quizSettings,
      groupQuestions,
    );
    return selectedQues;
  }

  return quizError();
}

function getUnusedRef(refTypes, quizQuestions, quizSettings, groupQuestions) {
  return findQuestionInMaterial(
    quizQuestions,
    quizSettings,
    groupQuestions,
    (ques, section) =>
      quesInSection(ques, section) &&
      refTypes.includes(ques.typeDisplay) &&
      ques.count == 0 &&
      isQuestionSelectable(ques, quizSettings, () => true),
  );
}

function getUsedRef(refTypes, quizQuestions, quizSettings, groupQuestions) {
  return findQuestionInMaterial(
    quizQuestions,
    quizSettings,
    groupQuestions,
    (ques, section) =>
      quesInSection(ques, section) &&
      refTypes.includes(ques.typeDisplay) &&
      ques.count > 0,
    { preferLowestCount: true },
  );
}

function getRefQues(refTypes, quizQuestions, quizSettings, groupQuestions) {
  let refQues = getUnusedRef(
    refTypes,
    quizQuestions,
    quizSettings,
    groupQuestions,
  );

  if (refQues == "Error" && !quizSettings.resetUsedQues) {
    refQues = getUsedRef(refTypes, quizQuestions, quizSettings, groupQuestions);
  }

  return refQues;
}

function getUnusedQues(quesType, quizQuestions, quizSettings, groupQuestions) {
  return findQuestionInMaterial(
    quizQuestions,
    quizSettings,
    groupQuestions,
    (ques, section) =>
      quesInSection(ques, section) &&
      ques.type == quesType.type &&
      ques.count == 0 &&
      isQuestionSelectable(ques, quizSettings, () => true),
  );
}

function getUsedQues(quesType, quizQuestions, quizSettings, groupQuestions) {
  return findQuestionInMaterial(
    quizQuestions,
    quizSettings,
    groupQuestions,
    (ques, section) =>
      quesInSection(ques, section) &&
      ques.type == quesType.type &&
      ques.count > 0,
    { preferLowestCount: true },
  );
}

function getQuestion(quesType, quizQuestions, quizSettings, groupQuestions) {
  let ques = getUnusedQues(
    quesType,
    quizQuestions,
    quizSettings,
    groupQuestions,
  );

  if (ques == "Error" && !quizSettings.resetUsedQues) {
    ques = getUsedQues(quesType, quizQuestions, quizSettings, groupQuestions);
  }

  return ques;
}

/** Fills a quiz section (numeric or A&B) to the target count. */
function fillQuizSlots(
  targetCount,
  quizArray,
  quizQuestions,
  quizSettings,
  groupQuestions,
  sectionLabel,
  quizNum,
) {
  while (quizArray.length < targetCount) {
    if (quizQuestions.length === 0) {
      return setQuizError(QuizErrorReason.FILL_QUIZ, {
        section: sectionLabel,
        filled: quizArray.length,
        target: targetCount,
        poolRemaining: 0,
        quizNum,
        strictMode: quizSettings.strictMode,
      });
    }

    let question;

    if (quizSettings.strictMode) {
      const availableTypes = getTypesWithQuestions(
        quizSettings.quesTypes,
        quizQuestions,
        quizSettings,
      );

      if (availableTypes.length === 0) {
        return setQuizError(QuizErrorReason.FILL_QUIZ, {
          section: sectionLabel,
          filled: quizArray.length,
          target: targetCount,
          poolRemaining: quizQuestions.length,
          quizNum,
          strictMode: true,
        });
      }

      const quesType = randomElement(availableTypes);
      question = getQuestion(
        quesType,
        quizQuestions,
        quizSettings,
        groupQuestions,
      );

      if (question == "Error") {
        return setQuizError(QuizErrorReason.TYPE_PICK, {
          quesType: quesType.type,
          section: sectionLabel,
          filled: quizArray.length,
          target: targetCount,
          quizNum,
        });
      }
    } else {
      question = pickQuestionLenient(
        quizQuestions,
        quizSettings,
        groupQuestions,
      );

      if (question == "Error") {
        return setQuizError(QuizErrorReason.FILL_QUIZ, {
          section: sectionLabel,
          filled: quizArray.length,
          target: targetCount,
          poolRemaining: quizQuestions.length,
          quizNum,
          strictMode: false,
        });
      }
    }

    quizArray.push(question);
  }
}

/** Orders question types by scarcity for minimum-fill processing. */
function setTypeOrder(quesTypes, quizQuestions) {
  for (const ques of quizQuestions) {
    for (const quesType of quesTypes) {
      if (quesType.typeClubCombos.includes(ques.typeClub)) {
        quesType.quesAvailable++;
      }
    }
  }

  for (const quesType of quesTypes) {
    if (quesType.quesAvailable < quesType.min) {
      return setQuizError(QuizErrorReason.TYPE_ORDER, {
        quesType: quesType.type,
        quesAvailable: quesType.quesAvailable,
        minRequired: quesType.min,
        club: quesType.club,
      });
    }
    quesType.order = quesType.quesAvailable / quesType.min;
  }

  return quesTypes.sort((a, b) => a.order - b.order);
}

/** Adds required CVR/CR reference questions when ref minimum is at least 2. */
function addRequiredRefQuestions(
  quiz,
  quizQuestions,
  quizSettings,
  groupQuestions,
  quizNum,
) {
  if (!minTwoRefQues(quizSettings.quesTypes)) return null;

  const cvrQues = getRefQues(
    ["CVR", "CVRMA"],
    quizQuestions,
    quizSettings,
    groupQuestions,
  );
  if (cvrQues == "Error") {
    return setQuizError(QuizErrorReason.CVR_REQUIRED, { quizNum });
  }
  quiz.questions.push(cvrQues);

  const crQues = getRefQues(
    ["CR", "CRMA"],
    quizQuestions,
    quizSettings,
    groupQuestions,
  );
  if (crQues == "Error") {
    return setQuizError(QuizErrorReason.CR_REQUIRED, { quizNum });
  }
  quiz.questions.push(crQues);

  return null;
}

/** Fills each question type to its minimum count (Strict Mode only). */
function fillTypeMinimums(
  quiz,
  quizQuestions,
  quizSettings,
  groupQuestions,
  quizNum,
) {
  const orderedQuesTypes = setTypeOrder(quizSettings.quesTypes, quizQuestions);
  if (orderedQuesTypes == "Error") return "Error";
  quizSettings.quesTypes = orderedQuesTypes;

  for (const quesType of quizSettings.quesTypes) {
    while (quesType.count < quesType.min) {
      const question = getQuestion(
        quesType,
        quizQuestions,
        quizSettings,
        groupQuestions,
      );
      if (question == "Error") {
        return setQuizError(QuizErrorReason.TYPE_MINIMUM, {
          quesType: quesType.type,
          minRequired: quesType.min,
          countSoFar: quesType.count,
          quizNum,
        });
      }
      quiz.questions.push(question);
    }
  }

  return null;
}
