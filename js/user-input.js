// Function to deal with getting and validating user input

function getQuizSettings() {
  let quizSettings = {};

  // Get and Validate Chapter Selections
  let material = getSelectedChapters();
  if (!material) return "Error";
  quizSettings.material = material;

  // Get and Validate Question Type Selections
  let qTypes = getSelectedQTypes();
  if (!qTypes) return "Error";
  quizSettings.quesTypes = qTypes;

  // Get Quiz Title
  quizSettings.quizTitle = document.getElementById("quiz-title").value;

  // Get and Validate Number of Quizzes
  let numQuizzes = +document.getElementById("num-quizzes").value;
  if (numQuizzes < 1) {
    alert("Number of Quizzes must be at least 1.");
    return "Error";
  }
  quizSettings.numQuizzes = numQuizzes;

  // Get and Validate Maximum Ws
  quizSettings.strictWs = document.getElementById("max-w").checked;
  if (quizSettings.strictWs) {
    let maxWs = +document.getElementById("num-max-w").value;
    if (maxWs < 0) {
      alert("Max Ws must be 0 or higher.");
      return "Error";
    }
    quizSettings.maxWs = maxWs;
    quizSettings.wCount = 0;
  }

  // Get Allow Duplicates
  quizSettings.allowDuplicateVerses = document.getElementById("allow-dupe").checked;

  // Get Reset Used Questions
  quizSettings.resetUsedQues = document.getElementById("reset-ques").checked;

  // Get Max Question Use, if Reset Used is False
  if (!quizSettings.resetUsedQues) {
    let maxQuesUse = +document.getElementById("max-use").value;
    if (maxQuesUse < 0) {
      alert("Max Times a Question is Used must be 1 or higher.");
      return false;
    }
    quizSettings.maxQuesUse = maxQuesUse;
  }

  // Get Include A&B Questions Selection
  quizSettings.includeAB = document.getElementById("include-ab").checked;

  // // Get Extra Questions Selection
  // quizSettings.extraQues = document.getElementById("extra-ques").checked;

  // // Get Final Quiz Selection
  // quizSettings.finalQuiz = document.getElementById("final-quiz").checked;

  // Add variable to track number of "W" questions in a quiz

  // Get Strict min max mode
  quizSettings.strictMinMax = document.getElementById("strict-min-max").checked;

  return quizSettings;
}

// Return Selected Chapters as an array of Chapter Objects
function getSelectedChapters() {
  // Get and Validate selected Chapters
  let chapterEls = document.querySelectorAll("input[name='material']:checked");
  if (chapterEls.length == 0) {
    alert("No Chapters Selected.");
    return false;
  }

  // Create & Add Chapter Objects for each selected Chapter
  let temp = [];
  for (let i = 0; i < chapterEls.length; i++) {
    // Create Chapter Object
    let data = chapterEls[i].dataset;
    let tempObj = {
      book: data.book,
      ch: +data.ch,
      startVerse: +document.getElementById(`${data.id}-start`).value,
      endVerse: +document.getElementById(`${data.id}-end`).value,
      count: 0,
    };

    // Validate Start & End Verse
    if (tempObj.startVerse < 1 || tempObj.startVerse > tempObj.endVerse || tempObj.endVerse > data.end) {
      alert(`Invalid Verse Selection for ${tempObj.book} ${tempObj.ch}.`);
      return false;
    }

    // Validate weight
    let weight = +document.getElementById(`${data.id}-wt`).value;
    if (weight < 1) {
      alert(`Invalid Weight for ${tempObj.book} ${tempObj.ch}. `);
      return false;
    }

    // Add Chapter Object according to its weight
    for (let n = 0; n < weight; n++) {
      temp.push(tempObj);
    }
  }

  return temp;
}

// Return Selected Question Types as an array of Question Type Objects
function getSelectedQTypes() {
  // Initialize clubs variable for creating type-club combinations later

  let clubs = {
    50: ["Club 50"],
    100: ["Club 50", "Club 100"],
    150: ["Club 50", "Club 100", "Club 150"],
    300: ["Club 50", "Club 100", "Club 150", "Club 300"],
    500: ["Club 50", "Club 100", "Club 150", "Club 300", "Club 500"],
    Text: ["Club 50", "Club 100", "Club 150", "Club 300", "Club 500", "Club Text"],
  };

  // Get and Validate Selected Question Types
  let qTypeEls = document.querySelectorAll("input[name='qtypes']:checked");
  if (qTypeEls.length == 0) {
    alert("No Question Types Selected");
    return false;
  }

  // Create Question Type Objects for Selected Question Types
  // Validate min and max selections
  let temp = [];
  let minSum = 0;
  let maxSum = 0;
  for (let i = 0; i < qTypeEls.length; i++) {
    let qtype = qTypeEls[i].id;
    let tempObj = {
      type: qtype,
      min: +document.getElementById(`${qtype}-min`).value,
      max: +document.getElementById(`${qtype}-max`).value,
      club: document.getElementById(`${qtype}-club`).value,
      count: 0,
      quesAvailable: 0,
    };

    // Validate min < max
    if (tempObj.min > tempObj.max) {
      alert("Min cannot be greater than Max");
      return false;
    }

    // Add type-club combinations to tempObj
    tempObj.typeClubCombos = createTypeClubCombos(tempObj.type, clubs[tempObj.club]);

    // Add object to array
    temp.push(tempObj);

    // Update min and max sums for validation purposes
    minSum += tempObj.min;
    maxSum += tempObj.max;
  }

  // Validate min and max sums
  // mins must be satisfied in 1-20
  // maxs must not be exceeded in 1-20 and A&Bs
  if (minSum > 20) {
    alert("Min values cannot total more than 20");
    return false;
  }

  if (maxSum < 30) {
    alert("Max values must total 30 or more");
    return false;
  }

  return temp;
}

function createTypeClubCombos(typeStr, clubStrings) {
  let temp = [];
  for (clubStr of clubStrings) {
    temp.push(`${typeStr}-${clubStr}`);
  }
  return temp;
}
