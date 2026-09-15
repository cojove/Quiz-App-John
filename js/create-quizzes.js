function createQuizzes(allQuestions, settings) {
  // Make a deep copy of allQuestions and then filter questions based on quizSettings
  let groupQuestions = JSON.parse(JSON.stringify(allQuestions));
  groupQuestions = filterQuestions(groupQuestions, settings);

  // Loop to get desired number of quizzes
  let quizzes = [];
  quizNum = 1;
  while (quizzes.length < settings.numQuizzes) {
    let quiz = createQuiz(groupQuestions, settings, quizNum);
    if (quiz == "Error") return { err: "Error", quizzes: quizzes };
    quizzes.push(quiz);
    quizNum++;
  }

  // Check Final Quiz

  // Check Extra Questions

  return { err: "", quizzes: quizzes };
}

// Filter questions to match user settings
function filterQuestions(groupQuestions, settings) {
  // Generate all possible TypeClub combinations by concatenating the typeClubCombos for each selected question type
  let selectedTypeClubCombos = [];
  for (let quesType of settings.quesTypes) {
    selectedTypeClubCombos = selectedTypeClubCombos.concat(quesType.typeClubCombos);
  }

  // Search for questions that meet quiz settings
  let filtered = [];
  for (let ques of groupQuestions) {
    if (quesInMaterial(ques, settings.material) && selectedTypeClubCombos.includes(ques.typeClub)) {
      if (ques.w != "W" || (ques.w == "W" && !(settings.strictWs && settings.maxWs == 0))) {
        filtered.push(ques);
      }
    }
  }
  consoleLog(filtered);
  return filtered;
}

// Create and return a single quiz, return "Error" if can't make quiz
function createQuiz(groupQuestions, settings, quizNum) {
  // **** INIT QUIZ VARIABLES *****
  // Create deep copies of groupQuestions and quizSettings so that they are fresh versions for the current quiz.
  let quesPool = JSON.parse(JSON.stringify(groupQuestions));
  settings = JSON.parse(JSON.stringify(settings));

  // Init quiz variable to store quiz title and questions
  let quiz = {
    title: `#${quizNum}: ${settings.quizTitle}`,
    questions: [],
    alphaQuestions: [],
  };

  // ***** GET REQUIRED REFERENCE QUESTIONS *****
  // If "ref" selected with a min of 2, get a CVR and a CR question to meet requirements of at least one of each.
  if (minTwoRefQues(settings.quesTypes)) {
    // Get CVR question
    let res = getRefQues(["CVR", "CVRMA"], settings, quesPool, groupQuestions, quiz);
    if (res == "Error" && settings.strictMinMax) return "Error";

    // Get CR question
    res = getRefQues(["CR", "CRMA"], settings, quesPool, groupQuestions, quiz);
    if (res == "Error" && settings.strictMinMax) return "Error";
  }

  // ***** MEET MINIMUM QUESTION REQUIREMENTS *****
  // Set question type order based on supply and demand
  settings.quesTypes = setTypeOrder(settings, quesPool);
  if (settings.quesTypes == "Error") return "Error";

  // Try to satisfy minimum requirements with unused questions
  let allMinsFilled = getMinimumQuestions(settings, (n) => n == 0, quesPool, groupQuestions, quiz);

  // If necessary, try to satisfy minimum requirements with used questions
  if (!allMinsFilled) {
    allMinsFilled = getMinimumQuestions(settings, (n) => n > 0, quesPool, groupQuestions, quiz);
    if (!allMinsFilled & settings.strictMinMax) return "Error";
  }

  // ***** RANDOMLY SELECT REMAINING NUMERIC 1-20 QUESTIONS

  // Try to find unused questions to fill numeric questions
  fillWithRandomQuestions(quiz.questions, 20, settings, (n) => n == 0, quesPool, groupQuestions);

  // If necessary, try to find used questions to fill numeric questions
  if (!settings.resetUsedQues) {
    fillWithRandomQuestions(quiz.questions, 20, settings, (n) => n > 0, quesPool, groupQuestions);
  }

  // Check if successful in finding numeric questions
  if (quiz.questions.length != 20) return "Error";

  // ***** RANDOMLY SELECT 10 A&B QUESTIONS ***** (If selected)

  if (settings.includeAB) {
    // First try to find unused questions to fill AB questions
    fillWithRandomQuestions(quiz.alphaQuestions, 10, settings, (n) => n == 0, quesPool, groupQuestions);

    // If necessary, try to find used questions to fill AB questions
    if (!settings.resetUsedQues) {
      fillWithRandomQuestions(quiz.alphaQuestions, 10, settings, (n) => n > 0, quesPool, groupQuestions);
    }

    // Check if successful in finding numeric questions
    if (quiz.alphaQuestions.length != 10) return "Error";
  }

  shuffle(quiz.questions);
  shuffle(quiz.alphaQuestions);
  return quiz;
}

