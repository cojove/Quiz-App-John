// WCD Quiz Generator by Colin Veldkamp
// August 2026

/*
 * INITIALIZE AFTER DOM CONTENT LOADED
 */
let allQuestions;

async function init() {
  // Load data from JohnData.json
  const response = await fetch("../JohnData.json");
  const johnData = await response.json();

  // Save questions globally for access from Event Listeners
  allQuestions = johnData.questions;

  // Populate Page based on data from json file
  createChSelectionDiv(johnData.materialInfo);
  createQTypeSelectionDiv(johnData.quesTypeInfo);
}

/*
 * EVENT LISTENERS
 */

// Initialize on DOM Content Loaded
document.addEventListener("DOMContentLoaded", init);

// Senior A Button Event Listener
document.getElementById("sr-a-btn").addEventListener("click", (e) => {
  // Set Question Types to Senior A Settings
  setAllQTypesChecked();
  setAllQTypesMinMaxReset();
  setAllQTypesClubs("Text", "Text", "Text", "Text", "Text", "Text");
});

// Rookie A Button Event Listener
document.getElementById("rk-a-btn").addEventListener("click", (e) => {
  // Set Question Types to Rookie A Settings
  setAllQTypesChecked();
  setAllQTypesMinMaxReset();
  setAllQTypesClubs("Text", "Text", "300", "150", "150", "300");
});

// B Division Button Event Listener
document.getElementById("b-div-btn").addEventListener("click", (e) => {
  // Set Question Types to B Division Settings
  setAllQTypesChecked();
  setAllQTypesMinMaxReset();
  setAllQTypesClubs("Text", "Text", "150", "150", "150", "150");
});

// Create Quizzes Button Event Listener
document.getElementById("create-qz-btn").addEventListener("click", (e) => {
  // Get and validate user selections.
  // Save in quizSettings and send to Python for quiz generation
  let quizSettings = {};

  // Get and Validate Chapter Selections
  let material = getSelectedChapters();
  if (!material) return false;
  quizSettings.material = material;

  // Get and Validate Question Type Selections
  let qTypes = getSelectedQTypes();
  if (!qTypes) return false;
  quizSettings.quesTypes = qTypes;

  // Get and Validate Quiz Settings
  let valid = getQuizSettings(quizSettings);
  if (!valid) return false;

  // Send Quiz Settings and All Questions for Quiz Creation
  let response = createQuizzes(allQuestions, quizSettings);
});

/*
 * EVENT LISTENER HELPER FUNCTIONS
 */

// Set all question type checkboxes to checked
function setAllQTypesChecked() {
  const checkboxEls = document.querySelectorAll(
    '.qtype-row input[type="checkbox"]',
  );
  for (checkbox of checkboxEls) {
    checkbox.checked = true;
  }
}

// Set all question type min/max to defaults
function setAllQTypesMinMaxReset() {
  document.getElementById("int-min").value = "7";
  document.getElementById("int-max").value = "14";
  document.getElementById("ma-min").value = "2";
  document.getElementById("ma-max").value = "4";
  document.getElementById("ref-min").value = "3";
  document.getElementById("ref-max").value = "5";
  document.getElementById("quote-min").value = "2";
  document.getElementById("quote-max").value = "3";
  document.getElementById("finish-min").value = "3";
  document.getElementById("finish-max").value = "5";
  document.getElementById("sit-min").value = "2";
  document.getElementById("sit-max").value = "4";
}

// Set all question type clubs to provided arguments
function setAllQTypesClubs(intClub, maClub, refClub, qtClub, ftvClub, sitClub) {
  document.getElementById("int-club").value = intClub;
  document.getElementById("ma-club").value = maClub;
  document.getElementById("ref-club").value = refClub;
  document.getElementById("quote-club").value = qtClub;
  document.getElementById("finish-club").value = ftvClub;
  document.getElementById("sit-club").value = sitClub;
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
    if (
      tempObj.startVerse < 1 ||
      tempObj.startVerse > tempObj.endVerse ||
      tempObj.endVerse > data.end
    ) {
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
    Text: [
      "Club 50",
      "Club 100",
      "Club 150",
      "Club 300",
      "Club 500",
      "Club Text",
    ],
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
    tempObj.typeClubCombos = createTypeClubCombos(
      tempObj.type,
      clubs[tempObj.club],
    );

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

function getQuizSettings(quizSettings) {
  // Get & Validate Quiz Title
  let quizTitle = document.getElementById("quiz-title").value;
  if (quizTitle.length == 0) {
    alert("Quiz Title cannot be empty.");
    return false;
  }
  quizSettings.quizTitle = quizTitle;

  // Get and Validate Number of Quizzes
  let numQuizzes = +document.getElementById("num-quizzes").value;
  if (numQuizzes < 1) {
    alert("Number of Quizzes must be at least 1.");
    return false;
  }
  quizSettings.numQuizzes = numQuizzes;

  // Get and Validate Maximum Ws
  let maxWs = +document.getElementById("max-w").value;
  if (maxWs < 0) {
    alert("Max Ws must be 0 or higher.");
    return false;
  }
  quizSettings.maxWs = maxWs;

  // Get Allow Duplicates
  quizSettings.allowDuplicateVerses =
    document.getElementById("allow-dupe").checked;

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

  // Get Extra Questions Selection
  quizSettings.extraQues = document.getElementById("extra-ques").checked;

  // Get Final Quiz Selection
  quizSettings.finalQuiz = document.getElementById("final-quiz").checked;

  // Add variable for the number of questions to put in a quiz
  // 20 + 5A + 5B questions
  quizSettings.numQuesInQuiz = 30;

  // Add variable to track number of "W" questions in a quiz
  quizSettings.wCount = 0;

  return true;
}

// DYNAMIC CELL RESIZING - change this to run when quizzes are displayed???
function fitTextToCell(element) {
  // Reset font size to a high starting point to recalculate downwards
  let fontSize = 16;
  element.style.fontSize = fontSize + "px";

  // Loop and shrink font size until text fits perfectly inside the cell boundaries
  while (
    (element.scrollHeight > element.clientHeight ||
      element.scrollWidth > element.clientWidth) &&
    fontSize > 8 // Stop shrinking at 8px so it doesn't become invisible
  ) {
    fontSize--;
    element.style.fontSize = fontSize + "px";
  }
}

// Automatically target and adjust all elements with the 'autofit-text' class
const textCells = document.querySelectorAll(".questions > div");

// Use ResizeObserver so it automatically recalculates if the parent grid container resizes
const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    fitTextToCell(entry.target);
  }
});

// Initialize the observer on your target cells
textCells.forEach((cell) => {
  // Initial run
  fitTextToCell(cell);
  // Watch for layout shifts
  resizeObserver.observe(cell);
});
