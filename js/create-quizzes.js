/*
Primary Data Structures

allQuestions, groupQuestions, quizQuestions: arrays of question objects.
QUESTION OBJECT PROPERTIES:
- id (#)
- question
- answer
- book
- ch
- vs
- type ("int"|"ma"|"ref"|"quote"|"finish"|"sit")
- typeDisplay ("INT"|"MA"|"CVR"|"CRMA"|"FTV"|...)
- club ("Club 50"|"Club 100"|...)
- typeClub ("int-Club 50"|"ma-Club 100"|...)
- w ("W"|"")

QUIZSETTINGS.MATERIAL PROPERTIES:
- material (array of section objects)
- quesTypes (array of quesType objects)
- allowDuplicateVerses
- extraQues
- finalQuiz
- maxQuesUse
- maxWs
- numQuesInQuiz
- numQuizzes
- quizTitle
- resetUsedQues
- wCount

SECTION OBJECT PROPERTIES:
- book
- ch
- startVerse
- endVerse
- count

QUESTYPE OBJECT PROPERTIES
- type ("int"|"ma"|"ref"|"quote"|"finish"|"sit")
- club
- typeClubCombos (["int-Club 50", "int-Club 100", ...])
- min
- max
- count
- quesAvailable

*/

function createQuizzes(allQuestions, quizSettings) {
  // Make a deep copy of allQuestions and then filter questions based on quizSettings
  let groupQuestions = JSON.parse(JSON.stringify(allQuestions));
  groupQuestions = filterQuestions(groupQuestions, quizSettings);

  // Loop to get desired number of quizzes
  let quizzes = [];
  quizNum = 1;
  while (quizzes.length < quizSettings.numQuizzes) {
    let quiz = createQuiz(groupQuestions, quizSettings, quizNum);
    if (quiz == "Error") return { err: "Error", quizzes: quizzes };
    quizzes.push(quiz);
    quizNum++;
  }

  //   Check Final Quiz

  // Check Extra Questions

  return { err: "", quizzes: quizzes };
}

// ********************
// TIER 1 FUNCTIONS
// ********************

function filterQuestions(groupQuestions, quizSettings) {
  // Generate all possible TypeClub combinations by concatenating the typeClubCombos for each selected question type
  let selectedTypeClubCombos = [];
  for (let quesType of quizSettings.quesTypes) {
    selectedTypeClubCombos = selectedTypeClubCombos.concat(
      quesType.typeClubCombos,
    );
  }

  // Search for questions that meet quiz settings
  let filtered = [];
  for (let ques of groupQuestions) {
    if (
      quesInMaterial(ques, quizSettings.material) &&
      selectedTypeClubCombos.includes(ques.typeClub)
    ) {
      filtered.push(ques);
    }
  }

  return filtered;
}

// Create and return a single quiz, return "Error" if can't make quiz
function createQuiz(groupQuestions, quizSettings, quizNum) {
  // Check for enough possible questions
  if (groupQuestions.length < quizSettings.numQuesInQuiz) {
    return "Error";
  }

  // Init quiz variable to store quiz title and questions
  let quiz = {
    title: `#${quizNum}: ${quizSettings.quizTitle}`,
    questions: [],
    alphaQuestions: [],
  };

  //   Create deep copies of groupQuestions and quizSettings so that they are fresh versions for the current quiz.
  let quizQuestions = JSON.parse(JSON.stringify(groupQuestions));
  quizSettings = JSON.parse(JSON.stringify(quizSettings));

  // If "ref" selected with a min of 2, get a CVR and a CR question to meet requirements of at least one of each.
  if (minTwoRefQues(quizSettings.quesTypes)) {
    // Get CVR question
    let cvrQues = getRefQues(
      ["CVR", "CVRMA"],
      quizQuestions,
      quizSettings,
      groupQuestions,
    );
    if (cvrQues == "Error") return "Error";
    quiz.questions.push(cvrQues);

    // Get CR question
    let crQues = getRefQues(
      ["CR", "CRMA"],
      quizQuestions,
      quizSettings,
      groupQuestions,
    );
    if (crQues == "Error") return "Error";
    quiz.questions.push(crQues);
  }

  // Meet Minimum Question Type Requirements
  quizSettings.quesTypes = setTypeOrder(quizSettings.quesTypes, quizQuestions);
  if (quizSettings.quesType == "Error") return "Error";

  for (let quesType of quizSettings.quesTypes) {
    while (quesType.count < quesType.min) {
      let question = getQuestion(
        quesType,
        quizQuestions,
        quizSettings,
        groupQuestions,
      );
      if (question == "Error") return "Error";
      quiz.questions.push(question);
    }
  }

  // Randomly Select Remaining Numeric 1-20 Questions
  while (quiz.questions.length < 20) {
    let quesType = randomElement(quizSettings.quesTypes);
    if (!quesType) return "Error";
    let question = getQuestion(
      quesType,
      quizQuestions,
      quizSettings,
      groupQuestions,
    );
    if (question == "Error") return "Error";
    quiz.questions.push(question);
  }

  // Randomly Select 10 A&B Questions
  while (quiz.alphaQuestions.length < 10) {
    let quesType = randomElement(quizSettings.quesTypes);
    if (!quesType) return "Error";
    let question = getQuestion(
      quesType,
      quizQuestions,
      quizSettings,
      groupQuestions,
    );
    if (question == "Error") return "Error";
    quiz.alphaQuestions.push(question);
  }

  shuffle(quiz.questions);
  return quiz;
}