function getRefQues(refList, settings, quesPool, groupQuestions, quiz) {
  // First Try to get an unused CVR
  let refQues = getAQues(refList, matchTypeList, (n) => n == 0, settings, quesPool, groupQuestions);

  // If no unused CVR, try to get a used CVR (if not resetting questions)
  if (refQues == "Error" && !settings.resetUsedQues) {
    refQues = getAQues(refList, matchTypeList, (n) => n > 0, settings, quesPool, groupQuestions);
  }

  // Deal with found or unfound CVR question
  if (refQues == "Error") {
    console.log(`No ${refList}`);
    return "Error";
  } else {
    console.log(`${refList} Found`);
    quiz.questions.push(refQues);
  }
}

function getMinimumQuestions(settings, countTest, quesPool, groupQuestions, quiz) {
  let allMinsFilled = true;
  for (let quesType of settings.quesTypes) {
    while (quesType.count < quesType.min) {
      let question = getAQues(quesType.type, matchType, countTest, settings, quesPool, groupQuestions);
      if (question == "Error") {
        console.log("Error getting minimums", quesType);
        allMinsFilled = false;
        break;
      }
      quiz.questions.push(question);
    }
  }
  return allMinsFilled;
}

function fillWithRandomQuestions(arr, targetLength, settings, countTest, quesPool, groupQuestions) {
  while (arr.length < targetLength) {
    shuffle(settings.quesTypes);
    let quesFound = false;
    for (let quesType of settings.quesTypes) {
      let question = getAQues(quesType.type, matchType, countTest, settings, quesPool, groupQuestions);
      if (question != "Error") {
        arr.push(question);
        quesFound = true;
        break;
      }
    }
    // No question found after searching through all question types
    if (!quesFound) break;
  }
}

function getAQues(targetType, typeTest, countTest, settings, quesPool, groupQuestions) {
  // Shuffle and Sort material by count to look for questions starting from the least used material
  shuffleSortByCount(settings.material);

  // Try to find an unused question: search material section by section for a question of quesType
  for (let section of settings.material) {
    // Store all matching questions in matchedQuestions
    let matchedQuestions = quesPool.filter((ques) => typeTest(ques, section, targetType, countTest));

    // If matching results found, Randomly Select a Question from matchedQuestions
    if (matchedQuestions.length != 0) {
      shuffle(matchedQuestions);
      let selectedQues = matchedQuestions[0];
      processFoundQues(selectedQues, section, quesPool, settings, groupQuestions);
      return selectedQues;
    }
  }

  //   Checked all sections and did not find a matching question
  return "Error";
}

function processFoundQues(selectedQues, section, quesPool, settings, groupQuestions) {
  // Remove question from quesPool - Verified
  let quizQuesIndex = quesIndexByID(quesPool, selectedQues.id);
  quesPool.splice(quizQuesIndex, 1);

  // If necessary, update question count in groupQuestions and remove question if used more than maxQuesUse - Verified
  if (!settings.resetUsedQues) {
    let groupQuesIndex = quesIndexByID(groupQuestions, selectedQues.id);

    groupQuestions[groupQuesIndex].count++;
    if (groupQuestions[groupQuesIndex].count >= settings.maxQuesUse) {
      groupQuestions.splice(groupQuesIndex, 1);
    }
  }

  // Remove duplicate verse questions if necessary
  if (!settings.allowDuplicateVerses) {
    for (let i = quesPool.length - 1; i >= 0; i--) {
      if (quesPool[i].ref == selectedQues.ref) {
        quesPool.splice(i, 1);
      }
    }
  }

  // Check for update to "W" count and remove "W" questions if necessary
  if (selectedQues.w == "W" && settings.strictWs) {
    settings.wCount++;
    if (settings.wCount >= settings.maxWs) {
      for (let i = quesPool.length - 1; i >= 0; i--) {
        if (quesPool[i].w == "W") {
          quesPool.splice(i, 1);
        }
      }
    }
  }

  // Update question type count and remove questions of that type from quesPool and that question type from quesTypes, if necessary
  let quesTypeIndex = quesTypeIndexByType(selectedQues.type, settings.quesTypes);
  let quesType = settings.quesTypes[quesTypeIndex];
  quesType.count++;
  if (settings.strictMinMax && quesType.count >= quesType.max) {
    settings.quesTypes.splice(quesTypeIndex, 1);
    for (let i = quesPool.length - 1; i >= 0; i--) {
      if (quesPool[i].type == quesType.type) {
        quesPool.splice(i, 1);
      }
    }
  }

  // Update section count
  section.count++;
}

function setTypeOrder(settings, quesPool) {
  // Count # of questions available for each question type
  for (let ques of quesPool) {
    for (let quesType of settings.quesTypes) {
      if (quesType.typeClubCombos.includes(ques.typeClub)) {
        quesType.quesAvailable++;
      }
    }
  }

  // Calculate order precedence for each question type, as long as enough questions are available
  for (let quesType of settings.quesTypes) {
    if (settings.strictMinMax && quesType.quesAvailable < quesType.min) return "Error";
    quesType.order = quesType.quesAvailable / quesType.min;
  }

  // Sort Question Types by "order" property (ascending)
  return settings.quesTypes.sort((a, b) => a.order - b.order);
}