function getRefQues(refTypes, quizQuestions, quizSettings, groupQuestions) {
  // Try to find an unused question
  let refQues = getUnusedRef(
    refTypes,
    quizQuestions,
    quizSettings,
    groupQuestions,
  );

  // If no unused questions, try to find a used question, if applicable
  if (refQues == "Error" && !quizSettings.resetUsedQues) {
    refQues = getUsedRef(refTypes, quizQuestions, quizSettings, groupQuestions);
  }

  // Return Results: Found refQues or "Error"
  return refQues;
}

function getUnusedRef(refTypes, quizQuestions, quizSettings, groupQuestions) {
  // Shuffle and Sort material by count to look for questions starting from the least used material
  shuffleSortByCount(quizSettings.material);

  // Search material section by section for a ref question
  for (let section of quizSettings.material) {
    // Store all ref questions in matchedQuestions
    matchedQuestions = [];
    for (let ques of quizQuestions) {
      if (
        quesInSection(ques, section) &&
        refTypes.includes(ques.typeDisplay) &&
        ques.count == 0
      ) {
        matchedQuestions.push(ques);
      }
    }

    // If matching results found, Randomly Select a Question from matchedQuestions
    if (matchedQuestions.length != 0) {
      let selectedQues = randomElement(matchedQuestions);
      processFoundQues(
        selectedQues,
        section,
        quizQuestions,
        quizSettings,
        groupQuestions,
      );
      return selectedQues;
    }
  }
  //   Checked all sections and did not find a matching question
  return "Error";
}

function getUsedRef(refTypes, quizQuestions, quizSettings, groupQuestions) {
  // Shuffle and Sort material by count to look for questions starting from the least used material
  shuffleSortByCount(quizSettings.material);

  // Search material section by section for a ref question
  for (let section of quizSettings.material) {
    // Store all ref questions in matchedQuestions
    matchedQuestions = [];
    for (let ques of quizQuestions) {
      if (
        quesInSection(ques, section) &&
        refTypes.includes(ques.typeDisplay) &&
        ques.count > 0
      ) {
        matchedQuestions.push(ques);
      }
    }

    // If matching results found, shuffle and sort by count and get 1st question
    if (matchedQuestions.length != 0) {
      shuffleSortByCount(matchedQuestions);
      let selectedQues = matchedQuestions[0];
      processFoundQues(
        selectedQues,
        section,
        quizQuestions,
        quizSettings,
        groupQuestions,
      );
      return selectedQues;
    }
  }
  //   Checked all sections and did not find a matching question
  return "Error";
}

function getQuestion(quesType, quizQuestions, quizSettings, groupQuestions) {
  // Try to find an unused question
  let ques = getUnusedQues(
    quesType,
    quizQuestions,
    quizSettings,
    groupQuestions,
  );

  // If no unused questions, try to find a used question, if applicable
  if (ques == "Error" && !quizSettings.resetUsedQues) {
    ques = getUsedQues(quesType, quizQuestions, quizSettings, groupQuestions);
  }

  // Return Results: Found ques or "Error"
  return ques;
}

function getUnusedQues(quesType, quizQuestions, quizSettings, groupQuestions) {
  // Shuffle and Sort material by count to look for questions starting from the least used material
  shuffleSortByCount(quizSettings.material);

  // Try to find an unused question: search material section by section for a question of quesType
  for (let section of quizSettings.material) {
    // Store all matching questions in matchedQuestions
    matchedQuestions = [];
    for (let ques of quizQuestions) {
      if (
        quesInSection(ques, section) &&
        ques.type == quesType.type &&
        ques.count == 0
      ) {
        matchedQuestions.push(ques);
      }
    }

    // If matching results found, Randomly Select a Question from matchedQuestions
    if (matchedQuestions.length != 0) {
      let selectedQues = randomElement(matchedQuestions);
      processFoundQues(
        selectedQues,
        section,
        quizQuestions,
        quizSettings,
        groupQuestions,
      );
      return selectedQues;
    }
  }

  //   Checked all sections and did not find a matching question
  return "Error";
}

function getUsedQues(quesType, quizQuestions, quizSettings, groupQuestions) {
  // Shuffle and Sort material by count to look for questions starting from the least used material
  shuffleSortByCount(quizSettings.material);

  // Try to find an unused question: search material section by section for a question of quesType
  for (let section of quizSettings.material) {
    // Store all matching questions in matchedQuestions
    matchedQuestions = [];
    for (let ques of quizQuestions) {
      if (
        quesInSection(ques, section) &&
        ques.type == quesType.type &&
        ques.count > 0
      ) {
        matchedQuestions.push(ques);
      }
    }

    // If matching results found, shuffle and sort by count and get 1st question
    if (matchedQuestions.length != 0) {
      shuffleSortByCount(matchedQuestions);
      let selectedQues = matchedQuestions[0];
      processFoundQues(
        selectedQues,
        section,
        quizQuestions,
        quizSettings,
        groupQuestions,
      );
      return selectedQues;
    }
  }

  //   Checked all sections and did not find a matching question
  return "Error";
}

function processFoundQues(
  selectedQues,
  section,
  quizQuestions,
  quizSettings,
  groupQuestions,
) {
  // Remove question from quizQuestions
  let quizQuesIndex = quesIndexByID(quizQuestions, selectedQues.id);
  quizQuestions.splice(quizQuesIndex, 1);

  // If necessary, update question count in groupQuestions and remove question if used more than maxQuesUse
  if (!quizSettings.resetUsedQues) {
    let groupQuesIndex = quesIndexByID(groupQuestions, selectedQues.id);

    groupQuestions[groupQuesIndex].count++;
    if (groupQuestions[groupQuesIndex].count >= quizSettings.maxQuesUse) {
      groupQuestions.splice(groupQuesIndex, 1);
    }
  }

  // Remove duplicate verse questions if necessary
  if (!quizSettings.allowDuplicateVerses) {
    for (let i = quizQuestions.length - 1; i >= 0; i--) {
      if (quizQuestions[i].ref == selectedQues.ref) {
        quizQuestions.slice(i, 1);
      }
    }
  }

  // Check for update to "W" count and remove "W" questions if necessary
  if (selectedQues.w == "W") {
    quizSettings.wCount++;
    if (quizSettings.wCount >= quizSettings.maxWs) {
      for (let i = quizQuestions.length - 1; i >= 0; i--) {
        if (quizQuestions[i].w == "W") {
          quizQuestions.splice(i, 1);
        }
      }
    }
  }

  // Update question type count and remove questions of that type from quizQuestions and that question type from quesTypes, if necessary
  let quesTypeIndex = quesTypeIndexByType(
    selectedQues.type,
    quizSettings.quesTypes,
  );
  let quesType = quizSettings.quesTypes[quesTypeIndex];
  quesType.count++;
  if (quesType.count >= quesType.max) {
    quizSettings.quesTypes.splice(quesTypeIndex, 1);
    for (let i = quizQuestions.length - 1; i >= 0; i--) {
      if (quizQuestions[i].type == quesType.type) {
        quizQuestions.splice(i, 1);
      }
    }
  }

  // Update section count
  section.count++;
}

function setTypeOrder(quesTypes, quizQuestions) {
  // Count # of questions available for each question type
  for (let ques of quizQuestions) {
    for (let quesType of quesTypes) {
      if (quesType.typeClubCombos.includes(ques.typeClub)) {
        quesType.quesAvailable++;
      }
    }
  }

  // Calculate order precedence for each question type, as long as enough questions are available
  for (let quesType of quesTypes) {
    if (quesType.quesAvailable < quesType.min) return "Error";
    quesType.order = quesType.quesAvailable / quesType.min;
  }

  // Sort Question Types by "order" property (ascending)
  return quesTypes.sort((a, b) => a.order - b.order);
}
